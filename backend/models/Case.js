const mongoose = require('mongoose');

const CaseStepSchema = new mongoose.Schema({
  step: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  commands: [{
    type: String
  }],
  expectedResult: {
    type: String,
    trim: true
  }
});

const CaseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, '请输入案例标题'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  errorCode: {
    type: String,
    trim: true
  },
  deviceType: {
    type: String,
    required: [true, '请选择设备类型'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, '请输入品牌'],
    trim: true
  },
  model: {
    type: String,
    required: [true, '请输入型号'],
    trim: true
  },
  status: {
    type: String,
    enum: ['resolved', 'pending', 'in_progress'],
    default: 'pending'
  },
  views: {
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
  author: {
    type: String,
    required: [true, '请输入作者名称']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [{
    type: String,
    required: [true, '请输入症状描述']
  }],
  causeAnalysis: {
    type: String,
    required: [true, '请输入原因分析'],
    trim: true
  },
  solution: {
    type: String,
    required: [true, '请输入解决方案'],
    trim: true
  },
  steps: [CaseStepSchema],
  relatedCases: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  verification: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  attachments: [{
    name: String,
    url: String,
    storagePath: String,
    mimeType: String,
    size: Number
  }]
});

module.exports = mongoose.model('Case', CaseSchema);