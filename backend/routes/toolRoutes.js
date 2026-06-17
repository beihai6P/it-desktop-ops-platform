const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  downloadTool,
  addComment,
  addCommentReply,
  verifyTool,
  featureTool,
  pinTool,
  getToolStats,
  getScreenshot
} = require('../controllers/toolController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// 配置multer用于处理截图上传（内存存储，因为截图通常较小）
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 单个文件最大10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

router.get('/', getAllTools);
router.get('/stats', getToolStats);
router.get('/:id', getToolById);
router.post(
  '/',
  protect,
  upload.array('screenshots', 10), // 最多上传10张截图
  [
    body('name').notEmpty().withMessage('请输入工具名称'),
    body('description').notEmpty().withMessage('请输入工具描述'),
    body('category').notEmpty().withMessage('请选择分类'),
    body('type').isIn(['script', 'tool', 'plugin']).withMessage('无效的工具类型')
  ],
  createTool
);
router.put('/:id', protect, updateTool);
router.post('/:id/download', downloadTool);
router.post('/:id/comment', protect, [body('content').notEmpty().withMessage('请输入评论内容')], addComment);
router.post('/:id/comment/reply', protect, [body('commentId').notEmpty(), body('content').notEmpty()], addCommentReply);
router.post('/:id/verify', protect, admin, verifyTool);
router.post('/:id/feature', protect, admin, featureTool);
router.post('/:id/pin', protect, admin, pinTool);
router.delete('/:id', protect, admin, deleteTool);
router.get('/screenshot/:key', getScreenshot);

module.exports = router;