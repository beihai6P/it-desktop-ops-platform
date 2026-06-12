const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '权限名称不能为空'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, '权限代码不能为空'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['user', 'case', 'tool', 'document', 'system', 'report'],
    default: 'system'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Permission', permissionSchema);
