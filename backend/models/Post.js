const mongoose = require('../utils/mockMongoose');

const PostSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, '请输入帖子标题'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  content: {
    type: String,
    required: [true, '请输入帖子内容'],
    trim: true
  },
  author: {
    type: String,
    required: [true, '请输入作者名称']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['hot', 'new', 'normal'],
    default: 'normal'
  },
  reviewStatus: {
    type: String,
    enum: ['pending', 'review', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewReason: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  category: {
    type: String,
    required: [true, '请选择分类'],
    trim: true
  },
  views: {
    type: Number,
    default: 0
  },
  isLiked: {
    type: Boolean,
    default: false
  },
  isBookmarked: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Post', PostSchema);