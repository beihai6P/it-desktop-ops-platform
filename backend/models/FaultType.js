const mongoose = require('../utils/mockMongoose');

const faultTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['system', 'network', 'hardware', 'software'],
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard'],
  },
  steps: [{
    title: String,
    description: String,
    commands: [String],
  }],
}, { timestamps: true });

module.exports = mongoose.model('FaultType', faultTypeSchema);