const { validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

// 获取所有用户 (管理员)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, role } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (role) {
      query.role = role;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('roles', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取单个用户
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('roles', 'name code description permissions');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取用户完整权限信息
    const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
    
    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        roles: roles,
        permissions: roles.flatMap(r => r.permissions)
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建用户 (管理员)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors.array()
      });
    }
    
    const { name, email, password, role, phone, department, position, roles: userRoles, isAdmin } = req.body;
    
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }
    
    // 如果提供了角色ID，验证角色是否存在
    if (userRoles && userRoles.length > 0) {
      const validRoles = await Role.find({ _id: { $in: userRoles } });
      if (validRoles.length !== userRoles.length) {
        return res.status(400).json({
          success: false,
          message: '部分角色不存在'
        });
      }
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      phone,
      department,
      position,
      roles: userRoles || [],
      isAdmin: isAdmin || false
    });
    
    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更新用户 (管理员)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, status, phone, department, position, roles: userRoles, isAdmin } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 如果更换邮箱，检查新邮箱是否已被使用
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被使用'
        });
      }
      user.email = email;
    }
    
    // 更新字段
    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    
    // 更新角色
    if (userRoles !== undefined) {
      const validRoles = await Role.find({ _id: { $in: userRoles } });
      if (validRoles.length !== userRoles.length) {
        return res.status(400).json({
          success: false,
          message: '部分角色不存在'
        });
      }
      user.roles = userRoles;
    }
    
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('roles', 'name code');
    
    res.status(200).json({
      success: true,
      message: '用户更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 删除用户 (管理员)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 不能删除自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能删除当前登录用户'
      });
    }
    
    // 不能删除超级管理员
    if (user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '不能删除超级管理员'
      });
    }
    
    await User.findByIdAndDelete(user._id);
    
    res.status(200).json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 批量删除用户 (管理员)
exports.deleteMultipleUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的用户ID列表'
      });
    }
    
    // 检查是否包含当前用户
    if (ids.includes(req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: '不能删除当前登录用户'
      });
    }
    
    // 检查是否包含超级管理员
    const usersToDelete = await User.find({ _id: { $in: ids } });
    const hasAdmin = usersToDelete.some(u => u.isAdmin);
    if (hasAdmin) {
      return res.status(403).json({
        success: false,
        message: '不能删除超级管理员'
      });
    }
    
    await User.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json({
      success: true,
      message: '批量删除成功'
    });
  } catch (error) {
    console.error('批量删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 重置用户密码 (管理员)
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 锁定/解锁用户 (管理员)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 不能锁定自己
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能修改当前登录用户状态'
      });
    }
    
    // 不能锁定超级管理员
    if (user.isAdmin && status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '不能锁定超级管理员'
      });
    }
    
    user.status = status;
    if (status === 'active') {
      user.loginAttempts = 0;
      user.lockedUntil = null;
    }
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '用户状态更新成功',
      data: { status: user.status }
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取用户统计信息 (管理员)
exports.getUserStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, bannedUsers, adminCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ isAdmin: true })
    ]);
    
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        banned: bannedUsers,
        admins: adminCount,
        recentUsers
      }
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};
