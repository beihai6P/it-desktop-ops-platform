const memoryStore = require('./memoryStore');
const bcrypt = require('bcryptjs');

const adminPassword = 'beihaibei8..';

const seedUsers = [
  {
    _id: 'mem_user_1',
    name: '管理员',
    email: '877628367@qq.com',
    password: bcrypt.hashSync(adminPassword, 10),
    role: 'admin',
    isAdmin: true,
    status: 'online',
    posts: 15,
    likes: 520,
    followers: 120,
    createdAt: new Date('2024-01-01'),
    loginAttempts: 0,
  },
  {
    _id: 'mem_user_2',
    name: '张工',
    email: 'zhang@example.com',
    password: '$2a$10$rT4wG7V8yK0tL3pQ5sR7uI',
    role: 'member',
    status: 'online',
    posts: 128,
    likes: 2340,
    followers: 567,
    createdAt: new Date('2024-01-05'),
    loginAttempts: 0,
  },
  {
    _id: 'mem_user_3',
    name: '李工',
    email: 'li@example.com',
    password: '$2a$10$rT4wG7V8yK0tL3pQ5sR7uI',
    role: 'member',
    status: 'online',
    posts: 96,
    likes: 1890,
    followers: 423,
    createdAt: new Date('2024-01-10'),
    loginAttempts: 0,
  },
  {
    _id: 'mem_user_4',
    name: '王工',
    email: 'wang@example.com',
    password: '$2a$10$rT4wG7V8yK0tL3pQ5sR7uI',
    role: 'member',
    status: 'away',
    posts: 78,
    likes: 1560,
    followers: 389,
    createdAt: new Date('2024-01-15'),
    loginAttempts: 0,
  },
  {
    _id: 'mem_user_5',
    name: '赵工',
    email: 'zhao@example.com',
    password: '$2a$10$rT4wG7V8yK0tL3pQ5sR7uI',
    role: 'member',
    status: 'offline',
    posts: 65,
    likes: 1230,
    followers: 256,
    createdAt: new Date('2024-01-20'),
    loginAttempts: 0,
  },
];

const seedPosts = [
  {
    id: 'POST-1',
    title: 'Windows 11 更新后关机失败解决方案',
    content: '最近遇到Windows 11更新后无法正常关机的问题，提示错误代码0x80070005。经过排查发现是权限问题导致的。\n\n**问题分析：**\n1. 更新后系统权限发生变化\n2. 某些系统文件被锁定\n3. 用户账户控制设置问题\n\n**解决方案：**\n1. 以管理员身份运行命令提示符\n2. 执行 `sfc /scannow` 修复系统文件\n3. 检查并修复用户权限\n4. 禁用快速启动功能\n\n经过以上步骤，问题得到了解决。希望对遇到同样问题的同事有所帮助！',
    author: '张工',
    authorId: 'mem_user_2',
    tags: ['Windows', '更新', '故障'],
    likes: 128,
    comments: 23,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'hot',
    category: '经验分享',
    views: 1256,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'POST-2',
    title: '分享一个实用的PowerShell自动化脚本',
    content: '写了一个批量安装软件的PowerShell脚本，支持静默安装，自动检测安装状态，分享给大家。\n\n**功能特点：**\n- 支持多种软件批量安装\n- 自动检测安装状态\n- 静默安装，无需人工干预\n- 详细的安装日志记录\n\n**使用方法：**\n```powershell\n.\Install-Software.ps1 -List software_list.txt\n```\n\n脚本已上传到工具分享板块，欢迎下载使用并反馈问题！',
    author: '李工',
    authorId: 'mem_user_3',
    tags: ['PowerShell', '自动化', '脚本'],
    likes: 89,
    comments: 15,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'hot',
    category: '工具推荐',
    views: 892,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'POST-3',
    title: '打印机故障排查经验分享',
    content: '总结了一下打印机常见故障的排查步骤，包括卡纸、连接失败、打印质量等问题。\n\n**常见故障及解决：**\n\n1. **卡纸问题**\n   - 检查进纸器\n   - 清理纸屑\n   - 检查纸型设置\n\n2. **连接失败**\n   - 检查网络连接\n   - 验证打印机IP\n   - 重启打印服务\n\n3. **打印质量**\n   - 检查墨盒/硒鼓\n   - 校准打印头\n   - 清洁打印机内部',
    author: '王工',
    authorId: 'mem_user_4',
    tags: ['打印机', '故障排查', '经验'],
    likes: 67,
    comments: 8,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'new',
    category: '技术讨论',
    views: 567,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'POST-4',
    title: 'Office 365激活问题处理流程',
    content: '整理了Office 365激活失败的各种情况及对应的解决方法，包括许可证问题、DNS解析问题等。\n\n**激活失败常见原因：**\n\n1. **许可证问题**\n   - 检查账户许可证分配\n   - 确认订阅状态\n   - 验证产品密钥\n\n2. **网络问题**\n   - 检查DNS解析\n   - 验证网络连接\n   - 尝试更换网络环境\n\n3. **系统问题**\n   - 修复Office安装\n   - 清理激活缓存\n   - 使用微软支持工具',
    author: '赵工',
    authorId: 'mem_user_5',
    tags: ['Office', '激活', '许可证'],
    likes: 156,
    comments: 31,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'hot',
    category: '故障求助',
    views: 1890,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'POST-5',
    title: '远程协助最佳实践分享',
    content: '总结了一些远程协助的最佳实践，提高支持效率和用户体验。\n\n**准备工作：**\n1. 确认用户网络环境\n2. 获取必要的权限\n3. 准备工具清单\n\n**操作规范：**\n1. 提前告知用户操作步骤\n2. 全程保持沟通\n3. 操作完成后确认结果\n\n**安全注意：**\n1. 仅访问必要的资源\n2. 操作完成后退出登录\n3. 记录操作日志',
    author: '张工',
    authorId: 'mem_user_2',
    tags: ['远程协助', '安全', '规范'],
    likes: 45,
    comments: 12,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'normal',
    category: '技术讨论',
    views: 432,
    isLiked: false,
    isBookmarked: false,
  },
];

const seedComments = [
  {
    id: 'COMMENT-1',
    postId: 'POST-1',
    author: '李工',
    authorId: 'mem_user_3',
    content: '感谢分享！我也遇到过类似问题，你的方法很有效。',
    likes: 12,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    replies: [
      {
        id: 'REPLY-1',
        commentId: 'COMMENT-1',
        author: '张工',
        authorId: 'mem_user_2',
        content: '不客气，能帮到你就好！',
        likes: 5,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  },
  {
    id: 'COMMENT-2',
    postId: 'POST-1',
    author: '王工',
    authorId: 'mem_user_4',
    content: '补充一点：还可以尝试使用 DISM 命令修复映像。',
    likes: 8,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    replies: [],
  },
  {
    id: 'COMMENT-3',
    postId: 'POST-2',
    author: '赵工',
    authorId: 'mem_user_5',
    content: '脚本很棒！能不能增加静默参数配置？',
    likes: 6,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    replies: [
      {
        id: 'REPLY-2',
        commentId: 'COMMENT-3',
        author: '李工',
        authorId: 'mem_user_3',
        content: '好建议！下次更新会考虑加入。',
        likes: 4,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: 'COMMENT-4',
    postId: 'POST-2',
    author: '陈工',
    authorId: 'mem_user_1',
    content: '已下载使用，非常实用！',
    likes: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    replies: [],
  },
  {
    id: 'COMMENT-5',
    postId: 'POST-3',
    author: '张工',
    authorId: 'mem_user_2',
    content: '收藏了，下次遇到打印机问题可以参考。',
    likes: 5,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    replies: [],
  },
];

const seedFaultTypes = [
  {
    id: 'FAULT-1',
    name: 'DNS解析故障',
    category: '网络',
    description: '模拟DNS解析失败场景',
    difficulty: 'easy',
  },
  {
    id: 'FAULT-2',
    name: 'MySQL连接中断',
    category: '数据库',
    description: '模拟数据库连接异常',
    difficulty: 'medium',
  },
  {
    id: 'FAULT-3',
    name: 'Redis延迟',
    category: '缓存',
    description: '模拟Redis响应延迟',
    difficulty: 'medium',
  },
  {
    id: 'FAULT-4',
    name: 'CPU高负载',
    category: '系统',
    description: '模拟CPU使用率飙升',
    difficulty: 'hard',
  },
  {
    id: 'FAULT-5',
    name: '磁盘IO阻塞',
    category: '存储',
    description: '模拟磁盘IO性能下降',
    difficulty: 'hard',
  },
];

const seedExperiments = [
  {
    id: 'EXP-1',
    name: 'DNS故障排查演练',
    faultType: 'DNS解析故障',
    faultTypeId: 'FAULT-1',
    status: 'completed',
    progress: 100,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'EXP-2',
    name: '数据库故障恢复',
    faultType: 'MySQL连接中断',
    faultTypeId: 'FAULT-2',
    status: 'running',
    progress: 45,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'EXP-3',
    name: 'Redis性能测试',
    faultType: 'Redis延迟',
    faultTypeId: 'FAULT-3',
    status: 'idle',
    progress: 0,
    createdAt: new Date(),
  },
];

const seedTemplates = [
  {
    id: 'TEMP-1',
    title: '员工入职设备配置SOP',
    category: '入职流程',
    type: 'SOP',
    author: '张工',
    authorId: 'mem_user_2',
    downloads: 2341,
    rating: 4.9,
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    tags: ['入职', '设备配置', '标准化'],
    status: 'verified',
  },
  {
    id: 'TEMP-2',
    title: 'Windows系统重装指南',
    category: '系统维护',
    type: '指南',
    author: '李工',
    authorId: 'mem_user_3',
    downloads: 1892,
    rating: 4.8,
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    tags: ['系统重装', 'Ghost', 'PE'],
    status: 'verified',
  },
];

const seedCases = [
  {
    id: 'CASE-1',
    title: 'Windows 11 更新后关机失败，提示错误代码 0x80070005',
    errorCode: '0x80070005',
    deviceType: '台式机',
    brand: 'Dell',
    model: 'OptiPlex 7090',
    status: 'resolved',
    views: 1256,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    symptoms: ['系统无法正常关机', '更新后出现问题', '蓝屏错误'],
    author: '张工',
    authorId: 'mem_user_2',
  },
  {
    id: 'CASE-2',
    title: 'Office 365 无响应，DNS解析超时',
    errorCode: '-',
    deviceType: '笔记本',
    brand: 'HP',
    model: 'EliteBook 840 G8',
    status: 'resolved',
    views: 892,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    symptoms: ['Office崩溃', '网络连接问题', 'DNS故障'],
    author: '李工',
    authorId: 'mem_user_3',
  },
];

const seedTickets = [
  {
    id: 'TKT-001',
    title: '打印机卡纸故障',
    priority: 'high',
    status: 'open',
    assignee: '张工',
    assigneeId: 'mem_user_2',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'TKT-002',
    title: 'Office激活失败',
    priority: 'medium',
    status: 'in_progress',
    assignee: '李工',
    assigneeId: 'mem_user_3',
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: 'TKT-003',
    title: '网络连接问题',
    priority: 'high',
    status: 'open',
    assignee: '王工',
    assigneeId: 'mem_user_4',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 'TKT-004',
    title: '系统更新失败',
    priority: 'low',
    status: 'open',
    assignee: '赵工',
    assigneeId: 'mem_user_5',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

const seedDocuments = [
  {
    id: 'DOC-1',
    title: 'Windows 11 故障排查指南',
    category: '操作系统',
    type: '指南',
    views: 3456,
    downloads: 1234,
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    tags: ['Windows', '故障排查', '指南'],
    author: '张工',
    authorId: 'mem_user_2',
  },
  {
    id: 'DOC-2',
    title: 'PowerShell 自动化脚本合集',
    category: '脚本工具',
    type: '脚本',
    views: 2345,
    downloads: 892,
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    tags: ['PowerShell', '自动化', '脚本'],
    author: '李工',
    authorId: 'mem_user_3',
  },
];

const seedTools = [
  {
    id: 'TOOL-1',
    name: '批量软件安装脚本',
    description: '一键批量安装常用软件，支持静默安装，自动检测安装状态',
    category: '脚本工具',
    tags: ['PowerShell', '自动化', '批量安装'],
    downloads: 1234,
    views: 3456,
    stars: 48,
    author: '张工',
    authorId: 'mem_user_2',
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    type: 'script',
    isFeatured: true,
    isVerified: true,
  },
  {
    id: 'TOOL-2',
    name: '系统信息收集工具',
    description: '一键收集系统硬件、软件、网络等信息，生成详细报告',
    category: '系统工具',
    tags: ['系统信息', '诊断', '报告'],
    downloads: 892,
    views: 2345,
    stars: 36,
    author: '李工',
    authorId: 'mem_user_3',
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    type: 'tool',
    isFeatured: false,
    isVerified: true,
  },
];

const seedSessions = [
  {
    id: 'SESS-001',
    title: '设备远程协助',
    participants: 2,
    status: 'active',
    startTime: '10:30',
    type: 'screen',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'SESS-002',
    title: '团队排障会议',
    participants: 5,
    status: 'active',
    startTime: '10:15',
    type: 'video',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: 'SESS-003',
    title: '用户问题支持',
    participants: 2,
    status: 'pending',
    startTime: '11:00',
    type: 'chat',
    createdAt: new Date(),
  },
];

function seedData() {
  console.log('Seeding initial data...');
  
  memoryStore.clearAll();

  seedUsers.forEach((user) => {
    const userWithMethods = {
      ...user,
      matchPassword: async function(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
      },
      save: async function() {
        return this;
      }
    };
    memoryStore.insertOne('users', userWithMethods);
  });

  seedPosts.forEach((post) => {
    memoryStore.insertOne('posts', post);
  });

  seedComments.forEach((comment) => {
    memoryStore.insertOne('comments', comment);
  });

  seedFaultTypes.forEach((faultType) => {
    memoryStore.insertOne('faulttypes', faultType);
  });

  seedExperiments.forEach((experiment) => {
    memoryStore.insertOne('experiments', experiment);
  });

  seedTemplates.forEach((template) => {
    memoryStore.insertOne('templates', template);
  });

  seedCases.forEach((caseItem) => {
    memoryStore.insertOne('cases', caseItem);
  });

  seedTickets.forEach((ticket) => {
    memoryStore.insertOne('tickets', ticket);
  });

  seedDocuments.forEach((doc) => {
    memoryStore.insertOne('documents', doc);
  });

  seedTools.forEach((tool) => {
    memoryStore.insertOne('tools', tool);
  });

  seedSessions.forEach((session) => {
    memoryStore.insertOne('sessions', session);
  });

  console.log('Initial data seeded successfully');
}

module.exports = { seedData };
