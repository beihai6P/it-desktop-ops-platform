const { validationResult } = require('express-validator');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');

// 获取所有角色
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissions', 'name code description category')
      .sort({ level: 1, createdAt: 1 });
    
    res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取单个角色
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissions', 'name code description category');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 获取使用此角色的用户数
    const userCount = await User.countDocuments({ roles: role._id });
    
    res.status(200).json({
      success: true,
      data: {
        ...role.toObject(),
        userCount
      }
    });
  } catch (error) {
    console.error('获取角色详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建角色
exports.createRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors.array()
      });
    }
    
    const { name, code, description, level, permissions, isDefault } = req.body;
    
    // 检查角色代码是否已存在
    const existingRole = await Role.findOne({ code: code.toUpperCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: '该角色代码已存在'
      });
    }
    
    // 验证权限ID是否有效
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ _id: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: '部分权限不存在'
        });
      }
    }
    
    const role = await Role.create({
      name,
      code: code.toUpperCase(),
      description,
      level: level || 1,
      permissions: permissions || [],
      isDefault: isDefault || false
    });
    
    const populatedRole = await Role.findById(role._id)
      .populate('permissions', 'name code description category');
    
    res.status(201).json({
      success: true,
      message: '角色创建成功',
      data: populatedRole
    });
  } catch (error) {
    console.error('创建角色失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更新角色
exports.updateRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors.array()
      });
    }
    
    const { name, code, description, level, permissions, isActive, isDefault } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 如果更换代码，检查新代码是否已被使用
    if (code && code.toUpperCase() !== role.code) {
      const existingRole = await Role.findOne({ code: code.toUpperCase() });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: '该角色代码已存在'
        });
      }
      role.code = code.toUpperCase();
    }
    
    // 更新字段
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (level !== undefined) role.level = level;
    if (isActive !== undefined) role.isActive = isActive;
    if (isDefault !== undefined) role.isDefault = isDefault;
    
    // 更新权限
    if (permissions !== undefined) {
      const validPermissions = await Permission.find({ _id: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: '部分权限不存在'
        });
      }
      role.permissions = permissions;
    }
    
    await role.save();
    
    const updatedRole = await Role.findById(role._id)
      .populate('permissions', 'name code description category');
    
    res.status(200).json({
      success: true,
      message: '角色更新成功',
      data: updatedRole
    });
  } catch (error) {
    console.error('更新角色失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 删除角色
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 不能删除默认角色
    if (role.isDefault) {
      return res.status(403).json({
        success: false,
        message: '不能删除默认角色'
      });
    }
    
    // 检查是否有用户使用此角色
    const userCount = await User.countDocuments({ roles: role._id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `该角色已被 ${userCount} 个用户使用，请先更新用户角色`
      });
    }
    
    await Role.findByIdAndDelete(role._id);
    
    res.status(200).json({
      success: true,
      message: '角色删除成功'
    });
  } catch (error) {
    console.error('删除角色失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 获取所有权限
exports.getAllPermissions = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = category ? { category } : {};
    const permissions = await Permission.find(query).sort({ category: 1, code: 1 });
    
    // 按分类分组
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: permissions,
      grouped: groupedPermissions
    });
  } catch (error) {
    console.error('获取权限列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建权限
exports.createPermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: errors.array()
      });
    }
    
    const { name, code, description, category } = req.body;
    
    // 检查权限代码是否已存在
    const existingPermission = await Permission.findOne({ code: code.toUpperCase() });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: '该权限代码已存在'
      });
    }
    
    const permission = await Permission.create({
      name,
      code: code.toUpperCase(),
      description,
      category: category || 'system'
    });
    
    res.status(201).json({
      success: true,
      message: '权限创建成功',
      data: permission
    });
  } catch (error) {
    console.error('创建权限失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 更新权限
exports.updatePermission = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: '权限不存在'
      });
    }
    
    if (name) permission.name = name;
    if (description !== undefined) permission.description = description;
    if (category) permission.category = category;
    
    await permission.save();
    
    res.status(200).json({
      success: true,
      message: '权限更新成功',
      data: permission
    });
  } catch (error) {
    console.error('更新权限失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 删除权限
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: '权限不存在'
      });
    }
    
    // 检查是否有角色使用此权限
    const rolesWithPermission = await Role.find({ permissions: permission._id });
    if (rolesWithPermission.length > 0) {
      return res.status(400).json({
        success: false,
        message: `该权限已被 ${rolesWithPermission.length} 个角色使用，请先从角色中移除`
      });
    }
    
    await Permission.findByIdAndDelete(permission._id);
    
    res.status(200).json({
      success: true,
      message: '权限删除成功'
    });
  } catch (error) {
    console.error('删除权限失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 初始化默认权限和角色
exports.initDefaultRolesAndPermissions = async (req, res) => {
  try {
    // 定义默认权限
    const defaultPermissions = [
      // 用户管理权限
      { name: '查看用户', code: 'USER_VIEW', description: '查看用户列表和详情', category: 'user' },
      { name: '创建用户', code: 'USER_CREATE', description: '创建新用户', category: 'user' },
      { name: '编辑用户', code: 'USER_EDIT', description: '编辑用户信息', category: 'user' },
      { name: '删除用户', code: 'USER_DELETE', description: '删除用户', category: 'user' },
      { name: '管理用户权限', code: 'USER_PERMISSION', description: '分配用户权限和角色', category: 'user' },
      
      // 工单管理权限
      { name: '查看工单', code: 'CASE_VIEW', description: '查看工单列表和详情', category: 'case' },
      { name: '创建工单', code: 'CASE_CREATE', description: '创建新工单', category: 'case' },
      { name: '编辑工单', code: 'CASE_EDIT', description: '编辑工单信息', category: 'case' },
      { name: '删除工单', code: 'CASE_DELETE', description: '删除工单', category: 'case' },
      { name: '处理工单', code: 'CASE_HANDLE', description: '处理和转派工单', category: 'case' },
      
      // 工具管理权限
      { name: '查看工具', code: 'TOOL_VIEW', description: '查看工具列表和详情', category: 'tool' },
      { name: '创建工具', code: 'TOOL_CREATE', description: '创建新工具', category: 'tool' },
      { name: '编辑工具', code: 'TOOL_EDIT', description: '编辑工具信息', category: 'tool' },
      { name: '删除工具', code: 'TOOL_DELETE', description: '删除工具', category: 'tool' },
      
      // 文档管理权限
      { name: '查看文档', code: 'DOC_VIEW', description: '查看文档', category: 'document' },
      { name: '创建文档', code: 'DOC_CREATE', description: '创建新文档', category: 'document' },
      { name: '编辑文档', code: 'DOC_EDIT', description: '编辑文档', category: 'document' },
      { name: '删除文档', code: 'DOC_DELETE', description: '删除文档', category: 'document' },
      
      // 系统权限
      { name: '系统设置', code: 'SYSTEM_SETTINGS', description: '修改系统设置', category: 'system' },
      { name: '角色管理', code: 'ROLE_MANAGE', description: '管理角色和权限', category: 'system' },
      { name: '系统日志', code: 'SYSTEM_LOG', description: '查看系统日志', category: 'system' },
      
      // 报表权限
      { name: '查看报表', code: 'REPORT_VIEW', description: '查看统计报表', category: 'report' },
      { name: '导出报表', code: 'REPORT_EXPORT', description: '导出报表数据', category: 'report' },
    ];
    
    // 创建或更新权限（避免重复）
    const permissionMap = {};
    for (const perm of defaultPermissions) {
      const existing = await Permission.findOne({ code: perm.code });
      if (existing) {
        permissionMap[perm.code] = existing._id;
      } else {
        const created = await Permission.create(perm);
        permissionMap[perm.code] = created._id;
      }
    }
    
    // 定义默认角色
    const defaultRoles = [
      {
        name: '超级管理员',
        code: 'SUPER_ADMIN',
        description: '系统超级管理员，拥有所有权限',
        level: 100,
        permissions: Object.values(permissionMap),
        isActive: true,
        isDefault: true
      },
      {
        name: '运维人员',
        code: 'TECHNICIAN',
        description: '负责处理工单的技术人员',
        level: 50,
        permissions: [
          permissionMap['CASE_VIEW'],
          permissionMap['CASE_CREATE'],
          permissionMap['CASE_EDIT'],
          permissionMap['CASE_HANDLE'],
          permissionMap['TOOL_VIEW'],
          permissionMap['DOC_VIEW'],
        ],
        isActive: true,
        isDefault: true
      },
      {
        name: '普通用户',
        code: 'USER',
        description: '普通用户，可以提交工单和查看知识库',
        level: 10,
        permissions: [
          permissionMap['CASE_VIEW'],
          permissionMap['CASE_CREATE'],
          permissionMap['TOOL_VIEW'],
          permissionMap['DOC_VIEW'],
        ],
        isActive: true,
        isDefault: true
      }
    ];
    
    // 创建或更新角色（避免重复）
    const createdRoles = [];
    for (const role of defaultRoles) {
      const existing = await Role.findOne({ code: role.code });
      if (existing) {
        await Role.findByIdAndUpdate(existing._id, {
          permissions: role.permissions
        });
        createdRoles.push(existing);
      } else {
        const created = await Role.create(role);
        createdRoles.push(created);
      }
    }
    
    res.status(201).json({
      success: true,
      message: '默认权限和角色初始化成功',
      data: {
        permissions: Object.keys(permissionMap).length,
        roles: createdRoles.length
      }
    });
  } catch (error) {
    console.error('初始化默认数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};
