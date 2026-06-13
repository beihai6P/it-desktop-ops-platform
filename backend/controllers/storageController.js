const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const { StorageFile, FileChunk, DownloadToken } = require('../models/StorageFile');
const {
  initStorage,
  saveFile,
  deleteFile,
  fileExists,
  getFileSize,
  createReadStream,
  calculateMD5,
  calculateSHA256,
  calculateBufferMD5,
  calculateBufferSHA256,
  getMimeType,
  getExtension,
  validateFileType,
  getFileSizeLimit,
  formatFileSize,
  getStoragePath,
  parseRangeHeader,
  generateETag,
  generateDownloadToken,
  generateSignedUrl,
  getStorageStats,
  cleanupTempFiles,
  cleanupChunks,
  saveChunk,
  chunkExists,
  getUploadedChunks,
  mergeChunks,
  CHUNK_SIZE,
  STORAGE_ROOT
} = require('../utils/fileUtils');

// 上传会话存储（生产环境应使用Redis）
const uploadSessions = new Map();

// 上传进度存储
const uploadProgress = new Map();

/**
 * 初始化存储系统
 */
const initializeStorage = async () => {
  try {
    await initStorage();
    console.log('存储系统初始化成功');
    
    // 定时清理任务
    setInterval(async () => {
      const tempCleaned = await cleanupTempFiles();
      const chunksCleaned = await cleanupChunks();
      if (tempCleaned > 0 || chunksCleaned > 0) {
        console.log(`清理完成: ${tempCleaned}个临时文件, ${chunksCleaned}个分片目录`);
      }
    }, 60 * 60 * 1000); // 每小时清理一次
  } catch (error) {
    console.error('存储系统初始化失败:', error);
  }
};

// 初始化
initializeStorage();

/**
 * 上传文件
 * POST /api/storage/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const file = req.file;
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

    // 验证文件类型
    if (!validateFileType(file.originalname, category)) {
      // 删除临时文件
      await deleteFile(file.path);
      return res.status(400).json({ 
        message: '不支持的文件类型',
        allowedTypes: Object.values(require('../utils/fileUtils').ALLOWED_EXTENSIONS[category] || []).flat()
      });
    }

    // 验证文件大小
    const sizeLimit = getFileSizeLimit(category);
    if (file.size > sizeLimit) {
      await deleteFile(file.path);
      return res.status(413).json({ 
        message: `文件大小超过限制（最大 ${formatFileSize(sizeLimit)}）` 
      });
    }

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
    const storagePath = getStoragePath(category, storageName);

    // 移动文件到存储目录（使用流式处理避免大文件OOM）
    const readStream = fs.createReadStream(file.path);
    const writeStream = fs.createWriteStream(storagePath);
    await pipeline(readStream, writeStream);
    await deleteFile(file.path);

    // 创建文件记录
    const storageFile = await StorageFile.create({
      fileId,
      originalName: file.originalname,
      storageName,
      extension: getExtension(file.originalname),
      mimeType: getMimeType(file.originalname),
      size: file.size,
      hash: {
        md5: md5Hash,
        sha256: sha256Hash
      },
      storagePath,
      toolId: toolId || null,
      category,
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
        hash: {
          md5: storageFile.hash.md5,
          sha256: storageFile.hash.sha256
        }
      }
    });
  } catch (error) {
    console.error('文件上传错误:', error);
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

    // 验证文件类型
    if (!validateFileType(filename, category)) {
      return res.status(400).json({ 
        message: '不支持的文件类型',
        extension: getExtension(filename)
      });
    }

    // 验证文件大小
    const sizeLimit = getFileSizeLimit(category);
    if (fileSize > sizeLimit) {
      return res.status(413).json({ 
        message: `文件大小超过限制（最大 ${formatFileSize(sizeLimit)}）` 
      });
    }

    // 生成上传ID
    const uploadId = crypto.randomBytes(16).toString('hex');
    const actualChunkSize = chunkSize || CHUNK_SIZE;
    const totalChunks = Math.ceil(fileSize / actualChunkSize);

    // 存储上传会话
    uploadSessions.set(uploadId, {
      filename,
      fileSize,
      category,
      toolId,
      description,
      accessLevel,
      chunkSize: actualChunkSize,
      totalChunks,
      uploadedChunks: [],
      userId: req.user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时过期
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

    // 保存分片
    await saveChunk(uploadId, parseInt(chunkIndex, 10), req.file.buffer);

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
    const uploadedChunks = await getUploadedChunks(uploadId);
    if (uploadedChunks.length !== session.totalChunks) {
      return res.status(400).json({ 
        message: '分片未完全上传',
        expected: session.totalChunks,
        uploaded: uploadedChunks.length,
        missingChunks: Array.from({ length: session.totalChunks }, (_, i) => i).filter(i => !uploadedChunks.includes(i))
      });
    }

    // 生成文件信息
    const fileId = StorageFile.generateFileId();
    const storageName = StorageFile.generateStorageName(session.filename);
    const storagePath = getStoragePath(session.category, storageName);

    // 合并分片
    await mergeChunks(uploadId, session.totalChunks, storagePath);

    // 验证文件哈希
    const actualMd5 = await calculateMD5(storagePath);
    const actualSha256 = await calculateSHA256(storagePath);
    const actualSize = await getFileSize(storagePath);

    // 验证文件大小
    if (actualSize !== session.fileSize) {
      await deleteFile(storagePath);
      return res.status(400).json({ 
        message: '文件大小不匹配',
        expected: session.fileSize,
        actual: actualSize
      });
    }

    // 可选：验证整体文件哈希
    if (fileHash && fileHash !== actualSha256) {
      await deleteFile(storagePath);
      return res.status(400).json({ 
        message: '文件哈希校验失败',
        expected: fileHash,
        actual: actualSha256
      });
    }

    // 检查是否已存在相同文件
    const existingFile = await StorageFile.findOne({ 'hash.sha256': actualSha256, status: 'active' });
    if (existingFile) {
      await deleteFile(storagePath);
      uploadSessions.delete(uploadId);
      uploadProgress.delete(uploadId);
      return res.status(409).json({ 
        message: '文件已存在',
        existingFile: {
          fileId: existingFile.fileId,
          originalName: existingFile.originalName,
          size: existingFile.size
        }
      });
    }

    // 创建文件记录
    const storageFile = await StorageFile.create({
      fileId,
      originalName: session.filename,
      storageName,
      extension: getExtension(session.filename),
      mimeType: getMimeType(session.filename),
      size: actualSize,
      hash: {
        md5: actualMd5,
        sha256: actualSha256
      },
      storagePath,
      toolId: session.toolId || null,
      category: session.category,
      accessLevel: session.accessLevel,
      uploadedBy: session.userId,
      metadata: {
        description: session.description
      }
    });

    // 清理上传会话
    uploadSessions.delete(uploadId);
    uploadProgress.delete(uploadId);

    res.json({
      message: '文件上传成功',
      file: {
        fileId: storageFile.fileId,
        originalName: storageFile.originalName,
        size: storageFile.size,
        mimeType: storageFile.mimeType,
        category: storageFile.category,
        accessLevel: storageFile.accessLevel,
        uploadedAt: storageFile.uploadedAt,
        hash: {
          md5: storageFile.hash.md5,
          sha256: storageFile.hash.sha256
        }
      }
    });
  } catch (error) {
    console.error('完成分片上传错误:', error);
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

    // 清理分片
    const chunkDir = path.join(STORAGE_ROOT, 'chunks', uploadId);
    try {
      await fs.promises.rm(chunkDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
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

    // 检查文件是否存在
    if (!await fileExists(file.storagePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    const fileSize = await getFileSize(file.storagePath);
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
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
        res.setHeader('ETag', generateETag(file.hash.sha256, file.size, file.updatedAt));
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Last-Modified', file.updatedAt.toUTCString());

        const stream = createReadStream(file.storagePath, { start, end });
        stream.pipe(res);

        stream.on('error', (error) => {
          console.error('文件流错误:', error);
          if (!res.headersSent) {
            res.status(500).json({ message: '文件读取失败' });
          }
        });

        stream.on('end', () => {
          // 更新下载统计（仅在流成功结束时）
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
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
      res.setHeader('ETag', generateETag(file.hash.sha256, file.size, file.updatedAt));
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = createReadStream(file.storagePath, { start, end });
      stream.pipe(res);

      stream.on('end', () => {
        file.incrementDownload(chunkSize);
      });

      return;
    }

    // 完整文件下载
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
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

    const stream = createReadStream(file.storagePath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('文件流错误:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: '文件读取失败' });
      }
    });

    stream.on('end', () => {
      // 更新下载统计（仅在流成功结束时）
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
  checkChunk,
  checkChunksBatch
};