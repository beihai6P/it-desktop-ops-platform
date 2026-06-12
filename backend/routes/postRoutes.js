const express = require('express');
const { body } = require('express-validator');
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  toggleBookmark,
  getHotPosts,
  getPostStats
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllPosts);
router.get('/stats', getPostStats);
router.get('/hot', getHotPosts);
router.get('/:id', getPostById);
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('请输入帖子标题'),
    body('content').notEmpty().withMessage('请输入帖子内容'),
    body('category').notEmpty().withMessage('请选择分类')
  ],
  createPost
);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/bookmark', protect, toggleBookmark);

module.exports = router;