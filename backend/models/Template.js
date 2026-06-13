const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, '请输入模板标题'],
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
  author: {
    type: String,
    required: [true, '请输入作者名称']
  },
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['verified', 'draft'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Template', TemplateSchema);