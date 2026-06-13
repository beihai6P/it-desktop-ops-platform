const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { StorageFile, DownloadToken } = require('../models/StorageFile');
const { verifyDownloadToken, verifySignedUrl } = require('../utils/fileUtils');

// 下载频率限制存储（内存存储，生产环境应使用Redis）
const downloadRateLimitStore = new Map();

// API密钥存储（生产环境应使用数据库）
const apiKeys = new Map();

/**
 * 存储认证中间件 - 验证用户登录状态
 */
const storageAuth = async (req, res, next) => {
  let token;

  // 从Authorization头获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // 从查询参数获取token
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: '未授权，需要登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    if (req.user.status === 'banned') {
      return res.status(403).json({ message: '账号已被禁用' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: '未授权，token无效' });
  }
};

/**
 * 可选认证中间件 - 有token则验证，无token则继续
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (req.user && req.user.status === 'banned') {
        req.user = null;
      }
    } catch {
      // Token无效，继续但不设置用户
      req.user = null;
    }
  }

  next();
};

/**
 * 文件访问权限检查中间件
 */
const checkFileAccess = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await StorageFile.findOne({ fileId, status: 'active' });

    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 检查文件是否过期
    if (file.expiresAt && file.expiresAt < new Date()) {
      return res.status(410).json({ message: '文件已过期' });
    }

    // 获取客户端IP
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

    // 检查访问权限
    const accessResult = file.checkAccess(req.user, clientIp);
    if (!accessResult.allowed) {
      return res.status(403).json({ message: accessResult.reason || '没有访问权限' });
    }

    // 检查防盗链
    const referer = req.headers.referer || req.headers.referrer;
    const hotlinkResult = file.checkHotlink(referer, clientIp);
    if (!hotlinkResult.allowed) {
      return res.status(403).json({ message: hotlinkResult.reason || '访问被拒绝' });
    }

    // 检查下载频率限制
    if (file.downloadRateLimit > 0) {
      const rateLimitKey = `${fileId}:${clientIp}`;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1分钟窗口
      
      const rateInfo = downloadRateLimitStore.get(rateLimitKey) || { count: 0, resetAt: now + windowMs };
      
      if (now > rateInfo.resetAt) {
        rateInfo.count = 0;
        rateInfo.resetAt = now + windowMs;
      }
      
      if (rateInfo.count >= file.downloadRateLimit) {
        return res.status(429).json({ 
          message: '下载频率超限，请稍后再试',
          retryAfter: Math.ceil((rateInfo.resetAt - now) / 1000)
        });
      }
      
      rateInfo.count++;
      downloadRateLimitStore.set(rateLimitKey, rateInfo);
    }

    // 将文件信息附加到请求对象
    req.storageFile = file;
    next();
  } catch (error) {
    console.error('文件访问检查错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * 下载令牌验证中间件
 */
const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ message: '缺少下载令牌' });
    }

    // 验证令牌
    const tokenData = verifyDownloadToken(token);
    if (!tokenData) {
      return res.status(401).json({ message: '下载令牌无效或已过期' });
    }

    // 查找文件
    const file = await StorageFile.findOne({ fileId: tokenData.f, status: 'active' });
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 检查数据库中的下载令牌
    const dbToken = await DownloadToken.findOne({ token });
    if (dbToken) {
      // 检查下载次数限制
      if (dbToken.downloadCount >= dbToken.downloadLimit) {
        return res.status(403).json({ message: '下载次数已用完' });
      }
      
      // 检查IP限制
      const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      if (dbToken.ipAddress && dbToken.ipAddress !== clientIp) {
        return res.status(403).json({ message: 'IP地址不匹配' });
      }
      
      // 增加下载计数
      dbToken.downloadCount++;
      await dbToken.save();
    }

    req.storageFile = file;
    req.tokenData = tokenData;
    next();
  } catch (error) {
    console.error('令牌验证错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * 签名URL验证中间件
 */
const verifySignature = async (req, res, next) => {
  try {
    const { fileId, userId, expires, signature } = req.query;

    if (!fileId || !userId || !expires || !signature) {
      return res.status(401).json({ message: '缺少签名参数' });
    }

    // 验证签名
    const isValid = verifySignedUrl(fileId, userId, parseInt(expires, 10), signature);
    if (!isValid) {
      return res.status(401).json({ message: '签名无效或已过期' });
    }

    // 查找文件
    const file = await StorageFile.findOne({ fileId, status: 'active' });
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    req.storageFile = file;
    req.signatureData = { fileId, userId, expires };
    next();
  } catch (error) {
    console.error('签名验证错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * 管理员权限中间件
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: '需要管理员权限' });
  }
};

/**
 * 上传权限中间件
 */
const canUpload = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '需要登录' });
  }

  // 检查用户角色权限
  const allowedRoles = ['admin', 'moderator', 'user', 'member'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: '没有上传权限' });
  }

  // 检查用户状态
  if (req.user.status === 'banned') {
    return res.status(403).json({ message: '账号已被禁用' });
  }

  next();
};

/**
 * 删除权限中间件
 */
const canDelete = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await StorageFile.findOne({ fileId });

    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 管理员可以删除任何文件
    if (req.user.role === 'admin') {
      req.storageFile = file;
      return next();
    }

    // 上传者可以删除自己的文件
    if (file.uploadedBy.toString() === req.user._id.toString()) {
      req.storageFile = file;
      return next();
    }

    return res.status(403).json({ message: '没有删除权限' });
  } catch (error) {
    console.error('删除权限检查错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * API密钥验证中间件
 */
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({ message: '缺少API密钥' });
  }

  // 生产环境应从数据库验证
  // 这里使用简单的内存存储示例
  const keyInfo = apiKeys.get(apiKey);
  
  if (!keyInfo) {
    return res.status(401).json({ message: 'API密钥无效' });
  }

  if (keyInfo.expiresAt && keyInfo.expiresAt < new Date()) {
    apiKeys.delete(apiKey);
    return res.status(401).json({ message: 'API密钥已过期' });
  }

  // 检查权限
  if (keyInfo.permissions && !keyInfo.permissions.includes(req.route?.path)) {
    return res.status(403).json({ message: 'API密钥没有此操作的权限' });
  }

  // 更新使用统计
  keyInfo.lastUsedAt = new Date();
  keyInfo.usageCount++;
  apiKeys.set(apiKey, keyInfo);

  req.apiKey = keyInfo;
  next();
};

/**
 * 创建API密钥（管理员功能）
 */
const createApiKey = (name, permissions = [], expiresInDays = 365) => {
  const crypto = require('crypto');
  const key = crypto.randomBytes(32).toString('hex');
  
  const keyInfo = {
    key,
    name,
    permissions,
    createdAt: new Date(),
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
    usageCount: 0,
    lastUsedAt: null
  };
  
  apiKeys.set(key, keyInfo);
  return key;
};

/**
 * 撤销API密钥
 */
const revokeApiKey = (key) => {
  return apiKeys.delete(key);
};

/**
 * 列出所有API密钥
 */
const listApiKeys = () => {
  const keys = [];
  for (const [key, info] of apiKeys) {
    keys.push({
      key: key.substring(0, 8) + '...',
      name: info.name,
      permissions: info.permissions,
      createdAt: info.createdAt,
      expiresAt: info.expiresAt,
      usageCount: info.usageCount,
      lastUsedAt: info.lastUsedAt
    });
  }
  return keys;
};

/**
 * 文件大小限制中间件
 */
const fileSizeLimit = (maxSize) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    
    if (contentLength && contentLength > maxSize) {
      return res.status(413).json({ 
        message: `文件大小超过限制（最大 ${Math.round(maxSize / 1024 / 1024)}MB）` 
      });
    }
    
    next();
  };
};

/**
 * 文件类型检查中间件
 */
const fileTypeCheck = (allowedTypes = []) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];
    
    for (const file of files) {
      const ext = '.' + file.originalname.split('.').pop().toLowerCase();
      
      if (allowedTypes.length > 0 && !allowedTypes.includes(ext)) {
        return res.status(400).json({ 
          message: `不支持的文件类型: ${ext}`,
          allowedTypes 
        });
      }
    }
    
    next();
  };
};

/**
 * 清理下载频率限制缓存（定时任务）
 */
const cleanupRateLimitCache = () => {
  const now = Date.now();
  for (const [key, value] of downloadRateLimitStore) {
    if (now > value.resetAt) {
      downloadRateLimitStore.delete(key);
    }
  }
};

// 每5分钟清理一次
setInterval(cleanupRateLimitCache, 5 * 60 * 1000);

module.exports = {
  storageAuth,
  optionalAuth,
  checkFileAccess,
  verifyToken,
  verifySignature,
  adminOnly,
  canUpload,
  canDelete,
  apiKeyAuth,
  createApiKey,
  revokeApiKey,
  listApiKeys,
  fileSizeLimit,
  fileTypeCheck
};