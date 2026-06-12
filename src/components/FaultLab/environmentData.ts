export interface SystemConfig {
  id: string;
  name: string;
  os: 'Windows Server 2019' | 'Windows Server 2022' | 'Ubuntu 20.04' | 'Ubuntu 22.04' | 'CentOS 7' | 'CentOS 8';
  osVersion: string;
  cpuCores: number;
  memoryGB: number;
  diskSizeGB: number;
  networkInterface: string;
  hostname: string;
  domain: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  processId?: number;
  description: string;
  autoStart: boolean;
}

export interface SoftwareConfig {
  id: string;
  name: string;
  version: string;
  installed: boolean;
  description: string;
}

export interface EnvironmentState {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  runningProcesses: number;
}

export const systemConfigs: SystemConfig[] = [
  {
    id: 'win-server-2019',
    name: 'Windows Server 2019 标准配置',
    os: 'Windows Server 2019',
    osVersion: '10.0.17763',
    cpuCores: 4,
    memoryGB: 16,
    diskSizeGB: 500,
    networkInterface: 'Ethernet0',
    hostname: 'WIN-SRV-01',
    domain: 'corp.local',
  },
  {
    id: 'win-server-2022',
    name: 'Windows Server 2022 高性能',
    os: 'Windows Server 2022',
    osVersion: '10.0.20348',
    cpuCores: 8,
    memoryGB: 32,
    diskSizeGB: 1000,
    networkInterface: 'Ethernet1',
    hostname: 'WIN-SRV-02',
    domain: 'corp.local',
  },
  {
    id: 'ubuntu-2004',
    name: 'Ubuntu 20.04 LTS',
    os: 'Ubuntu 20.04',
    osVersion: '5.4.0',
    cpuCores: 4,
    memoryGB: 8,
    diskSizeGB: 256,
    networkInterface: 'eth0',
    hostname: 'ubuntu-srv-01',
    domain: 'corp.local',
  },
  {
    id: 'ubuntu-2204',
    name: 'Ubuntu 22.04 LTS',
    os: 'Ubuntu 22.04',
    osVersion: '5.15.0',
    cpuCores: 16,
    memoryGB: 64,
    diskSizeGB: 2000,
    networkInterface: 'eth0',
    hostname: 'ubuntu-srv-02',
    domain: 'corp.local',
  },
  {
    id: 'centos-7',
    name: 'CentOS 7',
    os: 'CentOS 7',
    osVersion: '3.10.0',
    cpuCores: 8,
    memoryGB: 32,
    diskSizeGB: 500,
    networkInterface: 'ens33',
    hostname: 'centos-srv-01',
    domain: 'corp.local',
  },
];

export const defaultServices: ServiceConfig[] = [
  {
    id: 'dns',
    name: 'DNS Server',
    status: 'running',
    port: 53,
    processId: 1234,
    description: '域名解析服务',
    autoStart: true,
  },
  {
    id: 'mysql',
    name: 'MySQL',
    status: 'running',
    port: 3306,
    processId: 2345,
    description: '数据库服务',
    autoStart: true,
  },
  {
    id: 'redis',
    name: 'Redis',
    status: 'running',
    port: 6379,
    processId: 3456,
    description: '缓存服务',
    autoStart: true,
  },
  {
    id: 'nginx',
    name: 'Nginx',
    status: 'running',
    port: 80,
    processId: 4567,
    description: 'Web服务器',
    autoStart: true,
  },
  {
    id: 'api',
    name: 'API Service',
    status: 'running',
    port: 8080,
    processId: 5678,
    description: '应用API服务',
    autoStart: true,
  },
];

export const defaultSoftware: SoftwareConfig[] = [
  {
    id: 'mysql-client',
    name: 'MySQL Client',
    version: '8.0.33',
    installed: true,
    description: 'MySQL数据库客户端',
  },
  {
    id: 'redis-cli',
    name: 'Redis CLI',
    version: '7.0.11',
    installed: true,
    description: 'Redis命令行客户端',
  },
  {
    id: 'curl',
    name: 'cURL',
    version: '7.81.0',
    installed: true,
    description: '命令行HTTP工具',
  },
  {
    id: 'nslookup',
    name: 'nslookup',
    version: '1.0',
    installed: true,
    description: 'DNS查询工具',
  },
  {
    id: 'htop',
    name: 'htop',
    version: '3.2.2',
    installed: true,
    description: '系统进程监控工具',
  },
];

export const defaultEnvironmentState: EnvironmentState = {
  cpuUsage: 25,
  memoryUsage: 45,
  diskUsage: 60,
  networkIn: 12.5,
  networkOut: 8.3,
  activeConnections: 156,
  runningProcesses: 89,
};