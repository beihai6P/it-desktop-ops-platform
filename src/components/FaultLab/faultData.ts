export interface FaultStep {
  id: string;
  title: string;
  description: string;
  expectedResult: string;
  actualResult: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface FaultAnalysis {
  rootCause: string;
  symptoms: string[];
  impact: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
  estimatedTime: string;
  relatedLogs: string[];
}

export interface FaultType {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scenario: string;
  steps: FaultStep[];
  expectedAnalysis: FaultAnalysis;
}

export const faultTypes: FaultType[] = [
  {
    id: 'dns-failure',
    name: 'DNS解析故障',
    category: '网络',
    description: '模拟DNS服务器故障导致域名解析失败的场景',
    difficulty: 'easy',
    scenario: '用户尝试访问公司内部系统时，浏览器显示"无法解析域名"错误。DNS服务器由于配置错误停止响应请求。',
    steps: [
      { id: 'step-1', title: '尝试访问内部系统', description: '用户在浏览器中输入内部系统域名 http://internal.corp.com', expectedResult: '页面正常加载', actualResult: '显示"无法解析域名"错误', status: 'pending' },
      { id: 'step-2', title: '检查DNS设置', description: '运行 nslookup internal.corp.com 检查DNS解析', expectedResult: '返回正确的IP地址', actualResult: '显示"DNS request timed out"', status: 'pending' },
      { id: 'step-3', title: '验证DNS服务器状态', description: '检查DNS服务器进程是否正常运行', expectedResult: 'DNS服务正常运行', actualResult: 'DNS服务未启动', status: 'pending' },
      { id: 'step-4', title: '检查配置文件', description: '查看/etc/resolv.conf 和 DNS服务器配置', expectedResult: '配置正确无误', actualResult: '配置文件存在语法错误', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: 'DNS服务器配置文件存在语法错误，导致DNS服务无法启动',
      symptoms: ['无法解析内部域名', 'nslookup请求超时', 'DNS服务进程未运行'],
      impact: '影响所有依赖DNS解析的内部服务访问',
      severity: 'high',
      recommendedActions: ['修复/etc/named.conf配置文件中的语法错误', '重启DNS服务：systemctl restart named', '验证DNS解析：nslookup internal.corp.com', '检查DNS日志确认问题已解决'],
      estimatedTime: '15-30分钟',
      relatedLogs: ['Jun 12 10:30:00 dns-server named[1234]: /etc/named.conf:23: syntax error', 'Jun 12 10:30:01 dns-server systemd: named.service: Main process exited', 'Jun 12 10:35:00 dns-server named[5678]: starting BIND 9.16.1'],
    },
  },
  {
    id: 'mysql-connection',
    name: 'MySQL连接中断',
    category: '数据库',
    description: '模拟MySQL数据库连接异常导致应用无法访问数据',
    difficulty: 'medium',
    scenario: '应用服务器无法连接到MySQL数据库，导致用户登录失败。数据库连接池耗尽，新连接无法建立。',
    steps: [
      { id: 'step-1', title: '尝试登录应用', description: '用户在登录页面输入用户名和密码', expectedResult: '成功登录系统', actualResult: '显示"数据库连接失败"错误', status: 'pending' },
      { id: 'step-2', title: '检查应用日志', description: '查看应用服务器日志中的数据库连接错误', expectedResult: '无连接错误', actualResult: '大量"Connection refused"错误', status: 'pending' },
      { id: 'step-3', title: '检查MySQL状态', description: '在数据库服务器上检查MySQL服务状态', expectedResult: 'MySQL服务正常运行', actualResult: 'MySQL服务运行正常', status: 'pending' },
      { id: 'step-4', title: '检查连接池状态', description: '查看数据库连接池使用情况', expectedResult: '连接池使用率正常', actualResult: '连接池已满，所有连接处于等待状态', status: 'pending' },
      { id: 'step-5', title: '检查慢查询日志', description: '分析MySQL慢查询日志', expectedResult: '无长时间运行的查询', actualResult: '存在多个长时间运行的查询阻塞连接', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: '存在慢查询导致数据库连接池耗尽，新连接无法建立',
      symptoms: ['应用无法连接数据库', '连接池已满', '存在长时间运行的SQL查询'],
      impact: '应用服务完全不可用，用户无法登录和操作',
      severity: 'critical',
      recommendedActions: ['终止长时间运行的慢查询：KILL QUERY <query_id>', '优化慢查询SQL语句', '增加连接池最大连接数配置', '考虑添加数据库索引优化查询性能', '设置合理的查询超时时间'],
      estimatedTime: '30-60分钟',
      relatedLogs: ['2024-06-12 10:45:00 [WARN] Connection pool is full: max=20, active=20', '2024-06-12 10:45:15 [ERROR] Failed to acquire database connection', '2024-06-12 10:46:00 [SLOW] Query took 120.5 seconds: SELECT * FROM large_table'],
    },
  },
  {
    id: 'redis-latency',
    name: 'Redis延迟',
    category: '缓存',
    description: '模拟Redis缓存响应延迟导致应用性能下降',
    difficulty: 'medium',
    scenario: 'Redis缓存服务器响应时间超过500ms，导致应用接口响应缓慢。经检查发现内存使用过高导致频繁swap。',
    steps: [
      { id: 'step-1', title: '监控应用响应时间', description: '观察API接口响应时间监控面板', expectedResult: '响应时间<100ms', actualResult: '响应时间>500ms', status: 'pending' },
      { id: 'step-2', title: '检查Redis响应', description: '使用redis-cli ping命令测试响应时间', expectedResult: '响应时间<50ms', actualResult: '响应时间>500ms', status: 'pending' },
      { id: 'step-3', title: '检查Redis内存使用', description: '执行INFO memory查看内存使用情况', expectedResult: '内存使用率<80%', actualResult: '内存使用率95%，存在大量swap', status: 'pending' },
      { id: 'step-4', title: '分析缓存键分布', description: '使用redis-cli --bigkeys查找大键', expectedResult: '无异常大键', actualResult: '发现多个GB级别的未过期缓存键', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: 'Redis内存使用率过高(95%)，导致系统频繁swap，响应延迟显著增加',
      symptoms: ['Redis响应时间>500ms', '内存使用率95%', '大量swap操作'],
      impact: '应用接口响应缓慢，用户体验下降',
      severity: 'medium',
      recommendedActions: ['清理过期或不再使用的缓存键', '调整Redis内存策略：maxmemory-policy allkeys-lru', '增加Redis服务器内存配置', '优化缓存过期策略', '考虑分片部署减轻单节点压力'],
      estimatedTime: '20-40分钟',
      relatedLogs: ['Jun 12 11:00:00 redis-server [WARNING] Memory usage approaching limit: 95%', 'Jun 12 11:05:00 redis-server [NOTICE] Background saving started by pid 12345', 'Jun 12 11:10:00 redis-server [WARNING] Slowlog: 500ms threshold exceeded'],
    },
  },
  {
    id: 'cpu-high',
    name: 'CPU高负载',
    category: '系统',
    description: '模拟CPU使用率飙升导致系统响应缓慢',
    difficulty: 'hard',
    scenario: '服务器CPU使用率突然飙升至100%，导致所有服务响应缓慢。经排查发现是一个失控的后台进程导致。',
    steps: [
      { id: 'step-1', title: '监控CPU使用率', description: '查看系统监控面板的CPU使用率图表', expectedResult: 'CPU使用率<70%', actualResult: 'CPU使用率持续100%', status: 'pending' },
      { id: 'step-2', title: '定位高CPU进程', description: '使用top或htop命令查看进程CPU占用', expectedResult: '无异常高CPU进程', actualResult: '发现进程worker.py占用98%CPU', status: 'pending' },
      { id: 'step-3', title: '分析进程行为', description: '使用strace或lsof分析进程活动', expectedResult: '进程行为正常', actualResult: '进程在进行大量循环计算，无睡眠等待', status: 'pending' },
      { id: 'step-4', title: '检查代码逻辑', description: '查看worker.py源代码，查找无限循环或效率问题', expectedResult: '代码逻辑正常', actualResult: '发现条件判断错误导致无限循环', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: 'worker.py脚本存在逻辑错误，导致无限循环占用100%CPU',
      symptoms: ['CPU使用率持续100%', 'worker.py进程占用绝大部分CPU', '系统响应缓慢'],
      impact: '所有系统服务响应缓慢，可能导致服务中断',
      severity: 'critical',
      recommendedActions: ['紧急终止问题进程：kill -9 <pid>', '修复代码中的逻辑错误', '部署修复后的代码', '添加进程监控告警规则', '考虑添加进程资源限制(cgroups)'],
      estimatedTime: '15-30分钟',
      relatedLogs: ['Jun 12 09:30:00 server kernel: [12345.678901] worker.py invoked oom-killer:', 'Jun 12 09:31:00 server systemd: worker.service: CPU time limit exceeded', 'Jun 12 09:32:00 server worker.py: Starting task processing loop...'],
    },
  },
  {
    id: 'disk-io',
    name: '磁盘IO阻塞',
    category: '存储',
    description: '模拟磁盘IO性能下降导致系统响应缓慢',
    difficulty: 'hard',
    scenario: '服务器磁盘IO突然变得非常缓慢，导致所有读写操作延迟严重。检查发现是RAID阵列中一块硬盘故障。',
    steps: [
      { id: 'step-1', title: '监控磁盘IO', description: '查看iostat或iotop的磁盘IO指标', expectedResult: 'IO等待时间<10%', actualResult: 'IO等待时间>90%', status: 'pending' },
      { id: 'step-2', title: '检查磁盘健康状态', description: '使用smartctl检查磁盘健康状态', expectedResult: '所有磁盘健康', actualResult: '/dev/sdb存在大量坏扇区', status: 'pending' },
      { id: 'step-3', title: '检查RAID状态', description: '查看RAID阵列状态', expectedResult: 'RAID阵列正常', actualResult: 'RAID降级模式，正在重建', status: 'pending' },
      { id: 'step-4', title: '更换故障硬盘', description: '更换故障硬盘并重建RAID阵列', expectedResult: 'RAID阵列恢复正常', actualResult: '新硬盘已安装，RAID正在重建', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: 'RAID阵列中一块硬盘(/dev/sdb)故障，导致RAID降级运行，IO性能严重下降',
      symptoms: ['磁盘IO等待>90%', 'smartctl检测到坏扇区', 'RAID阵列处于降级模式'],
      impact: '所有磁盘IO操作变慢，数据库查询、文件读写等操作延迟严重',
      severity: 'high',
      recommendedActions: ['更换故障硬盘/dev/sdb', '监控RAID重建进度', '重建完成后验证数据完整性', '检查其他硬盘健康状态', '考虑配置硬盘故障告警'],
      estimatedTime: '60-120分钟(含RAID重建时间)',
      relatedLogs: ['Jun 12 08:00:00 server kernel: sd 1:0:1:0: [sdb] Unhandled sense code', 'Jun 12 08:01:00 server mdadm: DegradedArray event on /dev/md0', 'Jun 12 08:02:00 server smartd: Device: /dev/sdb, 500 Bad Sectors'],
    },
  },
  {
    id: 'network-latency',
    name: '网络延迟',
    category: '网络',
    description: '模拟网络延迟过高导致服务响应缓慢',
    difficulty: 'medium',
    scenario: '用户反馈访问应用响应缓慢，经检查发现网络延迟超过200ms。进一步排查发现是路由器配置错误导致数据包路由异常。',
    steps: [
      { id: 'step-1', title: '测试网络延迟', description: '使用ping命令测试网络延迟', expectedResult: '延迟<50ms', actualResult: '延迟>200ms', status: 'pending' },
      { id: 'step-2', title: '检查路由表', description: '使用route或ip route查看路由配置', expectedResult: '路由配置正确', actualResult: '发现错误路由指向无效网关', status: 'pending' },
      { id: 'step-3', title: '检查路由器配置', description: '登录路由器检查路由配置', expectedResult: '配置正确', actualResult: '静态路由配置错误', status: 'pending' },
      { id: 'step-4', title: '修复路由配置', description: '删除错误路由并添加正确路由', expectedResult: '路由配置正确', actualResult: '路由已修复，延迟恢复正常', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: '路由器静态路由配置错误，导致数据包走了错误的路径',
      symptoms: ['网络延迟>200ms', '路由表存在无效路由', '数据包丢失率增加'],
      impact: '所有网络访问响应缓慢，影响用户体验',
      severity: 'medium',
      recommendedActions: ['删除错误的静态路由', '添加正确的路由配置', '验证路由配置：route -n', '测试网络延迟确认恢复'],
      estimatedTime: '15-30分钟',
      relatedLogs: ['Jun 12 14:00:00 router: Invalid route to 192.168.1.0/24', 'Jun 12 14:05:00 server: ping: latency average: 250ms', 'Jun 12 14:10:00 router: Route updated: 192.168.1.0/24 via 10.0.0.1'],
    },
  },
  {
    id: 'memory-leak',
    name: '内存泄漏',
    category: '系统',
    description: '模拟应用内存泄漏导致系统内存耗尽',
    difficulty: 'hard',
    scenario: '应用服务器内存使用率持续上升，最终导致OOM Killer杀死进程。分析发现是应用代码存在内存泄漏问题。',
    steps: [
      { id: 'step-1', title: '监控内存使用', description: '查看系统内存使用趋势', expectedResult: '内存使用率稳定', actualResult: '内存使用率持续上升', status: 'pending' },
      { id: 'step-2', title: '分析内存占用', description: '使用free和top查看内存使用详情', expectedResult: '内存使用正常', actualResult: '应用进程占用内存持续增长', status: 'pending' },
      { id: 'step-3', title: '使用内存分析工具', description: '使用valgrind或heapdump分析内存泄漏', expectedResult: '无内存泄漏', actualResult: '发现内存泄漏点', status: 'pending' },
      { id: 'step-4', title: '修复代码', description: '修复导致内存泄漏的代码', expectedResult: '内存泄漏已修复', actualResult: '内存使用恢复正常', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: '应用代码存在内存泄漏，导致内存持续增长',
      symptoms: ['内存使用率持续上升', '应用进程占用内存不断增加', 'OOM Killer触发'],
      impact: '应用进程被OOM Killer杀死，服务中断',
      severity: 'critical',
      recommendedActions: ['使用内存分析工具定位泄漏点', '修复导致内存泄漏的代码', '添加内存监控告警', '考虑设置进程内存限制'],
      estimatedTime: '60-120分钟',
      relatedLogs: ['Jun 12 15:00:00 server kernel: [23456.789012] Out of memory: Kill process 1234 (node) score 951 or sacrifice child', 'Jun 12 15:01:00 server systemd: myapp.service: Main process exited, code=killed', 'Jun 12 15:02:00 server node: Memory usage: 98%'],
    },
  },
  {
    id: 'ssl-expired',
    name: 'SSL证书过期',
    category: '安全',
    description: '模拟SSL证书过期导致HTTPS连接失败',
    difficulty: 'easy',
    scenario: '用户访问HTTPS网站时浏览器显示安全警告，无法建立安全连接。检查发现SSL证书已过期。',
    steps: [
      { id: 'step-1', title: '检查浏览器提示', description: '查看浏览器显示的安全警告', expectedResult: '无安全警告', actualResult: '显示"证书已过期"警告', status: 'pending' },
      { id: 'step-2', title: '检查证书状态', description: '使用openssl检查证书有效期', expectedResult: '证书有效期正常', actualResult: '证书已过期30天', status: 'pending' },
      { id: 'step-3', title: '获取新证书', description: '从证书颁发机构获取新证书', expectedResult: '获取新证书', actualResult: '新证书已获取', status: 'pending' },
      { id: 'step-4', title: '部署新证书', description: '替换旧证书并重启服务', expectedResult: '证书部署成功', actualResult: 'HTTPS连接正常', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: 'SSL证书已过期，导致HTTPS连接无法建立',
      symptoms: ['浏览器显示安全警告', 'openssl验证证书过期', 'HTTPS连接失败'],
      impact: '用户无法访问HTTPS网站，影响业务',
      severity: 'high',
      recommendedActions: ['从CA获取新证书', '备份旧证书', '部署新证书到服务器', '重启Web服务器', '验证证书有效性'],
      estimatedTime: '30-60分钟',
      relatedLogs: ['Jun 12 09:00:00 nginx: SSL certificate expires in 0 days', 'Jun 12 09:05:00 server: SSL_ERROR_CERTIFICATE_EXPIRED', 'Jun 12 09:10:00 nginx: SSL certificate renewed successfully'],
    },
  },
  {
    id: 'firewall-block',
    name: '防火墙规则错误',
    category: '网络',
    description: '模拟防火墙规则配置错误导致服务不可访问',
    difficulty: 'medium',
    scenario: '部署新服务器后，外部无法访问应用服务。检查发现防火墙规则阻止了应用端口的入站连接。',
    steps: [
      { id: 'step-1', title: '测试端口连通性', description: '使用telnet或nc测试应用端口', expectedResult: '端口可访问', actualResult: '连接被拒绝', status: 'pending' },
      { id: 'step-2', title: '检查防火墙状态', description: '查看防火墙规则', expectedResult: '允许应用端口访问', actualResult: '应用端口被阻止', status: 'pending' },
      { id: 'step-3', title: '添加防火墙规则', description: '添加允许应用端口的规则', expectedResult: '规则添加成功', actualResult: '规则已添加', status: 'pending' },
      { id: 'step-4', title: '验证连通性', description: '再次测试端口连通性', expectedResult: '端口可访问', actualResult: '连接成功', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: '防火墙规则未允许应用端口的入站连接',
      symptoms: ['应用端口无法访问', 'telnet连接被拒绝', '防火墙规则缺失'],
      impact: '外部用户无法访问应用服务',
      severity: 'high',
      recommendedActions: ['添加防火墙规则允许应用端口', '保存防火墙配置', '验证端口连通性', '考虑配置防火墙规则模板'],
      estimatedTime: '15-30分钟',
      relatedLogs: ['Jun 12 10:00:00 firewall: DROP IN=eth0 OUT= MAC=xx:xx:xx:xx:xx:xx SRC=192.168.1.100 DST=10.0.0.100', 'Jun 12 10:05:00 firewall: Rule added: allow port 8080', 'Jun 12 10:10:00 firewall: ACCEPT IN=eth0 OUT= MAC=xx:xx:xx:xx:xx:xx SRC=192.168.1.100 DST=10.0.0.100'],
    },
  },
  {
    id: 'service-failure',
    name: '服务启动失败',
    category: '系统',
    description: '模拟关键服务启动失败导致系统功能异常',
    difficulty: 'easy',
    scenario: '系统启动后，关键服务未能正常启动。检查发现是依赖服务未启动导致。',
    steps: [
      { id: 'step-1', title: '检查服务状态', description: '使用systemctl检查服务状态', expectedResult: '服务运行正常', actualResult: '服务启动失败', status: 'pending' },
      { id: 'step-2', title: '查看服务日志', description: '查看服务启动日志', expectedResult: '无错误', actualResult: '显示依赖服务未启动', status: 'pending' },
      { id: 'step-3', title: '启动依赖服务', description: '启动所需的依赖服务', expectedResult: '依赖服务启动成功', actualResult: '依赖服务已启动', status: 'pending' },
      { id: 'step-4', title: '重启目标服务', description: '重新启动目标服务', expectedResult: '服务启动成功', actualResult: '服务运行正常', status: 'pending' },
    ],
    expectedAnalysis: {
      rootCause: '依赖服务未启动，导致目标服务启动失败',
      symptoms: ['服务启动失败', '日志显示依赖缺失', '服务状态为failed'],
      impact: '系统功能异常，依赖该服务的功能不可用',
      severity: 'medium',
      recommendedActions: ['启动依赖服务', '配置服务依赖关系', '设置服务自动启动', '验证服务状态'],
      estimatedTime: '10-20分钟',
      relatedLogs: ['Jun 12 08:00:00 systemd: myservice.service: Dependency failed for My Service.', 'Jun 12 08:05:00 systemd: dependencyservice.service: Started.', 'Jun 12 08:10:00 systemd: myservice.service: Started.'],
    },
  },
];

export const experimentStatuses = {
  idle: { label: '待开始', color: 'bg-gray-100 text-gray-600' },
  running: { label: '进行中', color: 'bg-yellow-100 text-yellow-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  failed: { label: '失败', color: 'bg-red-100 text-red-600' },
};

export const difficultyLabels = {
  easy: { label: '简单', color: 'bg-green-100 text-green-600' },
  medium: { label: '中等', color: 'bg-yellow-100 text-yellow-600' },
  hard: { label: '困难', color: 'bg-red-100 text-red-600' },
};

export const severityLabels = {
  low: { label: '低', color: 'bg-green-100 text-green-600' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-600' },
  high: { label: '高', color: 'bg-orange-100 text-orange-600' },
  critical: { label: '严重', color: 'bg-red-100 text-red-600' },
};