/**
 * 预签名URL控制器
 * 为前端生成直接访问火山引擎对象存储的预签名URL
 */

const StorageFile = require('../models/StorageFile');
const { v4: uuidv4 } = require('uuid');

/**
 * 生成上传预签名URL
 */
const getUploadPresignedUrl = async (req, res) => {
  try {
    const { filename, size, mimeType } = req.body;
    
    // 验证文件类型
    const allowedTypes = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'video/mp4': ['mp4'],
      'video/quicktime': ['mov'],
      'application/zip': ['zip'],
      'application/x-rar-compressed': ['rar'],
      'application/x-7z-compressed': ['7z'],
    };
    
    const ext = filename.split('.').pop().toLowerCase();
    const allowedExts = allowedTypes[mimeType];
    
    if (!allowedExts || !allowedExts.includes(ext)) {
      return res.status(400).json({ message: '不支持的文件类型' });
    }
    
    // 验证文件大小
    const sizeLimits = {
      image: 20 * 1024 * 1024,    // 20MB
      video: 200 * 1024 * 1024,   // 200MB
      archive: 2 * 1024 * 1024 * 1024, // 2GB
    };
    
    let category = 'other';
    let maxSize = sizeLimits.archive;
    
    if (mimeType.startsWith('image/')) {
      category = 'image';
      maxSize = sizeLimits.image;
    } else if (mimeType.startsWith('video/')) {
      category = 'video';
      maxSize = sizeLimits.video;
    } else if (['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(mimeType)) {
      category = 'archive';
      maxSize = sizeLimits.archive;
    }
    
    if (size > maxSize) {
      return res.status(400).json({ 
        message: `文件大小超过限制（最大${(maxSize / 1024 / 1024).toFixed(0)}MB）` 
      });
    }
    
    // 生成fileId和objectKey
    const fileId = 'FILE-' + uuidv4().replace(/-/g, '').substring(0, 16);
    const objectKey = `uploads/${Date.now()}-${encodeURIComponent(filename)}`;
    
    // 生成预签名URL
    const { storageAdapter } = require('../services/storageAdapter');
    const presignedUrl = await storageAdapter.getPresignedUrl({
      key: objectKey,
      operation: 'put',
      contentType: mimeType,
      expiresIn: 3600, // 1小时
    });
    
    // 预先生成存储文件记录（状态为pending）
    const storageFile = await StorageFile.create({
      fileId,
      originalName: filename,
      mimeType,
      size,
      extension: ext,
      storagePath: objectKey,
      category,
      accessLevel: req.body.accessLevel || 'private',
      status: 'pending',
      uploadedBy: req.user?.id || null,
      hash: {
        md5: '',
        sha256: ''
      },
      metadata: {
        uploadType: 'presigned-url',
        createdAt: new Date()
      }
    });
    
    res.json({
      success: true,
      fileId,
      presignedUrl,
      objectKey,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      storageFile: {
        fileId: storageFile.fileId,
        originalName: storageFile.originalName,
        size: storageFile.size,
        mimeType: storageFile.mimeType,
      }
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
      // 可以添加更细粒度的权限检查
    }
    
    // 生成预签名URL
    const { storageAdapter } = require('../services/storageAdapter');
    const presignedUrl = await storageAdapter.getPresignedUrl({
      key: file.storagePath,
      operation: 'get',
      expiresIn: 3600, // 1小时
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
 * 确认上传完成
 */
const confirmUpload = async (req, res) => {
  try {
    const { fileId, etag, hash } = req.body;
    
    const file = await StorageFile.findOne({ fileId });
    
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    // 验证文件是否存在于对象存储
    const { storageAdapter } = require('../services/storageAdapter');
    const fileInfo = await storageAdapter.getObjectInfo(file.storagePath);
    
    if (!fileInfo) {
      return res.status(400).json({ message: '对象存储中未找到文件' });
    }
    
    // 更新文件状态为active
    file.status = 'active';
    file.etag = etag;
    if (hash) {
      file.hash = hash;
    }
    file.size = fileInfo.contentLength || file.size;
    file.uploadedAt = new Date();
    
    await file.save();
    
    res.json({
      success: true,
      message: '上传完成',
      file: {
        fileId: file.fileId,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        status: file.status,
      }
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
    const { filename, size, mimeType, parts } = req.body;
    
    // 验证文件类型和大小（同上）
    const allowedTypes = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'video/mp4': ['mp4'],
      'video/quicktime': ['mov'],
      'application/zip': ['zip'],
      'application/x-rar-compressed': ['rar'],
      'application/x-7z-compressed': ['7z'],
    };
    
    const ext = filename.split('.').pop().toLowerCase();
    const allowedExts = allowedTypes[mimeType];
    
    if (!allowedExts || !allowedExts.includes(ext)) {
      return res.status(400).json({ message: '不支持的文件类型' });
    }
    
    // 生成fileId和objectKey
    const fileId = 'FILE-' + uuidv4().replace(/-/g, '').substring(0, 16);
    const objectKey = `uploads/${Date.now()}-${encodeURIComponent(filename)}`;
    
    // 初始化分片上传
    const { storageAdapter } = require('../services/storageAdapter');
    const uploadId = await storageAdapter.initMultipartUpload(objectKey);
    
    // 预先生成存储文件记录
    const storageFile = await StorageFile.create({
      fileId,
      originalName: filename,
      mimeType,
      size,
      extension: ext,
      storagePath: objectKey,
      category: mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'archive',
      accessLevel: req.body.accessLevel || 'private',
      status: 'uploading',
      uploadedBy: req.user?.id || null,
      hash: { md5: '', sha256: '' },
      metadata: {
        uploadType: 'multipart',
        uploadId,
        parts: [],
        createdAt: new Date()
      }
    });
    
    // 生成各分片的预签名URL
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
      }
    });
    
  } catch (error) {
    console.error('初始化分片上传失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 完成分片上传
 */
const completeMultipartUpload = async (req, res) => {
  try {
    const { fileId, uploadId, parts } = req.body;
    
    const file = await StorageFile.findOne({ fileId });
    
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    // 完成分片上传
    const { storageAdapter } = require('../services/storageAdapter');
    const result = await storageAdapter.completeMultipartUpload({
      key: file.storagePath,
      uploadId,
      parts
    });
    
    // 更新文件状态
    file.status = 'active';
    file.etag = result.etag;
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
    
    // 删除未完成的文件记录
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

module.exports = {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  confirmUpload,
  initMultipartUpload,
  completeMultipartUpload,
  abortMultipartUpload,
};