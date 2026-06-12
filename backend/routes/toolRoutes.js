const express = require('express');
const { body } = require('express-validator');
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
  getToolStats
} = require('../controllers/toolController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllTools);
router.get('/stats', getToolStats);
router.get('/:id', getToolById);
router.post(
  '/',
  protect,
  [
    body('name').notEmpty().withMessage('请输入工具名称'),
    body('description').notEmpty().withMessage('请输入工具描述'),
    body('category').notEmpty().withMessage('请选择分类'),
    body('type').isIn(['script', 'tool', 'plugin']).withMessage('无效的工具类型')
  ],
  createTool
);
router.put('/:id', protect, updateTool);
router.delete('/:id', protect, deleteTool);
router.post('/:id/download', downloadTool);
router.post('/:id/comment', protect, [body('content').notEmpty().withMessage('请输入评论内容')], addComment);
router.post('/:id/comment/reply', protect, [body('commentId').notEmpty(), body('content').notEmpty()], addCommentReply);
router.post('/:id/verify', protect, admin, verifyTool);
router.post('/:id/feature', protect, admin, featureTool);

module.exports = router;