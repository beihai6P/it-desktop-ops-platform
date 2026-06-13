const mongoose = require('mongoose');

/**
 * 文件分片上传记录Schema
 */
const FileChunkSchema = new mongoose.Schema({
  uploadId: {
    type: String,
    required: true,
    index: true
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  chunkHash: {
    type: String,
    required: true
  },
  chunkSize: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  tempPath: {
    type: String,
    required: true
  }
});

/**
 * 文件版本Schema
 */
const FileVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  storagePath: {
    type: String,
    required: true
  },
  changelog: {
    type: String,
    default: ''
  }
});

/**
 * 下载令牌Schema
 */
const DownloadTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StorageFile',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1小时后自动删除
  },
  expiresAt: {
    type: Date,
    required: true
  },
  downloadLimit: {
    type: Number,
    default: 1
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
});

/**
 * 存储文件主Schema
 */
const StorageFileSchema = new mongoose.Schema({
  // 文件唯一标识
  fileId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 原始文件名
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  
  // 存储文件名（唯一）
  storageName: {
    type: String,
    required: true,
    unique: true
  },
  
  // 文件扩展名
  extension: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  // MIME类型
  mimeType: {
    type: String,
    required: true
  },
  
  // 文件大小（字节）
  size: {
    type: Number,
    required: true
  },
  
  // 文件哈希值
  hash: {
    md5: {
      type: String,
      required: true
    },
    sha256: {
      type: String,
      required: true
    }
  },
  
  // 存储路径
  storagePath: {
    type: String,
    required: true
  },
  
  // 关联的工具ID（可选）
  toolId: {
    type: String,
    index: true
  },
  
  // 文件分类
  category: {
    type: String,
    enum: ['tool', 'document', 'image', 'video', 'other'],
    default: 'other'
  },
  
  // 访问权限
  accessLevel: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'private'
  },
  
  // 允许访问的角色列表（当accessLevel为restricted时生效）
  allowedRoles: [{
    type: String
  }],
  
  // 允许访问的用户ID列表
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 上传者信息
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 上传时间
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // 最后更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // 文件版本
  currentVersion: {
    type: String,
    default: '1.0.0'
  },
  
  // 版本历史
  versions: [FileVersionSchema],
  
  // 下载统计
  downloadCount: {
    type: Number,
    default: 0
  },
  
  // 带宽使用统计（字节）
  bandwidthUsed: {
    type: Number,
    default: 0
  },
  
  // 文件状态
  status: {
    type: String,
    enum: ['uploading', 'active', 'archived', 'deleted'],
    default: 'active'
  },
  
  // 元数据
  metadata: {
    description: {
      type: String,
      default: ''
    },
    tags: [{
      type: String,
      trim: true
    }],
    customFields: {
      type: Map,
      of: String
    }
  },
  
  // 过期时间（可选，用于临时文件）
  expiresAt: {
    type: Date,
    default: null
  },
  
  // 是否启用防盗链
  enableHotlinkProtection: {
    type: Boolean,
    default: false
  },
  
  // 允许的Referer列表
  allowedReferers: [{
    type: String
  }],
  
  // IP白名单
  ipWhitelist: [{
    type: String
  }],
  
  // IP黑名单
  ipBlacklist: [{
    type: String
  }],
  
  // 下载频率限制（每分钟）
  downloadRateLimit: {
    type: Number,
    default: 0 // 0表示不限制
  }
}, {
  timestamps: true,
  collection: 'storage_files'
});

// 索引
StorageFileSchema.index({ uploadedBy: 1, uploadedAt: -1 });
StorageFileSchema.index({ category: 1, status: 1 });
StorageFileSchema.index({ toolId: 1 });
StorageFileSchema.index({ 'hash.md5': 1 });
StorageFileSchema.index({ 'hash.sha256': 1 });

// 方法：增加下载计数
StorageFileSchema.methods.incrementDownload = async function(bytesTransferred = 0) {
  this.downloadCount += 1;
  this.bandwidthUsed += bytesTransferred;
  return this.save();
};

// 方法：检查访问权限
StorageFileSchema.methods.checkAccess = function(user, ipAddress = null) {
  // 公开文件，任何人可访问
  if (this.accessLevel === 'public') {
    return { allowed: true };
  }
  
  // 未登录用户
  if (!user) {
    return { allowed: false, reason: '需要登录' };
  }
  
  // 管理员始终有权限
  if (user.role === 'admin') {
    return { allowed: true };
  }
  
  // 上传者有权限
  if (this.uploadedBy.toString() === user._id.toString()) {
    return { allowed: true };
  }
  
  // 受限访问
  if (this.accessLevel === 'restricted') {
    // 检查用户是否在允许列表中
    if (this.allowedUsers && this.allowedUsers.some(id => id.toString() === user._id.toString())) {
      return { allowed: true };
    }
    
    // 检查角色是否在允许列表中
    if (this.allowedRoles && this.allowedRoles.includes(user.role)) {
      return { allowed: true };
    }
    
    return { allowed: false, reason: '没有访问权限' };
  }
  
  // 私有文件，只有上传者和管理员可访问
  return { allowed: false, reason: '私有文件' };
};

// 方法：检查防盗链
StorageFileSchema.methods.checkHotlink = function(referer, ipAddress) {
  if (!this.enableHotlinkProtection) {
    return { allowed: true };
  }
  
  // 检查IP黑名单
  if (this.ipBlacklist && this.ipBlacklist.length > 0) {
    if (this.ipBlacklist.includes(ipAddress)) {
      return { allowed: false, reason: 'IP被禁止访问' };
    }
  }
  
  // 检查IP白名单
  if (this.ipWhitelist && this.ipWhitelist.length > 0) {
    if (!this.ipWhitelist.includes(ipAddress)) {
      return { allowed: false, reason: 'IP不在白名单中' };
    }
  }
  
  // 检查Referer
  if (this.allowedReferers && this.allowedReferers.length > 0) {
    if (!referer) {
      return { allowed: false, reason: '缺少Referer' };
    }
    
    const refererAllowed = this.allowedReferers.some(allowed => {
      try {
        const refererUrl = new URL(referer);
        const allowedUrl = new URL(allowed);
        return refererUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });
    
    if (!refererAllowed) {
      return { allowed: false, reason: 'Referer不被允许' };
    }
  }
  
  return { allowed: true };
};

// 静态方法：生成文件ID
StorageFileSchema.statics.generateFileId = function() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `FILE-${timestamp}-${randomStr}`.toUpperCase();
};

// 静态方法：生成存储文件名
StorageFileSchema.statics.generateStorageName = function(originalName) {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  const ext = originalName.split('.').pop() || '';
  return `${timestamp}-${randomStr}.${ext}`.toLowerCase();
};

// 静态方法：获取存储统计
StorageFileSchema.statics.getStorageStats = async function() {
  const stats = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        totalDownloads: { $sum: '$downloadCount' },
        totalBandwidth: { $sum: '$bandwidthUsed' }
      }
    }
  ]);
  
  const categoryStats = await this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        size: { $sum: '$size' }
      }
    }
  ]);
  
  return {
    overall: stats[0] || { totalFiles: 0, totalSize: 0, totalDownloads: 0, totalBandwidth: 0 },
    byCategory: categoryStats
  };
};

const StorageFile = mongoose.model('StorageFile', StorageFileSchema);
const FileChunk = mongoose.model('FileChunk', FileChunkSchema);
const DownloadToken = mongoose.model('DownloadToken', DownloadTokenSchema);

module.exports = {
  StorageFile,
  FileChunk,
  DownloadToken
};