const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  commentId: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, '请输入回复内容'],
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CommentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  postId: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: [true, '请输入作者名称'],
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, '请输入评论内容'],
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  replies: [ReplySchema]
});

module.exports = mongoose.model('Comment', CommentSchema);