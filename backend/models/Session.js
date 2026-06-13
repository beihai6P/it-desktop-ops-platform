const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['host', 'viewer', 'editor'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['online', 'away'],
    default: 'online'
  }
});

const SessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, '请输入会话标题'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  participants: {
    type: Number,
    default: 0
  },
  participantList: [ParticipantSchema],
  status: {
    type: String,
    enum: ['active', 'pending', 'ended'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: [true, '请输入开始时间']
  },
  endTime: {
    type: Date
  },
  type: {
    type: String,
    enum: ['screen', 'video', 'chat'],
    default: 'screen'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', SessionSchema);