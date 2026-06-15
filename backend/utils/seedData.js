const bcrypt = require('bcryptjs');

const adminPassword = 'beihaibei8..'; // 管理员默认密码

async function seedData() {
  console.log('Seeding initial data...');
  
  try {
    const User = require('../models/User');
    const Role = require('../models/Role');
    const Permission = require('../models/Permission');
    
    // 检查是否已有指定的管理员用户
    const existingAdmin = await User.findOne({ email: '877628367@qq.com' });
    const oldAdmin = await User.findOne({ email: 'admin@example.com' });
    
    // 如果存在旧账号，删除它
    if (oldAdmin) {
      console.log('Removing old admin account...');
      await User.deleteOne({ email: 'admin@example.com' });
    }
    
    if (!existingAdmin) {
      console.log('Creating admin user...');
      
      // 创建默认权限
      const defaultPermissions = [
        { name: '查看用户', code: 'USER_VIEW', description: '查看用户列表和详情', category: 'user' },
        { name: '创建用户', code: 'USER_CREATE', description: '创建新用户', category: 'user' },
        { name: '编辑用户', code: 'USER_EDIT', description: '编辑用户信息', category: 'user' },
        { name: '删除用户', code: 'USER_DELETE', description: '删除用户', category: 'user' },
        { name: '管理用户权限', code: 'USER_PERMISSION', description: '分配用户权限和角色', category: 'user' },
        { name: '查看工单', code: 'CASE_VIEW', description: '查看工单列表和详情', category: 'case' },
        { name: '创建工单', code: 'CASE_CREATE', description: '创建新工单', category: 'case' },
        { name: '编辑工单', code: 'CASE_EDIT', description: '编辑工单信息', category: 'case' },
        { name: '删除工单', code: 'CASE_DELETE', description: '删除工单', category: 'case' },
        { name: '处理工单', code: 'CASE_HANDLE', description: '处理和转派工单', category: 'case' },
        { name: '系统设置', code: 'SYSTEM_SETTINGS', description: '修改系统设置', category: 'system' },
        { name: '角色管理', code: 'ROLE_MANAGE', description: '管理角色和权限', category: 'system' },
      ];
      
      const createdPermissions = await Permission.insertMany(defaultPermissions);
      const permissionIds = createdPermissions.map(p => p._id);
      
      // 创建默认角色
      await Role.create({
        name: '超级管理员',
        code: 'SUPER_ADMIN',
        description: '系统超级管理员，拥有所有权限',
        level: 100,
        permissions: permissionIds,
        isActive: true,
        isDefault: true
      });
      
      await Role.create({
        name: '运维人员',
        code: 'TECHNICIAN',
        description: '负责处理工单的技术人员',
        level: 50,
        permissions: permissionIds.slice(5, 10),
        isActive: true,
        isDefault: true
      });
      
      await Role.create({
        name: '普通用户',
        code: 'USER',
        description: '普通用户，可以提交工单和查看知识库',
        level: 10,
        permissions: [permissionIds[4], permissionIds[5]],
        isActive: true,
        isDefault: true
      });
      
      // 创建管理员用户
      await User.create({
        name: '厉书书',
        email: '877628367@qq.com',
        password: adminPassword,
        role: 'admin',
        isAdmin: true,
        status: 'active'
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists, skipping seed');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
  
  console.log('Initial data check completed');
}

module.exports = { seedData };