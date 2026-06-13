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

// 系统配置数据 - 请从API获取
export const systemConfigs: SystemConfig[] = [];

// 默认服务配置 - 请从API获取
export const defaultServices: ServiceConfig[] = [];

// 默认软件配置 - 请从API获取
export const defaultSoftware: SoftwareConfig[] = [];

// 默认环境状态
export const defaultEnvironmentState: EnvironmentState = {
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  networkIn: 0,
  networkOut: 0,
  activeConnections: 0,
  runningProcesses: 0,
};