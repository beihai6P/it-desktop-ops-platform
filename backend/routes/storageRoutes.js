const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
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
} = require('../controllers/storageController');
const {
  storageAuth,
  optionalAuth,
  checkFileAccess,
  verifyToken,
  verifySignature,
  adminOnly,
  canUpload,
  canDelete,
  fileSizeLimit,
  fileTypeCheck
} = require('../middleware/storageAuth');
const { getFileSizeLimit, TEMP_DIR } = require('../utils/fileUtils');

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 确保临时目录存在
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 基本安全检查
  const ext = path.extname(file.originalname).toLowerCase();
  
  // 禁止上传的文件类型
  const forbiddenExtensions = ['.sh', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.jar'];
  
  if (forbiddenExtensions.includes(ext)) {
    return cb(new Error('不允许上传此类型的文件'), false);
  }
  
  cb(null, true);
};

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: getFileSizeLimit('tool') // 默认最大500MB
  }
});

// 分片上传的multer配置（内存存储）
const chunkStorage = multer.memoryStorage();
const chunkUpload = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 单个分片最大10MB
  }
});

// ==================== 公开路由 ====================

// 使用令牌下载（无需认证）
router.get('/download/token/:token', downloadWithToken);

// 使用签名URL下载（无需认证）
router.get('/download/signed', verifySignature, downloadFile);

// ==================== 需要认证的路由 ====================

// 文件上传
router.post('/upload', 
  storageAuth, 
  canUpload,
  upload.single('file'),
  uploadFile
);

// 分片上传初始化
router.post('/multipart/init', 
  storageAuth, 
  canUpload,
  initMultipartUpload
);

// 分片上传
router.post('/multipart/chunk', 
  storageAuth, 
  canUpload,
  chunkUpload.single('chunk'),
  uploadChunk
);

// 获取上传进度
router.get('/multipart/progress/:uploadId', 
  storageAuth,
  getUploadProgress
);

// 完成分片上传
router.post('/multipart/complete', 
  storageAuth, 
  canUpload,
  completeMultipartUpload
);

// 取消分片上传
router.delete('/multipart/:uploadId', 
  storageAuth,
  abortMultipartUpload
);

// 检查分片是否存在
router.get('/multipart/check/:uploadId/:chunkIndex', 
  storageAuth,
  checkChunk
);

// 批量检查分片
router.post('/multipart/check-batch', 
  storageAuth,
  checkChunksBatch
);

// 文件下载（需要认证和权限检查）
router.get('/download/:fileId', 
  optionalAuth,
  checkFileAccess,
  downloadFile
);

// 获取文件信息
router.get('/info/:fileId', 
  optionalAuth,
  getFileInfo
);

// 文件列表
router.get('/files', 
  storageAuth,
  listFiles
);

// 删除文件
router.delete('/files/:fileId', 
  storageAuth,
  canDelete,
  deleteFileRecord
);

// 更新文件信息
router.put('/files/:fileId', 
  storageAuth,
  updateFileInfo
);

// 生成下载令牌
router.post('/token/:fileId', 
  storageAuth,
  createDownloadToken
);

// 生成签名下载URL
router.get('/signed-url/:fileId', 
  storageAuth,
  getSignedUrl
);

// ==================== 管理员路由 ====================

// 存储统计信息
router.get('/stats', 
  storageAuth,
  adminOnly,
  getStats
);

// ==================== 工具关联路由 ====================

// 为工具上传文件
router.post('/tool/:toolId', 
  storageAuth, 
  canUpload,
  upload.single('file'),
  (req, res, next) => {
    req.body.toolId = req.params.toolId;
    req.body.category = 'tool';
    next();
  },
  uploadFile
);

// 获取工具文件列表
router.get('/tool/:toolId', 
  optionalAuth,
  async (req, res, next) => {
    req.query.toolId = req.params.toolId;
    req.query.category = 'tool';
    next();
  },
  listFiles
);

module.exports = router;