const express = require('express');
const { body } = require('express-validator');
const {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  addReply
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllComments);
router.get('/:id', getCommentById);
router.post(
  '/',
  protect,
  [
    body('postId').notEmpty().withMessage('请输入帖子ID'),
    body('content').notEmpty().withMessage('请输入评论内容')
  ],
  createComment
);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.post('/:id/reply', protect, [body('content').notEmpty().withMessage('请输入回复内容')], addReply);

module.exports = router;