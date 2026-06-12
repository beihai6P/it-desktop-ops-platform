const Post = require('../models/Post');
const { validationResult } = require('express-validator');
const { detectSensitiveContent } = require('../utils/sensitiveWords');

const generatePostId = () => {
  return 'POST-' + Date.now().toString(36).toUpperCase();
};

const getAllPosts = async (req, res) => {
  const { category, status, authorId, page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  
  if (pageNum < 1) return res.status(400).json({ message: '页码必须大于0' });
  if (limitNum < 1 || limitNum > 100) return res.status(400).json({ message: '每页数量必须在1-100之间' });
  
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (authorId) query.authorId = authorId;

  // 如果是查询自己的帖子，不需要审核状态过滤
  if (!authorId && (!req.user || req.user.role !== 'admin')) {
    query.reviewStatus = 'approved';
  }

  try {
    const posts = await Post.find(query)
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

const getPostById = async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    post.views++;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content } = req.body;
    const foundKeywords = detectSensitiveContent(title + content);
    const reviewStatus = foundKeywords.length > 0 ? 'review' : 'approved';

    const postData = {
      ...req.body,
      id: generatePostId(),
      authorId: req.user._id,
      author: req.user.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reviewStatus,
      reviewReason: foundKeywords.length > 0 ? `检测到敏感词: ${foundKeywords.join(', ')}` : null
    };

    const post = await Post.create(postData);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const { title, content } = req.body;
    let updateData = { ...req.body, updatedAt: Date.now() };

    if (title || content) {
      const textToCheck = (title || post.title) + (content || post.content);
      const foundKeywords = detectSensitiveContent(textToCheck);
      updateData.reviewStatus = foundKeywords.length > 0 ? 'review' : 'pending';
      updateData.reviewReason = foundKeywords.length > 0 ? `检测到敏感词: ${foundKeywords.join(', ')}` : null;
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
    }

    const updatedPost = await Post.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Post.findOneAndDelete({ id: req.params.id });
    res.status(200).json({ message: '帖子已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    post.likes++;
    post.isLiked = true;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    post.isBookmarked = !post.isBookmarked;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getHotPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ views: -1 })
      .limit(10);

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getPostStats = async (req, res) => {
  try {
    const total = await Post.countDocuments();
    const todayPosts = await Post.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const hotPosts = await Post.countDocuments({ status: 'hot' });
    const avgDailyPosts = await Post.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $group: { _id: null, avg: { $avg: '$count' } } }
    ]);

    res.status(200).json({
      total,
      todayPosts,
      hotPosts,
      avgDailyPosts: avgDailyPosts[0]?.avg ? avgDailyPosts[0].avg.toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  toggleBookmark,
  getHotPosts,
  getPostStats
};