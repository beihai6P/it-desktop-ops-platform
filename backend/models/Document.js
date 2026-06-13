const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, '请输入文档标题'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  category: {
    type: String,
    required: [true, '请选择分类'],
    trim: true
  },
  type: {
    type: String,
    required: [true, '请选择类型'],
    trim: true
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    required: [true, '请输入作者名称']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft'
  },
  version: {
    type: String,
    default: '1.0'
  }
});

module.exports = mongoose.model('Document', DocumentSchema);