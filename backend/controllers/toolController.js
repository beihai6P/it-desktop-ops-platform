const Tool = require('../models/Tool');
const { validationResult } = require('express-validator');

const generateToolId = () => {
  return 'TOOL-' + Date.now().toString(36).toUpperCase();
};

const generateCommentId = () => {
  return 'TC-' + Date.now().toString(36).toUpperCase();
};

const getAllTools = async (req, res) => {
  const { category, type, authorId, page = 1, limit = 10 } = req.query;
  const query = {};

  if (category) query.category = category;
  if (type) query.type = type;
  if (authorId) query.authorId = authorId;

  try {
    const tools = await Tool.find(query)
      .sort({ downloads: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tool.countDocuments(query);

    res.json({
      tools,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getToolById = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    tool.views++;
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createTool = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const toolData = {
      ...req.body,
      id: generateToolId(),
      authorId: req.user._id,
      author: req.user.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      comments: []
    };

    const tool = await Tool.create(toolData);
    res.status(201).json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (tool.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedTool = await Tool.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedTool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (tool.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    await Tool.findOneAndDelete({ id: req.params.id });
    res.json({ message: '工具已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const downloadTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    tool.downloads++;
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const addComment = async (req, res) => {
  const { content, rating } = req.body;

  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    const comment = {
      id: generateCommentId(),
      userId: req.user._id,
      userName: req.user.name,
      content,
      rating: rating || 0,
      createdAt: Date.now(),
      replies: []
    };

    tool.comments.push(comment);
    
    if (rating) {
      const totalRating = tool.comments.reduce((sum, c) => sum + (c.rating || 0), 0);
      tool.stars = (totalRating / tool.comments.length).toFixed(1);
    }
    
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const addCommentReply = async (req, res) => {
  const { commentId, content } = req.body;

  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    const comment = tool.comments.find(c => c.id === commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const reply = {
      id: generateCommentId() + '-R',
      userId: req.user._id,
      userName: req.user.name,
      content,
      createdAt: Date.now()
    };

    comment.replies.push(reply);
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const verifyTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    tool.isVerified = true;
    tool.updatedAt = Date.now();
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const featureTool = async (req, res) => {
  try {
    const tool = await Tool.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: '工具不存在' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    tool.isFeatured = !tool.isFeatured;
    tool.updatedAt = Date.now();
    await tool.save();

    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getToolStats = async (req, res) => {
  try {
    const total = await Tool.countDocuments();
    const totalDownloads = await Tool.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]);
    const avgRating = await Tool.aggregate([{ $group: { _id: null, avg: { $avg: '$stars' } } }]);
    const featuredCount = await Tool.countDocuments({ isFeatured: true });
    const verifiedCount = await Tool.countDocuments({ isVerified: true });

    res.json({
      total,
      totalDownloads: totalDownloads[0]?.total || 0,
      avgRating: avgRating[0]?.avg ? avgRating[0].avg.toFixed(1) : 0,
      featuredCount,
      verifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
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
};