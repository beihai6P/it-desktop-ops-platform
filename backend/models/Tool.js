const mongoose = require('../utils/mockMongoose');

const ToolCommentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String
  },
  content: {
    type: String,
    required: [true, '请输入评论内容'],
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  replies: [{
    id: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: [true, '请输入回复内容'],
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const ToolSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, '请输入工具名称'],
    trim: true,
    maxlength: [100, '名称不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '请输入工具描述'],
    trim: true
  },
  longDescription: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, '请选择分类'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  stars: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
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
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['script', 'tool', 'plugin'],
    default: 'tool'
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  fileSize: {
    type: String,
    trim: true
  },
  downloadUrl: {
    type: String,
    trim: true
  },
  screenshots: [{
    type: String
  }],
  license: {
    type: String,
    trim: true
  },
  compatibility: [{
    type: String,
    trim: true
  }],
  comments: [ToolCommentSchema],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Tool', ToolSchema);