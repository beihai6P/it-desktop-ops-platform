/**
 * 预签名URL控制器
 * 为前端生成直接访问火山引擎对象存储的预签名URL
 * 
 * 优化特性：
 * 1. 预签名Policy限制仅允许上传至指定目录
 * 2. 幂等校验，避免重复入库
 * 3. SHA256预校验，检测重复文件
 * 4. 友好的上传进度提示
 */

const { StorageFile } = require('../models/StorageFile');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// 允许的上传目录
const ALLOWED_UPLOAD_DIRS = ['uploads/archive', 'uploads/tools', 'uploads/images', 'uploads/videos'];

/**
 * 预检查文件是否已存在（通过SHA256）
 */
const checkDuplicateFile = async (sha256Hash) => {
  if (!sha256Hash) {
    return null;
  }
  
  const existingFile = await StorageFile.findOne({
    'hash.sha256': sha256Hash,
    status: 'active',
  });
  
  return existingFile;
};

/**
 * 生成上传预签名URL（带Policy限制）
 */
const getUploadPresignedUrl = async (req, res) => {
  try {
    const { filename, size, mimeType, sha256 } = req.body;
    
    // 1. SHA256预校验 - 检测重复文件
    if (sha256) {
      const existingFile = await checkDuplicateFile(sha256);
      if (existingFile) {
        return res.json({
          success: false,
          message: '文件已存在',
          duplicate: true,
          existingFile: {
            fileId: existingFile.fileId,
            originalName: existingFile.originalName,
            size: existingFile.size,
            uploadedAt: existingFile.uploadedAt,
          },
        });
      }
    }
    
    // 2. 验证文件类型
    const allowedTypes = {
      'image/jpeg': { ext: ['jpg', 'jpeg'], dir: 'uploads/images', category: 'image' },
      'image/png': { ext: ['png'], dir: 'uploads/images', category: 'image' },
      'image/webp': { ext: ['webp'], dir: 'uploads/images', category: 'image' },
      'image/gif': { ext: ['gif'], dir: 'uploads/images', category: 'image' },
      'video/mp4': { ext: ['mp4'], dir: 'uploads/videos', category: 'video' },
      'video/quicktime': { ext: ['mov'], dir: 'uploads/videos', category: 'video' },
      'application/zip': { ext: ['zip'], dir: 'uploads/archive', category: 'archive' },
      'application/x-rar-compressed': { ext: ['rar'], dir: 'uploads/archive', category: 'archive' },
      'application/x-7z-compressed': { ext: ['7z'], dir: 'uploads/archive', category: 'archive' },
      'application/octet-stream': { ext: ['zip', 'rar', '7z'], dir: 'uploads/archive', category: 'archive' },
    };
    
    const ext = filename.split('.').pop().toLowerCase();
    
    // 优先按扩展名匹配
    let typeConfig = null;
    for (const [mimeType, config] of Object.entries(allowedTypes)) {
      if (config.ext.includes(ext)) {
        typeConfig = config;
        break;
      }
    }
    
    if (!typeConfig) {
      return res.status(400).json({ message: '不支持的文件类型' });
    }
    
    // 3. 验证文件大小
    const sizeLimits = {
      image: 20 * 1024 * 1024,    // 20MB
      video: 200 * 1024 * 1024,   // 200MB
      archive: 2 * 1024 * 1024 * 1024, // 2GB
    };
    
    const maxSize = sizeLimits[typeConfig.category];
    if (size > maxSize) {
      return res.status(400).json({ 
        message: `文件大小超过限制（最大${(maxSize / 1024 / 1024).toFixed(0)}MB）` 
      });
    }
    
    // 4. 清洗文件名，移除特殊符号（防止安全软件误拦截）
    const cleanFilename = filename
      .replace(/\[|\]|\{|\}|\(|\)|\<|\>|\:|\"|\||\?|\*|\/|\\/g, '_')  // 移除特殊字符
      .replace(/\s+/g, '-')  // 空格替换为连字符
      .replace(/-+/g, '-')   // 多个连字符合并为一个
      .replace(/^-|-$/g, ''); // 移除首尾连字符
    
    // 5. 生成fileId和objectKey（限制在允许的目录内）
    const fileId = 'FILE-' + uuidv4().replace(/-/g, '').substring(0, 16);
    const safeFilename = encodeURIComponent(cleanFilename);
    const objectKey = `${typeConfig.dir}/${Date.now()}-${safeFilename}`;
    
    // 6. 验证路径是否在允许的目录内（安全校验）
    const isValidPath = ALLOWED_UPLOAD_DIRS.some(dir => objectKey.startsWith(dir + '/'));
    if (!isValidPath) {
      return res.status(400).json({ message: '不允许的上传路径' });
    }
    
    // 7. 生成预签名URL（带Policy限制）
    const { getStorageAdapter } = require('../services/storageAdapter');
    const storageAdapter = getStorageAdapter();
    const presignedUrl = await storageAdapter.getPresignedUrl({
      key: objectKey,
      operation: 'put',
      contentType: mimeType,
      expiresIn: 3600, // 1小时
      // Policy限制：仅允许上传到指定路径，防止路径遍历攻击
      policy: {
        conditions: [
          { bucket: process.env.VOLC_BUCKET },
          { key: objectKey },
          { contentType: mimeType },
          ['content-length-range', 0, maxSize],
        ],
      },
    });
    
    // 8. 预先生成存储文件记录（状态为pending）
    const storageFile = await StorageFile.create({
      fileId,
      originalName: filename,
      mimeType,
      size,
      extension: ext,
      storagePath: objectKey,
      category: typeConfig.category,
      accessLevel: req.body.accessLevel || 'private',
      status: 'pending',
      uploadedBy: req.user?.id || null,
      hash: {
        md5: '',
        sha256: sha256 || '',
      },
      metadata: {
        uploadType: 'presigned-url',
        createdAt: new Date(),
        uploadId: `presigned-${Date.now()}`,
      },
    });
    
    res.json({
      success: true,
      fileId,
      presignedUrl,
      objectKey,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      maxSize,
      storageFile: {
        fileId: storageFile.fileId,
        originalName: storageFile.originalName,
        size: storageFile.size,
        mimeType: storageFile.mimeType,
      },
    });
    
  } catch (error) {
    console.error('生成上传预签名URL失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 生成下载预签名URL
 */
const getDownloadPresignedUrl = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await StorageFile.findOne({ fileId, status: 'active' });
    
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    // 检查访问权限
    if (file.accessLevel === 'private') {
      if (!req.user) {
        return res.status(403).json({ message: '需要登录' });
      }
    }
    
    // 验证路径安全性
    const isValidPath = ALLOWED_UPLOAD_DIRS.some(dir => file.storagePath.startsWith(dir + '/'));
    if (!isValidPath) {
      return res.status(403).json({ message: '访问被拒绝' });
    }
    
    const { getStorageAdapter } = require('../services/storageAdapter');
    const storageAdapter = getStorageAdapter();
    const presignedUrl = await storageAdapter.getPresignedUrl({
      key: file.storagePath,
      operation: 'get',
      expiresIn: 3600,
    });
    
    res.json({
      success: true,
      fileId: file.fileId,
      originalName: file.originalName,
      presignedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      mimeType: file.mimeType,
      size: file.size,
    });
    
  } catch (error) {
    console.error('生成下载预签名URL失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 确认上传完成（幂等校验）
 */
const confirmUpload = async (req, res) => {
  try {
    const { fileId, etag, hash } = req.body;
    
    // 1. 幂等校验：检查文件是否已确认
    const existingFile = await StorageFile.findOne({ fileId });
    
    if (!existingFile) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    // 2. 如果已经是active状态，直接返回成功（幂等性）
    if (existingFile.status === 'active') {
      return res.json({
        success: true,
        message: '文件已上传',
        file: {
          fileId: existingFile.fileId,
          originalName: existingFile.originalName,
          size: existingFile.size,
          mimeType: existingFile.mimeType,
          status: existingFile.status,
        },
      });
    }
    
    // 3. 验证文件是否存在于对象存储
    const { storageAdapter } = require('../services/storageAdapter');
    const fileInfo = await storageAdapter.getObjectInfo(existingFile.storagePath);
    
    if (!fileInfo) {
      // 删除未完成的文件记录
      await StorageFile.deleteOne({ fileId });
      return res.status(400).json({ message: '对象存储中未找到文件' });
    }
    
    // 4. SHA256重复校验
    if (hash?.sha256) {
      const duplicateFile = await checkDuplicateFile(hash.sha256);
      if (duplicateFile && duplicateFile.fileId !== fileId) {
        // 删除当前文件记录和对象存储中的文件
        await StorageFile.deleteOne({ fileId });
        await storageAdapter.deleteObject(existingFile.storagePath);
        return res.json({
          success: false,
          message: '检测到重复文件',
          duplicate: true,
          existingFile: {
            fileId: duplicateFile.fileId,
            originalName: duplicateFile.originalName,
            size: duplicateFile.size,
            uploadedAt: duplicateFile.uploadedAt,
          },
        });
      }
    }
    
    // 5. 更新文件状态为active
    existingFile.status = 'active';
    existingFile.etag = etag;
    if (hash) {
      // 只更新非空的 hash 值，保留原有的临时值
      if (hash.md5 && hash.md5.trim()) {
        existingFile.hash.md5 = hash.md5;
      }
      if (hash.sha256 && hash.sha256.trim()) {
        existingFile.hash.sha256 = hash.sha256;
      }
    }
    existingFile.size = fileInfo.contentLength || existingFile.size;
    existingFile.uploadedAt = new Date();
    existingFile.metadata.uploadType = undefined;
    
    await existingFile.save();
    
    res.json({
      success: true,
      message: '上传完成',
      file: {
        fileId: existingFile.fileId,
        originalName: existingFile.originalName,
        size: existingFile.size,
        mimeType: existingFile.mimeType,
        status: existingFile.status,
      },
    });
    
  } catch (error) {
    console.error('确认上传失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 生成分片上传预签名URL（大文件）
 */
const initMultipartUpload = async (req, res) => {
  try {
    console.log('[分片上传] ====== 开始处理 ======');
    console.log('[分片上传] 请求体:', JSON.stringify(req.body, null, 2));
    
    const { filename, size, mimeType, parts, sha256 } = req.body;
    
    // 详细的参数验证
    console.log('[分片上传] 参数检查 - filename:', filename, 'typeof:', typeof filename, 'isEmpty:', !filename);
    console.log('[分片上传] 参数检查 - size:', size, 'typeof:', typeof size, 'isEmpty:', !size);
    console.log('[分片上传] 参数检查 - parts:', parts, 'typeof:', typeof parts, 'isEmpty:', !parts);
    console.log('[分片上传] 参数检查 - mimeType:', mimeType, 'typeof:', typeof mimeType);
    
    // 1. 参数验证
    if (!filename || !size || !parts) {
      console.error('[分片上传] 参数缺失 - filename:', !!filename, 'size:', !!size, 'parts:', !!parts);
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数',
        missing: {
          filename: !filename,
          size: !size,
          parts: !parts,
        }
      });
    }
    
    // 如果 mimeType 为空，使用默认值
    const finalMimeType = mimeType || 'application/octet-stream';
    
    // 2. SHA256预校验
    if (sha256) {
      const existingFile = await checkDuplicateFile(sha256);
      if (existingFile) {
        return res.json({
          success: false,
          message: '文件已存在',
          duplicate: true,
          existingFile: {
            fileId: existingFile.fileId,
            originalName: existingFile.originalName,
            size: existingFile.size,
            uploadedAt: existingFile.uploadedAt,
          },
        });
      }
    }
    
    // 2. 验证文件类型和目录
    const allowedTypes = {
      'image/jpeg': { ext: ['jpg', 'jpeg'], dir: 'uploads/images', category: 'image' },
      'image/png': { ext: ['png'], dir: 'uploads/images', category: 'image' },
      'image/webp': { ext: ['webp'], dir: 'uploads/images', category: 'image' },
      'image/gif': { ext: ['gif'], dir: 'uploads/images', category: 'image' },
      'video/mp4': { ext: ['mp4'], dir: 'uploads/videos', category: 'video' },
      'video/quicktime': { ext: ['mov'], dir: 'uploads/videos', category: 'video' },
      'application/zip': { ext: ['zip'], dir: 'uploads/archive', category: 'archive' },
      'application/x-rar-compressed': { ext: ['rar'], dir: 'uploads/archive', category: 'archive' },
      'application/x-7z-compressed': { ext: ['7z'], dir: 'uploads/archive', category: 'archive' },
      'application/octet-stream': { ext: ['zip', 'rar', '7z'], dir: 'uploads/archive', category: 'archive' },
    };
    
    const ext = filename.split('.').pop()?.toLowerCase();
    console.log('[分片上传] 文件扩展名:', ext);
    
    // 优先按扩展名匹配
    let typeConfig = null;
    for (const [mimeType, config] of Object.entries(allowedTypes)) {
      if (config.ext.includes(ext)) {
        typeConfig = config;
        break;
      }
    }
    
    console.log('[分片上传] 文件类型配置:', typeConfig);
    
    if (!typeConfig) {
      console.error('[分片上传] 不支持的文件类型:', ext);
      return res.status(400).json({ success: false, message: '不支持的文件类型' });
    }
    
    // 3. 清洗文件名，移除特殊符号（防止安全软件误拦截）
    const cleanFilename = filename
      .replace(/\[|\]|\{|\}|\(|\)|\<|\>|\:|\"|\||\?|\*|\/|\\/g, '_')  // 移除特殊字符
      .replace(/\s+/g, '-')  // 空格替换为连字符
      .replace(/-+/g, '-')   // 多个连字符合并为一个
      .replace(/^-|-$/g, ''); // 移除首尾连字符
    
    // 4. 生成fileId和objectKey
    console.log('[分片上传] 开始生成fileId和objectKey');
    const fileId = 'FILE-' + uuidv4().replace(/-/g, '').substring(0, 16);
    const safeFilename = encodeURIComponent(cleanFilename);
    const objectKey = `${typeConfig.dir}/${Date.now()}-${safeFilename}`;
    
    // 5. 初始化分片上传
    console.log('[分片上传] 开始初始化分片上传:', objectKey);
    const { getStorageAdapter } = require('../services/storageAdapter');
    const storageAdapter = getStorageAdapter();
    const uploadResult = await storageAdapter.initMultipartUpload(objectKey);
    const uploadId = uploadResult.uploadId;
    console.log('[分片上传] 分片上传初始化成功, uploadId:', uploadId);
    
    // 6. 预先生成存储文件记录
    console.log('[分片上传] 开始创建存储文件记录');
    const safeStorageName = `${Date.now()}-${safeFilename}`;
    const tempMd5 = crypto.createHash('md5').update(fileId + Date.now()).digest('hex');
    const tempSha256 = crypto.createHash('sha256').update(fileId + Date.now()).digest('hex');
    
    const storageFile = await StorageFile.create({
      fileId,
      originalName: filename,
      storageName: safeStorageName,
      mimeType: finalMimeType,
      size,
      extension: ext,
      storagePath: objectKey,
      category: typeConfig.category,
      accessLevel: req.body.accessLevel || 'private',
      status: 'uploading',
      uploadedBy: req.user?.id || null,
      hash: { md5: tempMd5, sha256: sha256 || tempSha256 },
      metadata: {
        uploadType: 'multipart',
        uploadId,
        parts: [],
        createdAt: new Date(),
      },
    });
    
    console.log('[分片上传] 存储文件记录创建成功:', storageFile.fileId);
    
    // 6. 生成各分片的预签名URL
    console.log('[分片上传] 开始生成分片预签名URL, 共', parts, '个分片');
    const partUrls = [];
    for (let i = 1; i <= parts; i++) {
      const partUrl = await storageAdapter.getPresignedUrl({
        key: objectKey,
        operation: 'uploadPart',
        uploadId: uploadId,
        partNumber: i,
        expiresIn: 3600,
      });
      // 检查URL是否包含正确的partNumber
      if (partUrl.includes(`partNumber=${i}`)) {
        console.log(`[分片上传] ✅ 分片 ${i} URL包含正确的partNumber`);
      } else {
        console.error(`[分片上传] ❌ 分片 ${i} URL缺少partNumber=${i} 参数`);
        console.error(`[分片上传] ❌ 分片 ${i} URL: ${partUrl.substring(0, 200)}...`);
      }
      partUrls.push({
        partNumber: i,
        url: partUrl,
      });
    }
    
    console.log('[分片上传] 分片预签名URL生成成功');
    console.log('[分片上传] 分片列表:', JSON.stringify(partUrls.map(p => ({ partNumber: p.partNumber, urlPreview: p.url.substring(0, 100) + '...' }))));
    
    // 7. 返回结果
    res.json({
      success: true,
      fileId,
      objectKey,
      uploadId,
      partUrls,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      storageFile: {
        fileId: storageFile.fileId,
        originalName: storageFile.originalName,
        size: storageFile.size,
        mimeType: storageFile.mimeType,
      },
    });
    
    console.log('[分片上传] 初始化完成');
    
  } catch (error) {
    console.error('[分片上传] 初始化失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '初始化分片上传失败', 
      error: error.message 
    });
  }
};

/**
 * 完成分片上传（幂等校验）
 */
const completeMultipartUpload = async (req, res) => {
  try {
    const { fileId, uploadId, parts, partData, hash } = req.body;
    
    // 1. 幂等校验
    const file = await StorageFile.findOne({ fileId });
    
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    if (file.status === 'active') {
      return res.json({
        success: true,
        message: '文件已上传',
        file: {
          fileId: file.fileId,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          status: file.status,
        },
      });
    }
    
    // 2. SHA256重复校验
    if (hash?.sha256) {
      const duplicateFile = await checkDuplicateFile(hash.sha256);
      if (duplicateFile && duplicateFile.fileId !== fileId) {
        // 取消分片上传并删除记录
        const { getStorageAdapter } = require('../services/storageAdapter');
        const storageAdapter = getStorageAdapter();
        await storageAdapter.abortMultipartUpload(file.storagePath, uploadId);
        await StorageFile.deleteOne({ fileId });
        return res.json({
          success: false,
          message: '检测到重复文件',
          duplicate: true,
          existingFile: {
            fileId: duplicateFile.fileId,
            originalName: duplicateFile.originalName,
            size: duplicateFile.size,
            uploadedAt: duplicateFile.uploadedAt,
          },
        });
      }
    }
    
    // 3. 处理分片数据：清洗ETag、排序、校验
    let processedParts = [];
    
    // 优先使用partData（前端直传方案）
    if (partData && Array.isArray(partData) && partData.length > 0) {
      console.log(`[分片上传] 收到partData，数量: ${partData.length}`);
      processedParts = partData.map(item => {
        if (!item || typeof item !== 'object') {
          console.warn(`[分片上传] 跳过无效分片项:`, item);
          return null;
        }
        const partNum = item.partNumber || item.PartNumber;
        const etag = (item.etag || item.ETag || item.rawETag || '').replace(/"/g, '');
        
        if (!partNum || !etag) {
          console.warn(`[分片上传] 分片数据不完整 - partNumber: ${partNum}, etag: "${etag}"`);
          return null;
        }
        
        return {
          partNumber: typeof partNum === 'string' ? parseInt(partNum, 10) : partNum,
          etag,
        };
      }).filter(item => item !== null);
      
      // 按partNumber升序排序
      processedParts.sort((a, b) => a.partNumber - b.partNumber);
      
      console.log(`[分片上传] 处理后分片数: ${processedParts.length}`);
      console.log(`[分片上传] 分片列表:`, JSON.stringify(processedParts));
      
      // 检查分片编号是否连续
      const partNumbers = processedParts.map(p => p.partNumber).sort((a, b) => a - b);
      const expectedNumbers = Array.from({ length: processedParts.length }, (_, i) => i + 1);
      const isContinuous = JSON.stringify(partNumbers) === JSON.stringify(expectedNumbers);
      console.log(`[分片上传] 分片编号连续性检查: ${isContinuous ? '✅ 连续' : '❌ 不连续'}`);
      if (!isContinuous) {
        console.log(`[分片上传] 期望编号:`, expectedNumbers);
        console.log(`[分片上传] 实际编号:`, partNumbers);
      }
    } else if (parts && Array.isArray(parts) && parts.length > 0) {
      // 兼容旧格式：清洗ETag
      console.log(`[分片上传] 收到parts（旧格式），数量: ${parts.length}`);
      processedParts = parts.map(item => {
        if (!item || typeof item !== 'object') {
          console.warn(`[分片上传] 跳过无效分片项:`, item);
          return null;
        }
        const partNum = item.partNumber || item.PartNumber;
        const etag = (item.etag || item.ETag || '').replace(/"/g, '');
        
        if (!partNum || !etag) {
          console.warn(`[分片上传] 分片数据不完整 - partNumber: ${partNum}, etag: "${etag}"`);
          return null;
        }
        
        return {
          partNumber: typeof partNum === 'string' ? parseInt(partNum, 10) : partNum,
          etag,
        };
      }).filter(item => item !== null);
      
      // 按partNumber升序排序
      processedParts.sort((a, b) => a.partNumber - b.partNumber);
    }
    
    // 校验分片数量
    if (!processedParts || processedParts.length === 0) {
      console.error(`[分片上传] 没有有效的分片数据 - partData: ${partData ? `数组(${partData.length})` : '空'}, parts: ${parts ? `数组(${parts.length})` : '空'}`);
      return res.status(400).json({ 
        success: false, 
        message: '没有有效的分片数据' 
      });
    }
    
    console.log(`[分片上传] 准备合并 ${processedParts.length} 个分片`);
    
    // 4. 完成分片上传
    const { getStorageAdapter } = require('../services/storageAdapter');
    const storageAdapter = getStorageAdapter();
    const result = await storageAdapter.completeMultipartUpload(
      file.storagePath,
      uploadId,
      processedParts
    );
    
    // 4. 更新文件状态
    file.status = 'active';
    file.etag = result.etag;
    if (hash) {
      // 只更新非空的 hash 值，保留原有的临时值
      if (hash.md5 && hash.md5.trim()) {
        file.hash.md5 = hash.md5;
      }
      if (hash.sha256 && hash.sha256.trim()) {
        file.hash.sha256 = hash.sha256;
      }
    }
    file.uploadedAt = new Date();
    file.metadata.uploadId = undefined;
    file.metadata.parts = undefined;
    
    await file.save();
    
    res.json({
      success: true,
      message: '分片上传完成',
      file: {
        fileId: file.fileId,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        status: file.status,
      },
      etag: result.etag,
    });
    
  } catch (error) {
    console.error('完成分片上传失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 取消分片上传
 */
const abortMultipartUpload = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await StorageFile.findOne({ fileId });
    
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    if (file.metadata?.uploadId) {
      const { getStorageAdapter } = require('../services/storageAdapter');
      const storageAdapter = getStorageAdapter();
      await storageAdapter.abortMultipartUpload(file.storagePath, file.metadata.uploadId);
    }
    
    await StorageFile.deleteOne({ fileId });
    
    res.json({
      success: true,
      message: '上传已取消',
    });
    
  } catch (error) {
    console.error('取消分片上传失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 计算文件SHA256（工具函数）
 */
const calculateSHA256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const proxyUpload = async (req, res) => {
  try {
    const { filename, size, mimeType, category, accessLevel, sha256 } = req.body;
    
    if (!filename || !size) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (sha256) {
      const existingFile = await checkDuplicateFile(sha256);
      if (existingFile) {
        return res.json({
          success: false,
          message: '文件已存在',
          duplicate: true,
          existingFile: {
            fileId: existingFile.fileId,
            originalName: existingFile.originalName,
            size: existingFile.size,
            uploadedAt: existingFile.uploadedAt,
          },
        });
      }
    }
    
    const allowedTypes = {
      'image/jpeg': { ext: ['jpg', 'jpeg'], dir: 'uploads/images', category: 'image' },
      'image/png': { ext: ['png'], dir: 'uploads/images', category: 'image' },
      'image/webp': { ext: ['webp'], dir: 'uploads/images', category: 'image' },
      'image/gif': { ext: ['gif'], dir: 'uploads/images', category: 'image' },
      'video/mp4': { ext: ['mp4'], dir: 'uploads/videos', category: 'video' },
      'video/quicktime': { ext: ['mov'], dir: 'uploads/videos', category: 'video' },
      'application/zip': { ext: ['zip'], dir: 'uploads/archive', category: 'archive' },
      'application/x-rar-compressed': { ext: ['rar'], dir: 'uploads/archive', category: 'archive' },
      'application/x-7z-compressed': { ext: ['7z'], dir: 'uploads/archive', category: 'archive' },
      'application/octet-stream': { ext: ['zip', 'rar', '7z'], dir: 'uploads/archive', category: 'archive' },
    };
    
    const ext = filename.split('.').pop()?.toLowerCase();
    let typeConfig = null;
    for (const [mimeType, config] of Object.entries(allowedTypes)) {
      if (config.ext.includes(ext)) {
        typeConfig = config;
        break;
      }
    }
    
    if (!typeConfig) {
      return res.status(400).json({ success: false, message: '不支持的文件类型' });
    }
    
    const fileId = 'FILE-' + uuidv4().replace(/-/g, '').substring(0, 16);
    const safeFilename = encodeURIComponent(filename).replace(/%20/g, '-');
    const objectKey = `${typeConfig.dir}/${Date.now()}-${safeFilename}`;
    
    const { getStorageAdapter } = require('../services/storageAdapter');
    const storageAdapter = getStorageAdapter();
    
    const storageFile = await StorageFile.create({
      fileId,
      originalName: filename,
      mimeType: mimeType || 'application/octet-stream',
      size,
      extension: ext,
      storagePath: objectKey,
      category: typeConfig.category,
      accessLevel: accessLevel || 'private',
      status: 'uploading',
      uploadedBy: req.user?.id || null,
      hash: {
        md5: '',
        sha256: sha256 || '',
      },
      metadata: {
        uploadType: 'proxy',
        createdAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      fileId,
      uploadUrl: `/api/presigned/proxy-upload/${fileId}`,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
    
  } catch (error) {
    console.error('代理上传初始化失败:', error);
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
};

const proxyUploadPart = async (req, res) => {
  try {
    const { fileId, partNumber, uploadId } = req.body;
    const file = req.file;
    
    console.log(`[分片上传] 收到代理上传请求 - fileId: ${fileId}, partNumber: ${partNumber}, uploadId: ${uploadId}, file: ${!!file}`);
    console.log(`[分片上传] fileId类型: ${typeof fileId}, partNumber类型: ${typeof partNumber}`);
    
    if (!fileId || !partNumber || !file) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const storageFile = await StorageFile.findOne({ fileId });
    
    if (!storageFile) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    console.log(`[分片上传] 存储文件记录 - storagePath: ${storageFile.storagePath}, 类型: ${typeof storageFile.storagePath}`);
    console.log(`[分片上传] metadata.uploadId: ${storageFile.metadata?.uploadId}`);
    console.log(`[分片上传] 后端代理上传分片 - fileId: ${fileId}, partNumber: ${partNumber}, uploadId: ${uploadId}`);
    
    const { getStorageAdapter } = require('../services/storageAdapter');
    const storageAdapter = getStorageAdapter();
    
    // 实际上传分片到TOS（注意：uploadPart方法接受独立参数，不是对象）
    const result = await storageAdapter.uploadPart(
      storageFile.storagePath,
      partNumber,
      uploadId || storageFile.metadata?.uploadId,
      file.data
    );
    
    const etag = result.etag?.replace(/"/g, '') || '';
    console.log(`[分片上传] 后端代理上传分片成功 - partNumber: ${partNumber}, etag: ${etag}`);
    
    res.json({
      success: true,
      etag,
      partNumber,
    });
    
  } catch (error) {
    console.error('后端代理上传分片失败:', error);
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
};

const uploadPartDirect = async (req, res) => {
  try {
    const { fileId, partNumber, uploadId } = req.body;
    
    if (!fileId || !partNumber) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const file = await StorageFile.findOne({ fileId });
    
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        const { getStorageAdapter } = require('../services/storageAdapter');
        const storageAdapter = getStorageAdapter();
        
        const result = await storageAdapter.uploadPart({
          key: file.storagePath,
          uploadId: uploadId || file.metadata?.uploadId,
          partNumber,
          body: buffer,
        });
        
        res.json({
          success: true,
          etag: result.etag?.replace(/"/g, '') || '',
          partNumber,
        });
        
      } catch (error) {
        console.error('直接上传分片失败:', error);
        res.status(500).json({ success: false, message: '上传分片失败', error: error.message });
      }
    });
    
  } catch (error) {
    console.error('直接上传分片失败:', error);
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
};

const directUpload = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await StorageFile.findOne({ fileId });
    
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        const { getStorageAdapter } = require('../services/storageAdapter');
        const storageAdapter = getStorageAdapter();
        
        const result = await storageAdapter.uploadObject(file.storagePath, buffer, file.mimeType);
        
        file.status = 'active';
        file.etag = result.etag;
        file.size = buffer.length;
        file.uploadedAt = new Date();
        await file.save();
        
        res.json({
          success: true,
          message: '上传完成',
          fileId: file.fileId,
          etag: result.etag,
        });
      } catch (error) {
        console.error('直接上传失败:', error);
        res.status(500).json({ success: false, message: '上传失败', error: error.message });
      }
    });
    
  } catch (error) {
    console.error('直接上传失败:', error);
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  confirmUpload,
  initMultipartUpload,
  completeMultipartUpload,
  abortMultipartUpload,
  checkDuplicateFile,
  calculateSHA256,
  proxyUpload,
  proxyUploadPart,
  uploadPartDirect,
  directUpload,
};