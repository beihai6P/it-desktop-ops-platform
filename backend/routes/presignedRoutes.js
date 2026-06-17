/**
 * 预签名URL路由
 * 用于前端直传火山引擎对象存储
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const presignedController = require('../controllers/presignedController');
const authMiddleware = require('../middleware/auth');

// 分片上传的multer配置（内存存储）
const chunkStorage = multer.memoryStorage();
const chunkUpload = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 单个分片最大10MB
  }
});

// 生成上传预签名URL（需要登录）
router.post('/upload-url', authMiddleware.protect, presignedController.getUploadPresignedUrl);

// 生成下载预签名URL（公开文件不需要登录，私有文件需要登录）
router.get('/download-url/:fileId', presignedController.getDownloadPresignedUrl);

// 确认上传完成
router.post('/confirm-upload', authMiddleware.protect, presignedController.confirmUpload);

// 初始化分片上传
router.post('/multipart/init', authMiddleware.protect, presignedController.initMultipartUpload);

// 完成分片上传
router.post('/multipart/complete', authMiddleware.protect, presignedController.completeMultipartUpload);

// 取消分片上传
router.delete('/multipart/:fileId', authMiddleware.protect, presignedController.abortMultipartUpload);

// 代理上传文件（解决CORS问题）
router.post('/proxy-upload', authMiddleware.protect, presignedController.proxyUpload);

// 代理分片上传已废弃 - 使用前端直传TOS方案
// router.post('/proxy-upload-part', authMiddleware.protect, chunkUpload.single('file'), presignedController.proxyUploadPart);

// 直接上传文件（POST方式）
router.post('/direct-upload/:fileId', authMiddleware.protect, presignedController.directUpload);

// 直接上传分片（通过后端代理，解决CORS问题）
router.post('/upload-part-direct', authMiddleware.protect, presignedController.uploadPartDirect);

module.exports = router;