/**
 * 数据初始化模块
 * 用于初始化系统基础数据
 */

const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const FaultType = require('../models/FaultType');

const defaultPermissions = [
  { name: 'user:read', description: '读取用户信息' },
  { name: 'user:create', description: '创建用户' },
  { name: 'user:update', description: '更新用户信息' },
  { name: 'user:delete', description: '删除用户' },
  { name: 'case:read', description: '读取故障案例' },
  { name: 'case:create', description: '创建故障案例' },
  { name: 'case:update', description: '更新故障案例' },
  { name: 'case:delete', description: '删除故障案例' },
  { name: 'document:read', description: '读取文档' },
  { name: 'document:create', description: '创建文档' },
  { name: 'document:update', description: '更新文档' },
  { name: 'document:delete', description: '删除文档' },
  { name: 'tool:read', description: '读取工具' },
  { name: 'tool:create', description: '创建工具' },
  { name: 'tool:update', description: '更新工具' },
  { name: 'tool:delete', description: '删除工具' },
  { name: 'post:read', description: '读取帖子' },
  { name: 'post:create', description: '创建帖子' },
  { name: 'post:update', description: '更新帖子' },
  { name: 'post:delete', description: '删除帖子' },
  { name: 'comment:read', description: '读取评论' },
  { name: 'comment:create', description: '创建评论' },
  { name: 'comment:update', description: '更新评论' },
  { name: 'comment:delete', description: '删除评论' },
  { name: 'ai:access', description: '访问AI功能' },
  { name: 'admin:access', description: '访问管理后台' },
];

const defaultRoles = [
  {
    name: 'admin',
    description: '系统管理员',
    permissions: ['user:read', 'user:create', 'user:update', 'user:delete',
                  'case:read', 'case:create', 'case:update', 'case:delete',
                  'document:read', 'document:create', 'document:update', 'document:delete',
                  'tool:read', 'tool:create', 'tool:update', 'tool:delete',
                  'post:read', 'post:create', 'post:update', 'post:delete',
                  'comment:read', 'comment:create', 'comment:update', 'comment:delete',
                  'ai:access', 'admin:access']
  },
  {
    name: 'expert',
    description: '专家用户',
    permissions: ['user:read',
                  'case:read', 'case:create', 'case:update',
                  'document:read', 'document:create', 'document:update',
                  'tool:read', 'tool:create', 'tool:update',
                  'post:read', 'post:create', 'post:update',
                  'comment:read', 'comment:create', 'comment:update',
                  'ai:access']
  },
  {
    name: 'member',
    description: '普通会员',
    permissions: ['user:read',
                  'case:read', 'case:create',
                  'document:read',
                  'tool:read',
                  'post:read', 'post:create',
                  'comment:read', 'comment:create']
  },
  {
    name: 'guest',
    description: '游客',
    permissions: ['case:read',
                  'document:read',
                  'tool:read',
                  'post:read',
                  'comment:read']
  }
];

const defaultFaultTypes = [
  { name: '系统崩溃', category: '系统', description: '操作系统突然崩溃或死机' },
  { name: '蓝屏错误', category: '系统', description: 'Windows系统蓝屏错误' },
  { name: '启动失败', category: '系统', description: '电脑无法正常启动' },
  { name: '病毒感染', category: '安全', description: '电脑感染病毒或恶意软件' },
  { name: '网络连接', category: '网络', description: '网络连接问题' },
  { name: '驱动问题', category: '硬件', description: '设备驱动程序问题' },
  { name: '硬件故障', category: '硬件', description: '硬件设备故障' },
  { name: '软件冲突', category: '软件', description: '软件之间冲突' },
  { name: '文件损坏', category: '文件', description: '系统文件或数据文件损坏' },
  { name: '性能问题', category: '性能', description: '电脑运行缓慢或卡顿' },
];

async function seedData() {
  try {
    console.log('[数据初始化] 开始初始化系统数据...');
    
    const permissionCount = await Permission.countDocuments();
    if (permissionCount === 0) {
      console.log('[数据初始化] 初始化权限数据...');
      await Permission.insertMany(defaultPermissions);
      console.log('[数据初始化] ✅ 权限数据初始化完成');
    }
    
    const roleCount = await Role.countDocuments();
    if (roleCount === 0) {
      console.log('[数据初始化] 初始化角色数据...');
      await Role.insertMany(defaultRoles);
      console.log('[数据初始化] ✅ 角色数据初始化完成');
    }
    
    const faultTypeCount = await FaultType.countDocuments();
    if (faultTypeCount === 0) {
      console.log('[数据初始化] 初始化故障类型数据...');
      await FaultType.insertMany(defaultFaultTypes);
      console.log('[数据初始化] ✅ 故障类型数据初始化完成');
    }
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('[数据初始化] 创建默认管理员账户...');
      const adminUser = await User.create({
        name: '系统管理员',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isAdmin: true
      });
      console.log('[数据初始化] ✅ 默认管理员账户创建完成:', adminUser.email);
    }
    
    console.log('[数据初始化] ✅ 所有数据初始化完成');
    
  } catch (error) {
    console.error('[数据初始化] 初始化失败:', error.message);
    console.log('[数据初始化] 继续启动服务器...');
  }
}

module.exports = {
  seedData
};