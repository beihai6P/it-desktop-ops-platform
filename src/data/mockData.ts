import type { Case, CaseComment, DiagnosisHistory, CaseTemplate, CaseCategory, Document } from '@/types';

// 案例数据
export const mockCases: Case[] = [
  {
    id: 'case-001',
    title: 'Windows 11 更新后无法正常关机的解决方案',
    errorCode: '0x80070005',
    deviceType: '台式机',
    brand: 'Dell',
    model: 'OptiPlex 7090',
    systemVersion: 'Windows 11 22H2',
    status: 'resolved',
    views: 1256,
    createdAt: '2026-06-10',
    updatedAt: '2026-06-11',
    author: '张运维',
    authorId: 'user-001',
    symptoms: ['系统无法正常关机', '关机后自动重启', '更新失败'],
    causeAnalysis: '由于系统更新补丁与电源管理驱动不兼容，导致关机时触发重启机制。',
    solution: '通过卸载问题更新补丁或更新电源管理驱动解决。',
    steps: [
      {
        step: 1,
        title: '检查Windows更新历史',
        description: '打开设置 > Windows更新 > 查看更新历史记录',
        commands: ['Get-WindowsUpdateLog'],
        expectedResult: '查看到最近的更新记录'
      },
      {
        step: 2,
        title: '卸载问题更新',
        description: '进入控制面板 > 程序和功能 > 查看已安装的更新',
        commands: ['wusa /uninstall /kb:500XXXX'],
        expectedResult: '成功卸载问题更新'
      },
      {
        step: 3,
        title: '更新电源管理驱动',
        description: '从Dell官网下载最新的电源管理驱动',
        commands: ['pnputil /scan-devices'],
        expectedResult: '驱动更新成功'
      }
    ],
    relatedCases: ['case-002', 'case-003'],
    tags: ['Windows', '更新', '关机', '电源管理'],
    difficulty: 'medium',
    verification: true,
    likes: 89,
    comments: 23,
    isLiked: false,
    isBookmarked: false,
    quality: 'verified',
    visibility: 'public'
  },
  {
    id: 'case-002',
    title: 'Office 365 频繁崩溃的排查与解决',
    errorCode: 'APPCRASH',
    deviceType: '笔记本',
    brand: 'HP',
    model: 'ProBook 450 G9',
    systemVersion: 'Windows 10 21H2',
    status: 'resolved',
    views: 892,
    createdAt: '2026-06-08',
    updatedAt: '2026-06-09',
    author: '李技术',
    authorId: 'user-002',
    symptoms: ['Office崩溃', 'Word卡死', 'Excel无响应'],
    causeAnalysis: 'Office缓存文件损坏且加载项冲突导致应用程序不稳定。',
    solution: '清理Office缓存并禁用冲突的加载项。',
    steps: [
      {
        step: 1,
        title: '清理Office缓存',
        description: '关闭所有Office应用，删除缓存文件夹',
        commands: ['rmdir /s /q %LOCALAPPDATA%\\Microsoft\\Office\\16.0\\Cache'],
        expectedResult: '缓存文件夹已清理'
      },
      {
        step: 2,
        title: '进入安全模式禁用加载项',
        description: '按住Ctrl启动Word，进入文件 > 选项 > 加载项',
        commands: [],
        expectedResult: '成功禁用可疑加载项'
      }
    ],
    relatedCases: ['case-001'],
    tags: ['Office', '崩溃', '缓存', '加载项'],
    difficulty: 'easy',
    verification: true,
    likes: 56,
    comments: 12,
    isLiked: false,
    isBookmarked: false,
    quality: 'verified',
    visibility: 'public'
  },
  {
    id: 'case-003',
    title: '网络连接正常但无法访问特定网站的DNS故障',
    errorCode: 'DNS_PROBE_POSSIBLE',
    deviceType: '台式机',
    brand: 'Lenovo',
    model: 'ThinkCentre M920',
    systemVersion: 'Windows 10 21H2',
    status: 'resolved',
    views: 2103,
    createdAt: '2026-06-05',
    updatedAt: '2026-06-06',
    author: '王网络',
    authorId: 'user-003',
    symptoms: ['网络连接问题', 'DNS故障', '连接超时', '无法打开网页'],
    causeAnalysis: '本地DNS缓存损坏且DNS服务器配置异常。',
    solution: '刷新DNS缓存并重新配置DNS服务器地址。',
    steps: [
      {
        step: 1,
        title: '清除本地DNS缓存',
        description: '打开命令提示符（管理员），执行ipconfig命令',
        commands: ['ipconfig /flushdns', 'ipconfig /release', 'ipconfig /renew'],
        expectedResult: '显示成功刷新DNS缓存'
      },
      {
        step: 2,
        title: '更换DNS服务器',
        description: '网络设置中更改DNS为公共DNS',
        commands: ['netsh interface ip set dns "以太网" static 8.8.8.8'],
        expectedResult: 'DNS服务器已更改'
      },
      {
        step: 3,
        title: '验证DNS解析',
        description: '使用nslookup命令测试域名解析',
        commands: ['nslookup www.google.com'],
        expectedResult: '返回正确的IP地址'
      }
    ],
    relatedCases: [],
    tags: ['网络', 'DNS', '连接', '超时'],
    difficulty: 'easy',
    verification: true,
    likes: 178,
    comments: 45,
    isLiked: false,
    isBookmarked: false,
    quality: 'verified',
    visibility: 'public'
  },
  {
    id: 'case-004',
    title: '打印机脱机无法打印的快速处理方法',
    errorCode: '0x00000709',
    deviceType: '打印机',
    brand: 'HP',
    model: 'LaserJet Pro M404dn',
    systemVersion: 'Windows 10 21H2',
    status: 'resolved',
    views: 1567,
    createdAt: '2026-06-03',
    updatedAt: '2026-06-04',
    author: '赵运维',
    authorId: 'user-004',
    symptoms: ['打印机脱机', '无法打印', '打印队列卡住'],
    causeAnalysis: '打印机服务未启动且驱动程序异常。',
    solution: '重启打印服务并重新安装驱动。',
    steps: [
      {
        step: 1,
        title: '重启打印服务',
        description: '打开服务管理器，找到Print Spooler服务',
        commands: ['net stop spooler', 'net start spooler'],
        expectedResult: '服务重启成功'
      },
      {
        step: 2,
        title: '清除打印队列',
        description: '删除C:\\Windows\\System32\\spool\\PRINTERS目录下的文件',
        commands: ['del /q %SystemRoot%\\System32\\spool\\PRINTERS\\*.*'],
        expectedResult: '打印队列已清空'
      }
    ],
    relatedCases: [],
    tags: ['打印机', '脱机', '打印服务', '驱动'],
    difficulty: 'easy',
    verification: true,
    likes: 134,
    comments: 28,
    isLiked: false,
    isBookmarked: false,
    quality: 'standard',
    visibility: 'public'
  },
  {
    id: 'case-005',
    title: 'VMware虚拟机运行卡顿的性能优化方案',
    errorCode: '-',
    deviceType: '虚拟桌面',
    brand: 'VMware',
    model: 'Workstation 17 Pro',
    systemVersion: 'Windows Server 2019',
    status: 'resolved',
    views: 756,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-02',
    author: '陈虚拟化',
    authorId: 'user-005',
    symptoms: ['虚拟机卡顿', '运行缓慢', 'CPU占用高'],
    causeAnalysis: '虚拟机资源配置不合理，内存和CPU分配不足。',
    solution: '调整虚拟机硬件资源配置。',
    steps: [
      {
        step: 1,
        title: '增加虚拟CPU数量',
        description: '虚拟机设置 > 处理器 > 核心数调整为4',
        commands: [],
        expectedResult: 'CPU核心数增加'
      },
      {
        step: 2,
        title: '扩展内存容量',
        description: '虚拟机设置 > 内存调整为8GB',
        commands: [],
        expectedResult: '内存容量增加'
      },
      {
        step: 3,
        title: '启用硬件加速',
        description: '虚拟机设置 > 显示 > 启用3D加速',
        commands: [],
        expectedResult: '硬件加速已启用'
      }
    ],
    relatedCases: [],
    tags: ['虚拟机', 'VMware', '性能', '卡顿'],
    difficulty: 'medium',
    verification: false,
    likes: 67,
    comments: 15,
    isLiked: false,
    isBookmarked: false,
    quality: 'standard',
    visibility: 'public'
  },
  {
    id: 'case-006',
    title: '域账户登录失败且提示凭据错误的故障排除',
    errorCode: '0x8007052E',
    deviceType: '台式机',
    brand: 'Dell',
    model: 'Precision 3650',
    systemVersion: 'Windows 10 21H2',
    status: 'resolved',
    views: 634,
    createdAt: '2026-05-28',
    updatedAt: '2026-05-29',
    author: '刘域管',
    authorId: 'user-006',
    symptoms: ['认证失败', '无法登录', '凭据错误', '域账户问题'],
    causeAnalysis: '域控制器时间同步异常且用户密码过期。',
    solution: '同步域控制器时间并重置用户密码。',
    steps: [
      {
        step: 1,
        title: '检查时间同步',
        description: '同步本地时间与域控制器时间',
        commands: ['w32tm /resync /force'],
        expectedResult: '时间同步成功'
      },
      {
        step: 2,
        title: '重置域账户密码',
        description: '通过AD用户和计算机重置密码',
        commands: [],
        expectedResult: '密码已重置'
      }
    ],
    relatedCases: [],
    tags: ['域认证', '登录', '凭据', 'AD'],
    difficulty: 'hard',
    verification: false,
    likes: 45,
    comments: 8,
    isLiked: false,
    isBookmarked: false,
    quality: 'basic',
    visibility: 'internal'
  },
  {
    id: 'case-007',
    title: '深信服VPN连接成功后无法访问内网资源',
    errorCode: '-',
    deviceType: '笔记本',
    brand: 'ThinkPad',
    model: 'X1 Carbon',
    systemVersion: 'Windows 11 22H2',
    status: 'in_progress',
    views: 234,
    createdAt: '2026-06-11',
    updatedAt: '2026-06-12',
    author: '周VPN',
    authorId: 'user-007',
    symptoms: ['VPN已连接', '无法访问内网', '路由问题'],
    causeAnalysis: 'VPN路由配置不完整，缺少内网网段路由。',
    solution: '添加正确的路由表配置。',
    steps: [
      {
        step: 1,
        title: '检查当前路由表',
        description: '查看VPN连接后的路由表信息',
        commands: ['route print'],
        expectedResult: '显示当前路由表'
      }
    ],
    relatedCases: [],
    tags: ['VPN', '深信服', '路由', '内网'],
    difficulty: 'medium',
    verification: false,
    likes: 12,
    comments: 5,
    isLiked: false,
    isBookmarked: false,
    quality: 'basic',
    visibility: 'public'
  },
  {
    id: 'case-008',
    title: 'Windows Server 2019 蓝屏故障排查',
    errorCode: 'DRIVER_IRQL_NOT_LESS_OR_EQUAL',
    deviceType: '服务器',
    brand: 'Dell',
    model: 'PowerEdge R750',
    systemVersion: 'Windows Server 2019',
    status: 'resolved',
    views: 445,
    createdAt: '2026-05-25',
    updatedAt: '2026-05-26',
    author: '孙运维',
    authorId: 'user-008',
    symptoms: ['蓝屏错误', '系统崩溃', '重启循环'],
    causeAnalysis: '网卡驱动与服务器平台不兼容导致。',
    solution: '更新服务器专用网卡驱动。',
    steps: [
      {
        step: 1,
        title: '获取蓝屏dump文件',
        description: '查找C:\\Windows\\Minidump目录下的dump文件',
        commands: ['%SystemRoot%\\Minidump\\*.dmp'],
        expectedResult: '找到蓝屏dump文件'
      },
      {
        step: 2,
        title: '分析dump文件',
        description: '使用WinDbg分析蓝屏原因',
        commands: ['!analyze -v'],
        expectedResult: '显示蓝屏原因'
      },
      {
        step: 3,
        title: '更新驱动程序',
        description: '安装服务器专用网卡驱动',
        commands: [],
        expectedResult: '驱动更新完成'
      }
    ],
    relatedCases: [],
    tags: ['蓝屏', '服务器', '驱动', 'Windows Server'],
    difficulty: 'hard',
    verification: true,
    likes: 78,
    comments: 19,
    isLiked: false,
    isBookmarked: false,
    quality: 'verified',
    visibility: 'public'
  }
];

// 评论数据
export const mockComments: CaseComment[] = [
  {
    id: 'comment-001',
    caseId: 'case-001',
    author: 'IT小王',
    authorId: 'user-010',
    content: '这个方法非常有效！按照步骤操作后问题解决了，感谢分享。',
    likes: 12,
    createdAt: '2026-06-11T10:30:00',
    replies: [
      {
        id: 'reply-001',
        commentId: 'comment-001',
        author: '张运维',
        authorId: 'user-001',
        content: '很高兴能帮到你！',
        likes: 3,
        createdAt: '2026-06-11T11:00:00'
      }
    ]
  },
  {
    id: 'comment-002',
    caseId: 'case-001',
    author: '新手运维',
    authorId: 'user-011',
    content: '第三步的命令执行失败，提示权限不足，需要管理员权限。',
    likes: 5,
    createdAt: '2026-06-11T14:20:00',
    replies: []
  },
  {
    id: 'comment-003',
    caseId: 'case-003',
    author: '网络工程师',
    authorId: 'user-012',
    content: 'DNS问题确实很常见，这个排查思路很清晰。推荐使用公共DNS 8.8.8.8和1.1.1.1。',
    likes: 23,
    createdAt: '2026-06-06T09:15:00',
    replies: []
  }
];

// AI诊断历史
export const mockDiagnosisHistory: DiagnosisHistory[] = [
  {
    id: 'history-001',
    symptoms: ['系统无法正常关机', '更新失败'],
    timestamp: '2026-06-12T15:30:00',
    resultCount: 3
  },
  {
    id: 'history-002',
    symptoms: ['网络连接问题', 'DNS故障'],
    timestamp: '2026-06-12T10:00:00',
    resultCount: 5
  },
  {
    id: 'history-003',
    symptoms: ['打印机脱机'],
    timestamp: '2026-06-11T16:45:00',
    resultCount: 2
  }
];

// 案例模板
export const mockCaseTemplates: CaseTemplate[] = [
  {
    id: 'template-001',
    name: 'Windows系统故障模板',
    description: '适用于Windows操作系统常见故障的排查模板',
    category: 'system',
    symptoms: ['系统无法启动', '运行缓慢', '蓝屏错误'],
    steps: [
      { step: 1, title: '收集错误信息', description: '记录错误代码和症状', commands: [], expectedResult: '' },
      { step: 2, title: '检查系统日志', description: '查看事件查看器', commands: ['eventvwr.msc'], expectedResult: '' },
      { step: 3, title: '排查原因', description: '根据日志分析原因', commands: [], expectedResult: '' },
      { step: 4, title: '实施解决', description: '执行解决方案', commands: [], expectedResult: '' }
    ]
  },
  {
    id: 'template-002',
    name: '网络故障排查模板',
    description: '适用于网络连接问题的标准化排查流程',
    category: 'network',
    symptoms: ['无法上网', '网络延迟', '连接不稳定'],
    steps: [
      { step: 1, title: '检查物理连接', description: '检查网线和设备指示灯', commands: [], expectedResult: '' },
      { step: 2, title: '检查IP配置', description: '使用ipconfig命令', commands: ['ipconfig /all'], expectedResult: '' },
      { step: 3, title: '测试网络连通性', description: 'ping网关和DNS', commands: ['ping 192.168.1.1', 'ping 8.8.8.8'], expectedResult: '' }
    ]
  }
];

// 分类配置
export const categoryConfig: Record<CaseCategory, { name: string; icon: string; color: string }> = {
  all: { name: '全部', icon: 'Cpu', color: 'gray' },
  system: { name: '系统故障', icon: 'Monitor', color: 'blue' },
  network: { name: '网络问题', icon: 'Wifi', color: 'green' },
  hardware: { name: '硬件外设', icon: 'HardDrive', color: 'orange' },
  printer: { name: '打印设备', icon: 'Printer', color: 'purple' },
  software: { name: '办公软件', icon: 'FileText', color: 'red' },
  virtual: { name: '虚拟机', icon: 'Cloud', color: 'cyan' },
  domain: { name: '域认证', icon: 'Shield', color: 'indigo' }
};

// 热门标签
export const hotTags: { name: string; count: number }[] = [
  { name: 'Windows', count: 156 },
  { name: 'Office', count: 98 },
  { name: '打印机', count: 87 },
  { name: '网络', count: 76 },
  { name: 'DNS', count: 65 },
  { name: '虚拟桌面', count: 54 },
  { name: '深信服', count: 43 },
  { name: '更新', count: 39 },
  { name: '蓝屏', count: 32 },
  { name: '性能', count: 28 }
];

// 快捷症状标签
export const quickSymptomTags: { text: string; category: CaseCategory }[] = [
  { text: '系统无法正常关机', category: 'system' },
  { text: 'Office崩溃', category: 'software' },
  { text: '网络连接问题', category: 'network' },
  { text: 'DNS故障', category: 'network' },
  { text: '打印机脱机', category: 'printer' },
  { text: '虚拟机卡顿', category: 'virtual' },
  { text: '蓝屏错误', category: 'system' },
  { text: '更新失败', category: 'system' },
  { text: '认证失败', category: 'domain' },
  { text: '连接超时', category: 'network' },
  { text: '无法打印', category: 'printer' },
  { text: '应用无响应', category: 'software' }
];

// 文档数据
export const mockDocuments: Document[] = [
  {
    id: 'doc-001',
    title: 'Windows Server 运维手册',
    category: '运维文档',
    type: 'manual',
    content: '这是一份Windows Server运维手册的内容...',
    status: 'published',
    views: 567,
    downloads: 123,
    favorites: 45,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    author: '张工',
    authorId: '1',
    tags: ['Windows', 'Server', '运维'],
    description: 'Windows Server运维指南',
    version: '1.0'
  },
  {
    id: 'doc-002',
    title: '网络设备配置指南',
    category: '网络文档',
    type: 'guide',
    content: '这是一份网络设备配置指南的内容...',
    status: 'published',
    views: 345,
    downloads: 89,
    favorites: 23,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20',
    author: '王工',
    authorId: '3',
    tags: ['网络', '配置', '设备'],
    description: '网络设备配置指南',
    version: '1.0'
  }
];
