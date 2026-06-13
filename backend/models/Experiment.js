const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  faultType: {
    type: String,
    required: true,
  },
  faultTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FaultType',
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  result: {
    type: Object,
  },
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    message: String,
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Experiment', experimentSchema);