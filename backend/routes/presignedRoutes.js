/**
 * 预签名URL路由
 * 用于前端直传火山引擎对象存储
 */

const express = require('express');
const router = express.Router();
const presignedController = require('../controllers/presignedController');
const authMiddleware = require('../middleware/auth');

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

module.exports = router;