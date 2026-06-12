const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401).json({ message: '用户不存在' });
        return;
      }
      
      if (req.user.status === 'banned') {
        res.status(403).json({ message: '账号已被禁用' });
        return;
      }
      
      next();
    } catch (error) {
      res.status(401).json({ message: '未授权，token无效' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: '未授权，没有token' });
    return;
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '没有管理员权限' });
  }
};

const moderator = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
    next();
  } else {
    res.status(403).json({ message: '没有权限' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: '没有权限访问此资源' });
      return;
    }
    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: '未授权' });
      return;
    }

    const userPermissions = req.user.permissions || [];
    const rolePermissions = req.user.roles ? req.user.roles.flatMap(role => role.permissions || []) : [];
    const allPermissions = [...userPermissions, ...rolePermissions];

    if (!allPermissions.includes(permission)) {
      res.status(403).json({ message: '没有足够的权限' });
      return;
    }
    next();
  };
};

module.exports = { protect, admin, moderator, authorize, requirePermission };