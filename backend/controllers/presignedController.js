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

const StorageFile = require('../models/StorageFile');
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
    };
    
    const ext = filename.split('.').pop().toLowerCase();
    const typeConfig = allowedTypes[mimeType];
    
    if (!typeConfig || !typeConfig.ext.includes(ext)) {
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
    
    // 4. 生成fileId和objectKey（限制在允许的目录内）
    const fileId = 'FILE-' + uuidv4().replace(/-/g, '').substring(0, 16);
    const safeFilename = encodeURIComponent(filename).replace(/%20/g, '-');
    const objectKey = `${typeConfig.dir}/${Date.now()}-${safeFilename}`;
    
    // 5. 验证路径是否在允许的目录内（安全校验）
    const isValidPath = ALLOWED_UPLOAD_DIRS.some(dir => objectKey.startsWith(dir + '/'));
    if (!isValidPath) {
      return res.status(400).json({ message: '不允许的上传路径' });
    }
    
    // 6. 生成预签名URL（带Policy限制）
    const { storageAdapter } = require('../services/storageAdapter');
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
    
    // 7. 预先生成存储文件记录（状态为pending）
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
    
    const { storageAdapter } = require('../services/storageAdapter');
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
      existingFile.hash = hash;
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
    const { filename, size, mimeType, parts, sha256 } = req.body;
    
    // 1. SHA256预校验
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
    };
    
    const ext = filename.split('.').pop().toLowerCase();
    const typeConfig = allowedTypes[mimeType];
    
    if (!typeConfig || !typeConfig.ext.includes(ext)) {
      return res.status(400).json({ message: '不支持的文件类型' });
    }
    
    // 3. 生成fileId和objectKey
    const fileId = 'FILE-' + uuidv4().replace(/-/g, '').substring(0, 16);
    const safeFilename = encodeURIComponent(filename).replace(/%20/g, '-');
    const objectKey = `${typeConfig.dir}/${Date.now()}-${safeFilename}`;
    
    // 4. 初始化分片上传
    const { storageAdapter } = require('../services/storageAdapter');
    const uploadId = await storageAdapter.initMultipartUpload(objectKey);
    
    // 5. 预先生成存储文件记录
    const storageFile = await StorageFile.create({
      fileId,
      originalName: filename,
      mimeType,
      size,
      extension: ext,
      storagePath: objectKey,
      category: typeConfig.category,
      accessLevel: req.body.accessLevel || 'private',
      status: 'uploading',
      uploadedBy: req.user?.id || null,
      hash: { md5: '', sha256: sha256 || '' },
      metadata: {
        uploadType: 'multipart',
        uploadId,
        parts: [],
        createdAt: new Date(),
      },
    });
    
    // 6. 生成各分片的预签名URL
    const partUrls = [];
    for (let i = 1; i <= parts; i++) {
      const partUrl = await storageAdapter.getPresignedUrl({
        key: objectKey,
        operation: 'uploadPart',
        uploadId,
        partNumber: i,
        expiresIn: 3600,
      });
      partUrls.push({
        partNumber: i,
        url: partUrl,
      });
    }
    
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
    
  } catch (error) {
    console.error('初始化分片上传失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 完成分片上传（幂等校验）
 */
const completeMultipartUpload = async (req, res) => {
  try {
    const { fileId, uploadId, parts, hash } = req.body;
    
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
        const { storageAdapter } = require('../services/storageAdapter');
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
    
    // 3. 完成分片上传
    const { storageAdapter } = require('../services/storageAdapter');
    const result = await storageAdapter.completeMultipartUpload({
      key: file.storagePath,
      uploadId,
      parts,
    });
    
    // 4. 更新文件状态
    file.status = 'active';
    file.etag = result.etag;
    if (hash) {
      file.hash = hash;
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
      const { storageAdapter } = require('../services/storageAdapter');
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

module.exports = {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  confirmUpload,
  initMultipartUpload,
  completeMultipartUpload,
  abortMultipartUpload,
  checkDuplicateFile,
  calculateSHA256,
};