const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// 生成JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// 用户注册
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // 检查用户是否已存在
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 创建新用户
    user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 检查用户是否存在
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 检查账号是否被锁定
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `账号已被锁定，请 ${remainingTime} 分钟后重试`
      });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    
    // 更新登录尝试次数
    if (!isMatch) {
      user.loginAttempts += 1;
      
      // 如果连续失败5次，锁定账号30分钟
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        return res.status(423).json({
          success: false,
          message: '连续登录失败次数过多，账号已被锁定30分钟'
        });
      }
      
      await user.save();
      return res.status(401).json({
        success: false,
        message: `邮箱或密码错误，剩余尝试次数: ${5 - user.loginAttempts}`
      });
    }

    // 登录成功，重置登录尝试次数
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    // 直接使用已验证的用户数据，不依赖populate
    res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user._id,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'member',
        isAdmin: user.isAdmin || user.role === 'admin',
        avatar: user.avatar || null,
        status: user.status || 'offline'
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取当前用户信息
exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 构建返回数据，确保所有字段都有默认值
    const userData = {
      _id: user._id,
      id: user._id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'member',
      avatar: user.avatar || null,
      status: user.status || 'offline',
      isAdmin: user.isAdmin || user.role === 'admin',
      roles: user.roles || [],
      permissions: user.permissions || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更新用户信息
exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // 不允许通过此接口更新密码
    delete updates.isAdmin; // 不允许通过此接口修改管理员状态
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更改密码
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    // 验证当前密码
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }

    user.password = newPassword;
    await user.save();

    // 生成新token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: '密码更改成功',
      token
    });
  } catch (error) {
    console.error('更改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 刷新Token
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    console.error('刷新Token失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取所有用户（管理员）
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 根据ID获取用户（管理员）
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更新用户信息（管理员）
exports.updateUserById = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 删除用户（管理员）
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};
