const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Tool = require('../models/Tool');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

const generateCommentId = () => {
  return 'COM-' + Date.now().toString(36).toUpperCase();
};

const generateReplyId = () => {
  return 'REP-' + Date.now().toString(36).toUpperCase();
};

const createNotification = async (userId, type, title, message, link, metadata = {}) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      priority: 'medium',
      metadata
    });
  } catch (error) {
    console.error('创建通知失败:', error);
  }
};

const getAllComments = async (req, res) => {
  const { postId, toolId, page = 1, limit = 20 } = req.query;
  
  try {
    if (toolId) {
      const tool = await Tool.findOne({ id: toolId });
      if (!tool) {
        return res.status(404).json({ message: '工具不存在' });
      }
      
      const total = tool.comments.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const comments = tool.comments.slice(startIndex, endIndex);
      
      return res.json({
        comments,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      });
    }
    
    const query = postId ? { postId } : {};
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments(query);

    res.json({
      comments,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const getCommentById = async (req, res) => {
  const { toolId } = req.query;
  
  try {
    if (toolId) {
      const tool = await Tool.findOne({ 'comments.id': req.params.id });
      if (!tool) {
        return res.status(404).json({ message: '评论不存在' });
      }
      
      const comment = tool.comments.find(c => c.id === req.params.id);
      if (!comment) {
        return res.status(404).json({ message: '评论不存在' });
      }
      
      return res.json(comment);
    }
    
    const comment = await Comment.findOne({ id: req.params.id });
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const createComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { postId, toolId, content, rating = 0 } = req.body;

  try {
    if (toolId) {
      const tool = await Tool.findOne({ id: toolId });
      if (!tool) {
        return res.status(404).json({ message: '工具不存在' });
      }

      const newComment = {
        id: generateCommentId(),
        userId: req.user._id,
        userName: req.user.name,
        avatar: req.user.avatar,
        content,
        rating,
        createdAt: Date.now(),
        replies: []
      };

      tool.comments.push(newComment);
      await tool.save();

      return res.status(201).json(newComment);
    }

    const post = await Post.findOne({ id: postId });
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const comment = await Comment.create({
      id: generateCommentId(),
      postId,
      content,
      author: req.user.name,
      authorId: req.user._id
    });

    post.comments++;
    await post.save();

    if (post.authorId.toString() !== req.user._id.toString()) {
      await createNotification(
        post.authorId,
        'comment',
        '新评论通知',
        `${req.user.name} 评论了您的帖子`,
        `/posts/${postId}`,
        { postId, commentId: comment.id }
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateComment = async (req, res) => {
  const { toolId } = req.query;
  
  try {
    if (toolId) {
      const tool = await Tool.findOne({ 'comments.id': req.params.id });
      if (!tool) {
        return res.status(404).json({ message: '评论不存在' });
      }

      const comment = tool.comments.find(c => c.id === req.params.id);
      if (!comment) {
        return res.status(404).json({ message: '评论不存在' });
      }

      if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: '没有权限' });
      }

      comment.content = req.body.content;
      await tool.save();

      return res.json(comment);
    }

    const comment = await Comment.findOne({ id: req.params.id });
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    if (comment.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const updatedComment = await Comment.findOneAndUpdate(
      { id: req.params.id },
      { content: req.body.content },
      { new: true }
    );

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteComment = async (req, res) => {
  const { toolId } = req.query;
  
  try {
    if (toolId) {
      const tool = await Tool.findOne({ 'comments.id': req.params.id });
      if (!tool) {
        return res.status(404).json({ message: '评论不存在' });
      }

      const comment = tool.comments.find(c => c.id === req.params.id);
      if (!comment) {
        return res.status(404).json({ message: '评论不存在' });
      }

      if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: '没有权限' });
      }

      tool.comments = tool.comments.filter(c => c.id !== req.params.id);
      await tool.save();

      return res.json({ message: '评论已删除' });
    }

    const comment = await Comment.findOne({ id: req.params.id });
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    if (comment.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限' });
    }

    const post = await Post.findOne({ id: comment.postId });
    if (post) {
      post.comments--;
      await post.save();
    }

    await Comment.findOneAndDelete({ id: req.params.id });
    res.json({ message: '评论已删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const likeComment = async (req, res) => {
  const { toolId } = req.query;
  
  try {
    if (toolId) {
      const tool = await Tool.findOne({ 'comments.id': req.params.id });
      if (!tool) {
        return res.status(404).json({ message: '评论不存在' });
      }

      const comment = tool.comments.find(c => c.id === req.params.id);
      if (!comment) {
        return res.status(404).json({ message: '评论不存在' });
      }

      comment.likes = (comment.likes || 0) + 1;
      await tool.save();

      if (comment.userId.toString() !== req.user._id.toString()) {
        await createNotification(
          comment.userId,
          'like',
          '点赞通知',
          `${req.user.name} 点赞了您的评论`,
          `/tools/${toolId}`,
          { toolId, commentId: comment.id }
        );
      }

      return res.json(comment);
    }

    const comment = await Comment.findOne({ id: req.params.id });
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    comment.likes++;
    await comment.save();

    if (comment.authorId.toString() !== req.user._id.toString()) {
      await createNotification(
        comment.authorId,
        'like',
        '点赞通知',
        `${req.user.name} 点赞了您的评论`,
        `/posts/${comment.postId}`,
        { postId: comment.postId, commentId: comment.id }
      );
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const addReply = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content } = req.body;
  const { toolId } = req.query;

  try {
    if (toolId) {
      const tool = await Tool.findOne({ 'comments.id': req.params.id });
      if (!tool) {
        return res.status(404).json({ message: '评论不存在' });
      }

      const comment = tool.comments.find(c => c.id === req.params.id);
      if (!comment) {
        return res.status(404).json({ message: '评论不存在' });
      }

      const reply = {
        id: generateReplyId(),
        userId: req.user._id,
        userName: req.user.name,
        content,
        createdAt: Date.now()
      };

      comment.replies.push(reply);
      await tool.save();

      if (comment.userId.toString() !== req.user._id.toString()) {
        await createNotification(
          comment.userId,
          'comment',
          '回复通知',
          `${req.user.name} 回复了您的评论`,
          `/tools/${toolId}`,
          { toolId, commentId: comment.id, replyId: reply.id }
        );
      }

      return res.status(201).json(comment);
    }

    const comment = await Comment.findOne({ id: req.params.id });
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const reply = {
      id: generateReplyId(),
      commentId: comment.id,
      content,
      author: req.user.name,
      authorId: req.user._id,
      createdAt: Date.now()
    };

    comment.replies.push(reply);
    await comment.save();

    if (comment.authorId.toString() !== req.user._id.toString()) {
      await createNotification(
        comment.authorId,
        'comment',
        '回复通知',
        `${req.user.name} 回复了您的评论`,
        `/posts/${comment.postId}`,
        { postId: comment.postId, commentId: comment.id, replyId: reply.id }
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  addReply
};