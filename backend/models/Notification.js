const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, '用户ID不能为空']
  },
  type: {
    type: String,
    enum: ['system', 'comment', 'like', 'mention', 'task', 'review', 'ticket', 'message'],
    default: 'system'
  },
  title: {
    type: String,
    required: [true, '通知标题不能为空']
  },
  message: {
    type: String,
    required: [true, '通知内容不能为空']
  },
  link: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);