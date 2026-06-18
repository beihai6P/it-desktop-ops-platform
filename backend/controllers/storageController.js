const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const iconv = require('iconv-lite');
const { StorageFile, FileChunk, DownloadToken } = require('../models/StorageFile');
const { getStorageAdapter } = require('../services/storageAdapter');
const {
  deleteFile,
  calculateMD5,
  calculateSHA256,
  calculateBufferMD5,
  getMimeType,
  getExtension,
  parseRangeHeader,
  generateETag,
  CHUNK_SIZE,
  generateDownloadToken,
  generateSignedUrl,
  fileExists,
  getFileSize,
  createReadStream,
  chunkExists,
  getUploadedChunks
} = require('../utils/fileUtils');

// 存储适配器实例（强制使用火山引擎对象存储）
const storageAdapter = getStorageAdapter();

// 文件类型白名单和大小限制配置
const FILE_TYPE_CONFIG = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxSize: 20 * 1024 * 1024, // 20MB
    friendlySize: '20MB'
  },
  video: {
    extensions: ['.mp4', '.mov'],
    maxSize: 200 * 1024 * 1024, // 200MB
    friendlySize: '200MB'
  },
  archive: {
    extensions: ['.zip', '.rar', '.7z'],
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    friendlySize: '2GB'
  }
};

/**
 * 校验文件类型和大小
 * @param {string} filename - 文件名
 * @param {number} fileSize - 文件大小（字节）
 * @returns {object} { valid: boolean, message: string }
 */
const validateFileUpload = (filename, fileSize) => {
  const ext = path.extname(filename).toLowerCase();
  
  // 查找匹配的文件类型
  let matchedType = null;
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(ext)) {
      matchedType = type;
      break;
    }
  }
  
  if (!matchedType) {
    const allowedTypes = Object.values(FILE_TYPE_CONFIG).flatMap(c => c.extensions);
    return {
      valid: false,
      message: `不支持的文件类型 "${ext}"，仅支持：${allowedTypes.join('、')}`
    };
  }
  
  const config = FILE_TYPE_CONFIG[matchedType];
  if (fileSize > config.maxSize) {
    return {
      valid: false,
      message: `不好意思嗷~文件太大啦~吃不下哦！ᔦ ° ꒳ ° ᔨ ̖́- （${matchedType === 'image' ? '图片' : matchedType === 'video' ? '视频' : '压缩包'}最大${config.friendlySize}）`
    };
  }
  
  return {
    valid: true,
    message: '校验通过',
    type: matchedType,
    config
  };
};

// 上传进度存储
const uploadProgress = new Map();

/**
 * 初始化存储系统
 */
const initializeStorage = async () => {
  try {
    // 初始化火山引擎对象存储
    try {
      await storageAdapter.init();
      console.log('✅ 火山引擎对象存储初始化成功');
    } catch (error) {
      console.error('⚠️ 火山引擎对象存储初始化失败:', error.message);
      console.warn('⚠️ 上传功能将不可用，请在火山引擎控制台创建Bucket');
    }
  } catch (error) {
    console.error('❌ 存储系统初始化失败:', error);
  }
};

// 初始化
initializeStorage();

/**
 * 上传文件
 * POST /api/storage/upload
 */
const fixFilenameEncoding = (filename) => {
  if (!filename) return filename;
  
  try {
    const hasChinese = /[\u4e00-\u9fff]/.test(filename);
    
    if (hasChinese) {
      return filename;
    }
    
    const hasLatin1 = /[\x80-\xff]/.test(filename);
    
    if (!hasLatin1) {
      return filename;
    }
    
    const latin1Buffer = Buffer.from(filename, 'latin1');
    const gbkDecoded = iconv.decode(latin1Buffer, 'gbk');
    
    if (!gbkDecoded.includes('\ufffd')) {
      const hasGbkChinese = /[\u4e00-\u9fff]/.test(gbkDecoded);
      if (hasGbkChinese) {
        console.log(`[文件名修复] Latin1->GBK成功: ${filename} -> ${gbkDecoded}`);
        return gbkDecoded;
      }
    }
    
  } catch (e) {
    console.warn(`[文件名编码修复失败]: ${e.message}`);
  }
  
  return filename;
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const file = req.file;
    
    const originalFilename = fixFilenameEncoding(file.originalname);
    console.log(`[上传] 原始文件名: ${file.originalname}, 修复后: ${originalFilename}`);

    const {
      category = 'other',
      toolId,
      description = '',
      tags,
      accessLevel = 'private',
      allowedRoles,
      allowedUsers,
      enableHotlinkProtection = 'false',
      allowedReferers,
      ipWhitelist,
      ipBlacklist,
      downloadRateLimit = 0,
      expiresAt
    } = req.body;

    // 1. 校验请求头中的文件大小（第一次校验）
    const contentLength = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0;
    
    // 获取文件的实际大小
    const actualSize = file.size;
    
    console.log(`[上传校验] 请求头大小: ${contentLength}, 实际文件大小: ${actualSize}`);
    
    // 2. 二次校验：请求头大小与实际文件大小对比（防止绕过）
    if (contentLength > 0 && Math.abs(contentLength - actualSize) > 1024) {
      await deleteFile(file.path);
      return res.status(400).json({ 
        message: '文件大小校验失败，请求头与实际文件大小不一致' 
      });
    }
    
    // 3. 校验文件类型和大小（白名单校验）
    const validationResult = validateFileUpload(originalFilename, actualSize);
    if (!validationResult.valid) {
      await deleteFile(file.path);
      return res.status(400).json({ 
        message: validationResult.message 
      });
    }
    
    console.log(`[上传校验] 文件类型: ${validationResult.type}, 大小: ${actualSize}字节, 限制: ${validationResult.config.friendlySize}`);

    // 计算文件哈希
    const md5Hash = await calculateMD5(file.path);
    const sha256Hash = await calculateSHA256(file.path);

    // 检查是否已存在相同文件（去重）
    const existingFile = await StorageFile.findOne({ 'hash.sha256': sha256Hash, status: 'active' });
    if (existingFile) {
      await deleteFile(file.path);
      return res.status(409).json({ 
        message: '文件已存在',
        existingFile: {
          fileId: existingFile.fileId,
          originalName: existingFile.originalName,
          size: existingFile.size
        }
      });
    }

    // 生成文件信息
    const fileId = StorageFile.generateFileId();
    const storageName = StorageFile.generateStorageName(file.originalname);
    
    // 构造存储对象键
    const objectKey = `${validationResult.type}/${storageName}`;
    
    // 读取文件并上传到火山引擎对象存储
    const fileBuffer = await fs.promises.readFile(file.path);
    
    // 三次校验：读取后再次校验大小（防止篡改）
    if (fileBuffer.length !== actualSize) {
      await deleteFile(file.path);
      return res.status(400).json({ 
        message: '文件内容校验失败，文件可能被篡改' 
      });
    }
    
    console.log(`[上传] 开始上传到火山引擎对象存储, 对象键: ${objectKey}`);
    
    // 上传到火山引擎对象存储（在调用之前已完成所有校验）
    await storageAdapter.putObject(objectKey, fileBuffer, {
      contentType: getMimeType(file.originalname),
      contentLength: file.size,
    });
    
    console.log(`[上传] 火山引擎对象存储上传成功`);
    
    // 删除临时文件
    await deleteFile(file.path);

    // 获取存储URL
    const storageUrl = storageAdapter.getObjectUrl(objectKey);

    // 创建文件记录
    const storageFile = await StorageFile.create({
      fileId,
      originalName: originalFilename,
      storageName,
      extension: getExtension(originalFilename),
      mimeType: getMimeType(originalFilename),
      size: file.size,
      hash: {
        md5: md5Hash,
        sha256: sha256Hash
      },
      storagePath: objectKey,
      storageType: 'volcengine',
      storageUrl,
      toolId: toolId || null,
      category: validationResult.type,
      accessLevel,
      allowedRoles: allowedRoles ? allowedRoles.split(',').map(r => r.trim()) : [],
      allowedUsers: allowedUsers ? allowedUsers.split(',').map(u => u.trim()) : [],
      uploadedBy: req.user._id,
      metadata: {
        description,
        tags: tags ? tags.split(',').map(t => t.trim()) : []
      },
      enableHotlinkProtection: enableHotlinkProtection === 'true',
      allowedReferers: allowedReferers ? allowedReferers.split(',').map(r => r.trim()) : [],
      ipWhitelist: ipWhitelist ? ipWhitelist.split(',').map(ip => ip.trim()) : [],
      ipBlacklist: ipBlacklist ? ipBlacklist.split(',').map(ip => ip.trim()) : [],
      downloadRateLimit: parseInt(downloadRateLimit, 10) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.status(201).json({
      message: '文件上传成功',
      file: {
        fileId: storageFile.fileId,
        originalName: storageFile.originalName,
        size: storageFile.size,
        mimeType: storageFile.mimeType,
        category: storageFile.category,
        accessLevel: storageFile.accessLevel,
        uploadedAt: storageFile.uploadedAt,
        storageType: 'volcengine',
        storageUrl,
        hash: {
          md5: storageFile.hash.md5,
          sha256: storageFile.hash.sha256
        }
      }
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    // 清理临时文件
    if (req.file && req.file.path) {
      try {
        await deleteFile(req.file.path);
      } catch (e) {
        console.error('清理临时文件失败:', e);
      }
    }
    res.status(500).json({ message: '文件上传失败', error: error.message });
  }
};

/**
 * 初始化分片上传
 * POST /api/storage/multipart/init
 */
const initMultipartUpload = async (req, res) => {
  try {
    const {
      filename,
      fileSize,
      category = 'tool',
      toolId,
      description = '',
      accessLevel = 'private',
      chunkSize
    } = req.body;

    if (!filename || !fileSize) {
      return res.status(400).json({ message: '缺少文件名或文件大小' });
    }

    // 校验文件类型和大小（白名单校验）
    const validationResult = validateFileUpload(filename, fileSize);
    if (!validationResult.valid) {
      return res.status(400).json({ 
        message: validationResult.message 
      });
    }

    console.log(`[分片上传初始化] 文件类型: ${validationResult.type}, 大小: ${fileSize}字节, 限制: ${validationResult.config.friendlySize}`);

    // 生成上传ID
    const uploadId = crypto.randomBytes(16).toString('hex');
    const actualChunkSize = chunkSize || CHUNK_SIZE;
    const totalChunks = Math.ceil(fileSize / actualChunkSize);

    // 存储上传会话
    uploadSessions.set(uploadId, {
      filename,
      fileSize,
      category: validationResult.type,
      toolId,
      description,
      accessLevel,
      chunkSize: actualChunkSize,
      totalChunks,
      uploadedChunks: [],
      userId: req.user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
      uploadParts: [] // 存储已上传的分片信息（用于合并）
    });

    // 初始化进度
    uploadProgress.set(uploadId, {
      total: totalChunks,
      uploaded: 0,
      percentage: 0
    });

    res.json({
      uploadId,
      chunkSize: actualChunkSize,
      totalChunks,
      expiresAt: uploadSessions.get(uploadId).expiresAt
    });
  } catch (error) {
    console.error('初始化分片上传错误:', error);
    res.status(500).json({ message: '初始化分片上传失败', error: error.message });
  }
};

/**
 * 上传分片
 * POST /api/storage/multipart/chunk
 */
const uploadChunk = async (req, res) => {
  try {
    const { uploadId, chunkIndex, chunkHash } = req.body;

    if (!uploadId || chunkIndex === undefined) {
      return res.status(400).json({ message: '缺少上传ID或分片索引' });
    }

    // 检查上传会话
    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ message: '上传会话不存在或已过期' });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权访问此上传会话' });
    }

    if (session.expiresAt < new Date()) {
      uploadSessions.delete(uploadId);
      uploadProgress.delete(uploadId);
      return res.status(410).json({ message: '上传会话已过期' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '没有上传分片数据' });
    }

    // 验证分片哈希
    const actualHash = calculateBufferMD5(req.file.buffer);
    if (chunkHash && chunkHash !== actualHash) {
      return res.status(400).json({ 
        message: '分片哈希校验失败',
        expected: chunkHash,
        actual: actualHash
      });
    }

    // 如果还没有初始化火山引擎分片上传，先初始化
    if (!session.uploadIdVolc) {
      const storageName = StorageFile.generateStorageName(session.filename);
      const objectKey = `${session.category}/${storageName}`;
      
      const initResult = await storageAdapter.initMultipartUpload(objectKey, {
        contentType: getMimeType(session.filename)
      });
      
      session.uploadIdVolc = initResult.uploadId;
      session.objectKey = objectKey;
      console.log(`[分片上传] 初始化火山引擎分片上传成功, uploadId: ${session.uploadIdVolc}`);
    }

    // 上传分片到火山引擎对象存储
    const partNumber = parseInt(chunkIndex, 10) + 1; // 火山引擎分片编号从1开始
    const uploadResult = await storageAdapter.uploadPart(
      session.objectKey,
      partNumber,
      session.uploadIdVolc,
      req.file.buffer
    );

    // 记录分片信息
    session.uploadParts.push({
      partNumber,
      etag: uploadResult.etag
    });

    // 更新上传进度
    const progress = uploadProgress.get(uploadId);
    if (progress) {
      if (!session.uploadedChunks.includes(chunkIndex)) {
        session.uploadedChunks.push(parseInt(chunkIndex, 10));
        progress.uploaded = session.uploadedChunks.length;
        progress.percentage = Math.round((progress.uploaded / progress.total) * 100);
      }
    }

    res.json({
      message: '分片上传成功',
      chunkIndex: parseInt(chunkIndex, 10),
      chunkHash: actualHash,
      progress: uploadProgress.get(uploadId)
    });
  } catch (error) {
    console.error('分片上传错误:', error);
    res.status(500).json({ message: '分片上传失败', error: error.message });
  }
};

/**
 * 获取上传进度
 * GET /api/storage/multipart/progress/:uploadId
 */
const getUploadProgress = async (req, res) => {
  try {
    const { uploadId } = req.params;

    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ message: '上传会话不存在' });
    }

    const progress = uploadProgress.get(uploadId);
    
    res.json({
      uploadId,
      totalChunks: session.totalChunks,
      uploadedChunks: session.uploadedChunks,
      progress: progress || { total: session.totalChunks, uploaded: 0, percentage: 0 }
    });
  } catch (error) {
    console.error('获取上传进度错误:', error);
    res.status(500).json({ message: '获取上传进度失败', error: error.message });
  }
};

/**
 * 完成分片上传
 * POST /api/storage/multipart/complete
 */
const completeMultipartUpload = async (req, res) => {
  try {
    const { uploadId, fileHash } = req.body;

    if (!uploadId) {
      return res.status(400).json({ message: '缺少上传ID' });
    }

    // 检查上传会话
    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ message: '上传会话不存在或已过期' });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权访问此上传会话' });
    }

    // 检查所有分片是否已上传
    if (session.uploadedChunks.length !== session.totalChunks) {
      return res.status(400).json({ 
        message: '分片未完全上传',
        expected: session.totalChunks,
        uploaded: session.uploadedChunks.length,
        missingChunks: Array.from({ length: session.totalChunks }, (_, i) => i).filter(i => !session.uploadedChunks.includes(i))
      });
    }

    // 检查是否有火山引擎分片上传ID
    if (!session.uploadIdVolc || !session.objectKey) {
      return res.status(500).json({ message: '分片上传未正确初始化' });
    }

    console.log(`[分片上传完成] 合并分片, uploadId: ${session.uploadIdVolc}, objectKey: ${session.objectKey}`);

    // 按分片编号排序
    const sortedParts = session.uploadParts.sort((a, b) => a.partNumber - b.partNumber);

    // 合并分片（在火山引擎对象存储中）
    await storageAdapter.completeMultipartUpload(
      session.objectKey,
      session.uploadIdVolc,
      sortedParts
    );

    console.log(`[分片上传完成] 火山引擎对象存储合并成功`);

    // 获取文件信息
    const fileInfo = await storageAdapter.getObjectInfo(session.objectKey);
    if (!fileInfo) {
      return res.status(500).json({ message: '无法获取上传后的文件信息' });
    }

    const actualSize = fileInfo.contentLength;

    // 验证文件大小
    if (actualSize !== session.fileSize) {
      await storageAdapter.deleteObject(session.objectKey);
      return res.status(400).json({ 
        message: '文件大小不匹配',
        expected: session.fileSize,
        actual: actualSize
      });
    }

    // 生成文件信息
    const fileId = StorageFile.generateFileId();
    const storageName = StorageFile.generateStorageName(session.filename);

    // 创建文件记录
    const storageFile = await StorageFile.create({
      fileId,
      originalName: session.filename,
      storageName,
      extension: getExtension(session.filename),
      mimeType: getMimeType(session.filename),
      size: actualSize,
      hash: {
        md5: '', // 分片上传暂不计算MD5
        sha256: '' // 分片上传暂不计算SHA256
      },
      storagePath: session.objectKey,
      storageType: 'volcengine',
      storageUrl: storageAdapter.getObjectUrl(session.objectKey),
      toolId: session.toolId || null,
      category: session.category,
      accessLevel: session.accessLevel,
      allowedRoles: [],
      allowedUsers: [],
      uploadedBy: req.user._id,
      metadata: {
        description: session.description,
        tags: []
      },
      enableHotlinkProtection: false,
      allowedReferers: [],
      ipWhitelist: [],
      ipBlacklist: [],
      downloadRateLimit: 0,
      expiresAt: null
    });

    // 清理上传会话
    uploadSessions.delete(uploadId);
    uploadProgress.delete(uploadId);

    res.status(201).json({
      message: '文件上传成功',
      file: {
        fileId: storageFile.fileId,
        originalName: storageFile.originalName,
        size: storageFile.size,
        mimeType: storageFile.mimeType,
        category: storageFile.category,
        accessLevel: storageFile.accessLevel,
        uploadedAt: storageFile.uploadedAt,
        storageType: 'volcengine'
      }
    });
  } catch (error) {
    console.error('完成分片上传错误:', error);
    // 清理资源
    const session = uploadSessions.get(uploadId);
    if (session && session.uploadIdVolc && session.objectKey) {
      try {
        await storageAdapter.abortMultipartUpload(session.objectKey, session.uploadIdVolc);
      } catch (e) {
        console.error('清理分片上传会话失败:', e);
      }
    }
    uploadSessions.delete(uploadId);
    uploadProgress.delete(uploadId);
    res.status(500).json({ message: '完成分片上传失败', error: error.message });
  }
};
/**
 * 取消分片上传
 * DELETE /api/storage/multipart/:uploadId
 */
const abortMultipartUpload = async (req, res) => {
  try {
    const { uploadId } = req.params;

    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ message: '上传会话不存在' });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权取消此上传会话' });
    }

    // 如果有火山引擎分片上传ID，取消远程上传
    if (session.uploadIdVolc && session.objectKey) {
      try {
        await storageAdapter.abortMultipartUpload(session.objectKey, session.uploadIdVolc);
        console.log(`[取消分片上传] 已取消火山引擎分片上传, uploadId: ${session.uploadIdVolc}`);
      } catch (error) {
        console.error('取消火山引擎分片上传失败:', error);
        // 忽略错误，继续清理本地会话
      }
    }

    // 删除会话
    uploadSessions.delete(uploadId);
    uploadProgress.delete(uploadId);

    res.json({ message: '上传已取消' });
  } catch (error) {
    console.error('取消分片上传错误:', error);
    res.status(500).json({ message: '取消分片上传失败', error: error.message });
  }
};

/**
 * 下载文件
 * GET /api/storage/download/:fileId
 */
const downloadFile = async (req, res) => {
  try {
    const file = req.storageFile;
    const objectKey = file.storagePath; // 火山引擎模式下，storagePath是objectKey

    // 通过存储适配器获取文件信息
    const fileInfo = await storageAdapter.getObjectInfo(objectKey);
    if (!fileInfo) {
      return res.status(404).json({ message: '文件不存在' });
    }

    const fileSize = fileInfo.contentLength;
    const rangeHeader = req.headers.range;

    // 处理Range请求（断点续传）
    if (rangeHeader) {
      const ranges = parseRangeHeader(rangeHeader, fileSize);
      
      if (!ranges) {
        return res.status(416).json({ message: '请求范围无效' });
      }

      // 单段Range请求
      if (ranges.length === 1) {
        const { start, end } = ranges[0];
        const chunkSize = end - start + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Type', file.mimeType);
        
        // 处理中文文件名编码（RFC 5987标准）
        const encodedFilename = encodeURIComponent(file.originalName);
        const asciiFilename = file.originalName.replace(/[^\x00-\x7F]/g, '_').replace(/"/g, '\\"');
        
        res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('ETag', generateETag(file.hash.sha256, file.size, file.updatedAt));
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Last-Modified', file.updatedAt.toUTCString());

        const result = await storageAdapter.getObjectStream(objectKey, { start, end });
        result.stream.pipe(res);

        result.stream.on('error', (error) => {
          console.error('文件流错误:', error);
          if (!res.headersSent) {
            res.status(500).json({ message: '文件读取失败' });
          }
        });

        result.stream.on('end', () => {
          file.incrementDownload(chunkSize);
        });

        return;
      }

      // 多段Range请求（简化处理，只返回第一段）
      const { start, end } = ranges[0];
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', file.mimeType);
      
      // 处理中文文件名编码（RFC 5987标准）
      const encodedFilename = encodeURIComponent(file.originalName);
      const asciiFilename = file.originalName.replace(/[^\x00-\x7F]/g, '_').replace(/"/g, '\\"');
      
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('ETag', generateETag(file.hash.sha256, file.size, file.updatedAt));
      res.setHeader('Accept-Ranges', 'bytes');

      const result = await storageAdapter.getObjectStream(objectKey, { start, end });
      result.stream.pipe(res);

      result.stream.on('end', () => {
        file.incrementDownload(chunkSize);
      });

      return;
    }

    // 完整文件下载
    res.setHeader('Content-Type', file.mimeType);
    
    // 处理中文文件名编码（RFC 5987标准）
    const encodedFilename = encodeURIComponent(file.originalName);
    // 创建ASCII备用文件名（去掉中文等特殊字符）
    const asciiFilename = file.originalName.replace(/[^\x00-\x7F]/g, '_');
    
    // 设置Content-Disposition，同时支持filename*（UTF-8）和filename（ASCII备用）
    res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('ETag', generateETag(file.hash.sha256, file.size, file.updatedAt));
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Last-Modified', file.updatedAt.toUTCString());

    // 检查If-None-Match（缓存验证）
    const ifNoneMatch = req.headers['if-none-match'];
    const etag = generateETag(file.hash.sha256, file.size, file.updatedAt);
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }

    // 检查If-Modified-Since
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince) {
      const modifiedDate = new Date(ifModifiedSince);
      if (modifiedDate >= file.updatedAt) {
        return res.status(304).end();
      }
    }

    const result = await storageAdapter.getObjectStream(objectKey);
    result.stream.pipe(res);

    result.stream.on('error', (error) => {
      console.error('文件流错误:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: '文件读取失败' });
      }
    });

    result.stream.on('end', () => {
      file.incrementDownload(fileSize);
    });
  } catch (error) {
    console.error('文件下载错误:', error);
    res.status(500).json({ message: '文件下载失败', error: error.message });
  }
};

/**
 * 获取文件信息
 * GET /api/storage/info/:fileId
 */
const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await StorageFile.findOne({ fileId, status: 'active' });

    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 检查访问权限
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const accessResult = file.checkAccess(req.user, clientIp);
    
    if (!accessResult.allowed) {
      return res.status(403).json({ message: accessResult.reason });
    }

    res.json({
      fileId: file.fileId,
      originalName: file.originalName,
      size: file.size,
      formattedSize: formatFileSize(file.size),
      mimeType: file.mimeType,
      extension: file.extension,
      category: file.category,
      accessLevel: file.accessLevel,
      uploadedAt: file.uploadedAt,
      updatedAt: file.updatedAt,
      downloadCount: file.downloadCount,
      currentVersion: file.currentVersion,
      metadata: file.metadata,
      hash: {
        md5: file.hash.md5,
        sha256: file.hash.sha256
      }
    });
  } catch (error) {
    console.error('获取文件信息错误:', error);
    res.status(500).json({ message: '获取文件信息失败', error: error.message });
  }
};

/**
 * 获取文件列表
 * GET /api/storage/files
 */
const listFiles = async (req, res) => {
  try {
    const {
      category,
      accessLevel,
      page = 1,
      limit = 20,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = { status: 'active' };

    // 管理员可以看到所有文件，普通用户只能看到自己上传的或公开的文件
    if (req.user.role !== 'admin') {
      query.$or = [
        { uploadedBy: req.user._id },
        { accessLevel: 'public' },
        { allowedUsers: req.user._id }
      ];
    }

    if (category) query.category = category;
    if (accessLevel) query.accessLevel = accessLevel;
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { 'metadata.description': { $regex: search, $options: 'i' } },
        { 'metadata.tags': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const files = await StorageFile.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10))
      .populate('uploadedBy', 'name email');

    const total = await StorageFile.countDocuments(query);

    res.json({
      files: files.map(f => ({
        fileId: f.fileId,
        originalName: f.originalName,
        size: f.size,
        formattedSize: formatFileSize(f.size),
        mimeType: f.mimeType,
        category: f.category,
        accessLevel: f.accessLevel,
        uploadedAt: f.uploadedAt,
        downloadCount: f.downloadCount,
        uploadedBy: f.uploadedBy
      })),
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({ message: '获取文件列表失败', error: error.message });
  }
};

/**
 * 删除文件
 * DELETE /api/storage/files/:fileId
 */
const deleteFileRecord = async (req, res) => {
  try {
    const file = req.storageFile;

    // 软删除
    file.status = 'deleted';
    file.updatedAt = new Date();
    await file.save();

    // 删除物理文件
    try {
      await deleteFile(file.storagePath);
    } catch (error) {
      console.warn('删除物理文件失败:', error);
    }

    res.json({ message: '文件已删除' });
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({ message: '删除文件失败', error: error.message });
  }
};

/**
 * 更新文件信息
 * PUT /api/storage/files/:fileId
 */
const updateFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    const {
      description,
      tags,
      accessLevel,
      allowedRoles,
      allowedUsers,
      enableHotlinkProtection,
      allowedReferers,
      ipWhitelist,
      ipBlacklist,
      downloadRateLimit
    } = req.body;

    const file = await StorageFile.findOne({ fileId, status: 'active' });
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 权限检查
    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限修改此文件' });
    }

    // 更新字段
    if (description !== undefined) file.metadata.description = description;
    if (tags !== undefined) file.metadata.tags = tags;
    if (accessLevel !== undefined) file.accessLevel = accessLevel;
    if (allowedRoles !== undefined) file.allowedRoles = allowedRoles;
    if (allowedUsers !== undefined) file.allowedUsers = allowedUsers;
    if (enableHotlinkProtection !== undefined) file.enableHotlinkProtection = enableHotlinkProtection;
    if (allowedReferers !== undefined) file.allowedReferers = allowedReferers;
    if (ipWhitelist !== undefined) file.ipWhitelist = ipWhitelist;
    if (ipBlacklist !== undefined) file.ipBlacklist = ipBlacklist;
    if (downloadRateLimit !== undefined) file.downloadRateLimit = downloadRateLimit;

    file.updatedAt = new Date();
    await file.save();

    res.json({
      message: '文件信息已更新',
      file: {
        fileId: file.fileId,
        accessLevel: file.accessLevel,
        metadata: file.metadata
      }
    });
  } catch (error) {
    console.error('更新文件信息错误:', error);
    res.status(500).json({ message: '更新文件信息失败', error: error.message });
  }
};

/**
 * 生成下载令牌
 * POST /api/storage/token/:fileId
 */
const createDownloadToken = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { expiresIn = 3600, downloadLimit = 1 } = req.body;

    const file = await StorageFile.findOne({ fileId, status: 'active' });
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 检查访问权限
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const accessResult = file.checkAccess(req.user, clientIp);
    
    if (!accessResult.allowed) {
      return res.status(403).json({ message: accessResult.reason });
    }

    // 生成令牌
    const token = generateDownloadToken(fileId, req.user._id.toString(), expiresIn);

    // 存储到数据库
    await DownloadToken.create({
      token,
      fileId: file._id,
      userId: req.user._id,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      downloadLimit,
      downloadCount: 0,
      ipAddress: clientIp,
      userAgent: req.headers['user-agent']
    });

    res.json({
      token,
      expiresIn,
      downloadUrl: `/api/storage/download/token/${token}`,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    });
  } catch (error) {
    console.error('生成下载令牌错误:', error);
    res.status(500).json({ message: '生成下载令牌失败', error: error.message });
  }
};

/**
 * 使用令牌下载文件
 * GET /api/storage/download/token/:token
 */
const downloadWithToken = async (req, res) => {
  try {
    const { token } = req.params;

    // 查找令牌
    const tokenRecord = await DownloadToken.findOne({ token }).populate('fileId');
    
    if (!tokenRecord) {
      return res.status(401).json({ message: '下载令牌无效' });
    }

    // 检查是否过期
    if (tokenRecord.expiresAt < new Date()) {
      await DownloadToken.deleteOne({ token });
      return res.status(401).json({ message: '下载令牌已过期' });
    }

    // 检查下载次数
    if (tokenRecord.downloadCount >= tokenRecord.downloadLimit) {
      return res.status(403).json({ message: '下载次数已用完' });
    }

    const file = tokenRecord.fileId;
    if (!file || file.status !== 'active') {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 检查物理文件
    if (!await fileExists(file.storagePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 更新下载计数
    tokenRecord.downloadCount++;
    await tokenRecord.save();

    // 设置响应头
    const fileSize = await getFileSize(file.storagePath);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Accept-Ranges', 'bytes');

    // 流式传输
    const stream = createReadStream(file.storagePath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('文件流错误:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: '文件读取失败' });
      }
    });

    stream.on('end', () => {
      // 更新文件下载统计（仅在流成功结束时）
      file.incrementDownload(fileSize);
    });
  } catch (error) {
    console.error('令牌下载错误:', error);
    res.status(500).json({ message: '下载失败', error: error.message });
  }
};

/**
 * 生成签名下载URL
 * GET /api/storage/signed-url/:fileId
 */
const getSignedUrl = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { expiresIn = 3600 } = req.query;

    const file = await StorageFile.findOne({ fileId, status: 'active' });
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 检查访问权限
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const accessResult = file.checkAccess(req.user, clientIp);
    
    if (!accessResult.allowed) {
      return res.status(403).json({ message: accessResult.reason });
    }

    const signedParams = generateSignedUrl(fileId, req.user._id.toString(), parseInt(expiresIn, 10));
    const signedUrl = `/api/storage/download/signed?${signedParams}`;

    res.json({
      signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    });
  } catch (error) {
    console.error('生成签名URL错误:', error);
    res.status(500).json({ message: '生成签名URL失败', error: error.message });
  }
};

/**
 * 获取存储统计信息
 * GET /api/storage/stats
 */
const getStats = async (req, res) => {
  try {
    const dbStats = await StorageFile.getStorageStats();
    const diskStats = await getStorageStats();

    res.json({
      database: dbStats,
      disk: diskStats,
      formatted: {
        totalSize: formatFileSize(dbStats.overall.totalSize),
        totalBandwidth: formatFileSize(dbStats.overall.totalBandwidth),
        byCategory: Object.fromEntries(
          Object.entries(dbStats.byCategory).map(([k, v]) => [k, {
            ...v,
            formattedSize: formatFileSize(v.size)
          }])
        )
      }
    });
  } catch (error) {
    console.error('获取存储统计错误:', error);
    res.status(500).json({ message: '获取存储统计失败', error: error.message });
  }
};

/**
 * 修复文件名编码
 * POST /api/storage/fix-filenames
 */
const fixFilenames = async (req, res) => {
  try {
    const files = await StorageFile.find({ status: 'active' });
    let fixedCount = 0;
    let skippedCount = 0;
    const fixedFiles = [];

    for (const file of files) {
      const originalName = file.originalName;
      const fixedName = fixFilenameEncoding(originalName);

      if (fixedName !== originalName) {
        console.log(`[文件名修复] ${originalName} -> ${fixedName}`);
        file.originalName = fixedName;
        await file.save();
        fixedCount++;
        fixedFiles.push({
          fileId: file.fileId,
          original: originalName,
          fixed: fixedName
        });
      } else {
        skippedCount++;
      }
    }

    res.json({
      message: '文件名修复完成',
      fixedCount,
      skippedCount,
      totalFiles: files.length,
      fixedFiles
    });
  } catch (error) {
    console.error('修复文件名错误:', error);
    res.status(500).json({ message: '修复文件名失败', error: error.message });
  }
};

/**
 * 检查分片是否存在
 * GET /api/storage/multipart/check/:uploadId/:chunkIndex
 */
const checkChunk = async (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.params;

    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ message: '上传会话不存在' });
    }

    const exists = await chunkExists(uploadId, parseInt(chunkIndex, 10));

    res.json({
      uploadId,
      chunkIndex: parseInt(chunkIndex, 10),
      exists
    });
  } catch (error) {
    console.error('检查分片错误:', error);
    res.status(500).json({ message: '检查分片失败', error: error.message });
  }
};

/**
 * 批量检查分片
 * POST /api/storage/multipart/check-batch
 */
const checkChunksBatch = async (req, res) => {
  try {
    const { uploadId, chunkHashes } = req.body;

    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ message: '上传会话不存在' });
    }

    const uploadedChunks = await getUploadedChunks(uploadId);
    const results = [];

    for (let i = 0; i < session.totalChunks; i++) {
      results.push({
        chunkIndex: i,
        uploaded: uploadedChunks.includes(i)
      });
    }

    res.json({
      uploadId,
      totalChunks: session.totalChunks,
      uploadedChunks,
      results
    });
  } catch (error) {
    console.error('批量检查分片错误:', error);
    res.status(500).json({ message: '批量检查分片失败', error: error.message });
  }
};

module.exports = {
  uploadFile,
  initMultipartUpload,
  uploadChunk,
  getUploadProgress,
  completeMultipartUpload,
  abortMultipartUpload,
  downloadFile,
  getFileInfo,
  listFiles,
  deleteFileRecord,
  updateFileInfo,
  createDownloadToken,
  downloadWithToken,
  getSignedUrl,
  getStats,
  fixFilenames,
  checkChunk,
  checkChunksBatch
};