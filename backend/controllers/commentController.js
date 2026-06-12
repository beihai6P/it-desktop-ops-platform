const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { validationResult } = require('express-validator');

const generateCommentId = () => {
  return 'COM-' + Date.now().toString(36).toUpperCase();
};

const generateReplyId = () => {
  return 'REP-' + Date.now().toString(36).toUpperCase();
};

const getAllComments = async (req, res) => {
  const { postId, page = 1, limit = 20 } = req.query;
  const query = postId ? { postId } : {};

  try {
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
  try {
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

  const { postId, content } = req.body;

  try {
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

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateComment = async (req, res) => {
  try {
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
  try {
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
  try {
    const comment = await Comment.findOne({ id: req.params.id });

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    comment.likes++;
    await comment.save();

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

  try {
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