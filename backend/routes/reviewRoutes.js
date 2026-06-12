const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/auth');

router.get('/pending', protect, reviewController.getPendingPosts);
router.get('/review', protect, admin, reviewController.getReviewPosts);
router.get('/all', protect, reviewController.getAllPostsWithReview);
router.post('/review', protect, admin, reviewController.reviewPost);
router.post('/batch', protect, admin, reviewController.batchReview);
router.get('/stats', protect, reviewController.getReviewStats);
router.post('/check', protect, reviewController.checkContent);

router.get('/posts', protect, admin, reviewController.getPostsForReview);
router.put('/posts/:id/approve', protect, admin, reviewController.approvePost);
router.put('/posts/:id/reject', protect, admin, reviewController.rejectPost);
router.delete('/posts/:id', protect, admin, reviewController.deletePost);

router.get('/comments', protect, admin, reviewController.getCommentsForReview);
router.put('/comments/:id/approve', protect, admin, reviewController.approveComment);
router.put('/comments/:id/reject', protect, admin, reviewController.rejectComment);
router.delete('/comments/:id', protect, admin, reviewController.deleteComment);

module.exports = router;