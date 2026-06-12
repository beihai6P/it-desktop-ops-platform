const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { detectSensitiveContent } = require('../utils/sensitiveWords');

const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ reviewStatus: 'pending' })
      .populate('authorId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getReviewPosts = async (req, res) => {
  try {
    const posts = await Post.find({ reviewStatus: 'review' })
      .populate('authorId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getAllPostsWithReview = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  
  if (pageNum < 1) return res.status(400).json({ message: '页码必须大于0' });
  if (limitNum < 1 || limitNum > 100) return res.status(400).json({ message: '每页数量必须在1-100之间' });
  
  const query = status ? { reviewStatus: status } : {};

  try {
    const posts = await Post.find(query)
      .populate('authorId', 'name')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Post.countDocuments(query);

    res.status(200).json({
      posts,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const reviewPost = async (req, res) => {
  const { postId, action, reason } = req.body;

  try {
    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    if (post.reviewStatus === 'approved' || post.reviewStatus === 'rejected') {
      return res.status(400).json({ message: '帖子已审核' });
    }

    let newStatus;
    if (action === 'approve') {
      newStatus = 'approved';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'pending') {
      newStatus = 'pending';
    } else {
      return res.status(400).json({ message: '无效的审核操作' });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { id: postId },
      {
        reviewStatus: newStatus,
        reviewReason: reason || null,
        reviewedBy: req.user._id,
        reviewedAt: Date.now()
      },
      { new: true }
    ).populate('authorId', 'name');

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const batchReview = async (req, res) => {
  const { postIds, action, reason } = req.body;

  try {
    let newStatus;
    if (action === 'approve') {
      newStatus = 'approved';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else {
      return res.status(400).json({ message: '无效的审核操作' });
    }

    await Post.updateMany(
      { id: { $in: postIds } },
      {
        reviewStatus: newStatus,
        reviewReason: reason || null,
        reviewedBy: req.user._id,
        reviewedAt: Date.now()
      }
    );

    res.status(200).json({ message: '批量审核完成' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getReviewStats = async (req, res) => {
  try {
    const pending = await Post.countDocuments({ reviewStatus: 'pending' });
    const review = await Post.countDocuments({ reviewStatus: 'review' });
    const approved = await Post.countDocuments({ reviewStatus: 'approved' });
    const rejected = await Post.countDocuments({ reviewStatus: 'rejected' });

    res.status(200).json({
      pending,
      review,
      approved,
      rejected,
      total: pending + review + approved + rejected
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const checkContent = async (req, res) => {
  const { title, content } = req.body;

  try {
    const foundKeywords = detectSensitiveContent(title + content);
    
    let needsReview = foundKeywords.length > 0;
    
    res.status(200).json({
      needsReview,
      keywords: foundKeywords,
      suggestedStatus: needsReview ? 'review' : 'approved'
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getPostsForReview = async (req, res) => {
  const { status } = req.query;
  const query = status && status !== 'all' ? { reviewStatus: status } : {};

  try {
    const posts = await Post.find(query)
      .populate('authorId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const approvePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findOne({ id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { id },
      {
        reviewStatus: 'approved',
        reviewReason: null,
        reviewedBy: req.user._id,
        reviewedAt: Date.now()
      },
      { new: true }
    ).populate('authorId', 'name');

    res.status(200).json({ success: true, post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const rejectPost = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const post = await Post.findOne({ id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { id },
      {
        reviewStatus: 'rejected',
        reviewReason: reason,
        reviewedBy: req.user._id,
        reviewedAt: Date.now()
      },
      { new: true }
    ).populate('authorId', 'name');

    res.status(200).json({ success: true, post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findOneAndDelete({ id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    res.status(200).json({ success: true, message: '帖子删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getCommentsForReview = async (req, res) => {
  const { status } = req.query;
  
  try {
    const query = status && status !== 'all' ? { reviewStatus: status } : {};
    const comments = await Comment.find(query)
      .populate('authorId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const approveComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findOneAndUpdate(
      { id },
      { reviewStatus: 'approved' },
      { new: true }
    ).populate('authorId', 'name');

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    res.status(200).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const rejectComment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const comment = await Comment.findOneAndUpdate(
      { id },
      { 
        reviewStatus: 'rejected',
        reviewReason: reason 
      },
      { new: true }
    ).populate('authorId', 'name');

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findOneAndDelete({ id });

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    res.status(200).json({ success: true, message: '评论删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getPendingPosts,
  getReviewPosts,
  getAllPostsWithReview,
  reviewPost,
  batchReview,
  getReviewStats,
  checkContent,
  detectSensitiveContent,
  getPostsForReview,
  approvePost,
  rejectPost,
  deletePost,
  getCommentsForReview,
  approveComment,
  rejectComment,
  deleteComment
};