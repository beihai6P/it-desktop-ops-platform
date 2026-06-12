import { useState } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Activity,
  Network
} from 'lucide-react';
import { 
  systemConfigs, 
  defaultServices, 
  defaultSoftware, 
  defaultEnvironmentState,
  type SystemConfig,
  type ServiceConfig,
  type SoftwareConfig,
  type EnvironmentState
} from './environmentData';

interface EnvironmentPanelProps {
  selectedSystem: SystemConfig;
  onSystemChange: (system: SystemConfig) => void;
}

export default function EnvironmentPanel({ selectedSystem, onSystemChange }: EnvironmentPanelProps) {
  const [services] = useState<ServiceConfig[]>(defaultServices);
  const [software] = useState<SoftwareConfig[]>(defaultSoftware);
  const [environmentState, setEnvironmentState] = useState<EnvironmentState>(defaultEnvironmentState);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'stopped':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-600';
      case 'stopped':
        return 'bg-gray-100 text-gray-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'stopped':
        return '已停止';
      case 'error':
        return '错误';
      default:
        return status;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-500';
    if (usage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUsageBgColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-theme-text">环境配置</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-text mb-2">选择系统环境</label>
        <select
          value={selectedSystem.id}
          onChange={(e) => {
            const system = systemConfigs.find(s => s.id === e.target.value);
            if (system) onSystemChange(system);
          }}
          className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {systemConfigs.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-primary/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-theme-text">系统信息</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-muted">操作系统</span>
            <p className="font-medium text-theme-text">{selectedSystem.os}</p>
          </div>
          <div>
            <span className="text-text-muted">版本</span>
            <p className="font-medium text-theme-text">{selectedSystem.osVersion}</p>
          </div>
          <div>
            <span className="text-text-muted">CPU核心</span>
            <p className="font-medium text-theme-text">{selectedSystem.cpuCores} 核</p>
          </div>
          <div>
            <span className="text-text-muted">内存</span>
            <p className="font-medium text-theme-text">{selectedSystem.memoryGB} GB</p>
          </div>
          <div>
            <span className="text-text-muted">磁盘</span>
            <p className="font-medium text-theme-text">{selectedSystem.diskSizeGB} GB</p>
          </div>
          <div>
            <span className="text-text-muted">主机名</span>
            <p className="font-medium text-theme-text">{selectedSystem.hostname}</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-theme-text">系统状态</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Cpu className="w-3 h-3" /> CPU
              </span>
              <span className={`text-xs font-medium ${getUsageColor(environmentState.cpuUsage)}`}>
                {environmentState.cpuUsage}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all`}
                style={{ width: `${environmentState.cpuUsage}%`, backgroundColor: getUsageBgColor(environmentState.cpuUsage) }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> 内存
              </span>
              <span className={`text-xs font-medium ${getUsageColor(environmentState.memoryUsage)}`}>
                {environmentState.memoryUsage}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all`}
                style={{ width: `${environmentState.memoryUsage}%`, backgroundColor: getUsageBgColor(environmentState.memoryUsage) }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Server className="w-3 h-3" /> 磁盘
              </span>
              <span className={`text-xs font-medium ${getUsageColor(environmentState.diskUsage)}`}>
                {environmentState.diskUsage}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all`}
                style={{ width: `${environmentState.diskUsage}%`, backgroundColor: getUsageBgColor(environmentState.diskUsage) }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Network className="w-3 h-3" /> 连接数
              </span>
              <span className="text-xs font-medium text-theme-text">
                {environmentState.activeConnections}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(environmentState.activeConnections / 500 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-theme-text">服务状态</span>
        </div>
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-2 bg-theme-bg rounded-lg"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <div>
                  <p className="text-sm font-medium text-theme-text">{service.name}</p>
                  <p className="text-xs text-text-muted">{service.description}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                {getStatusLabel(service.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wifi className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-theme-text">网络流量</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-text-muted mb-1">入站流量</p>
            <p className="text-lg font-bold text-blue-600">{environmentState.networkIn} MB/s</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-text-muted mb-1">出站流量</p>
            <p className="text-lg font-bold text-green-600">{environmentState.networkOut} MB/s</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-theme-text">已安装软件</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {software.map((sw) => (
            <span
              key={sw.id}
              className="px-3 py-1.5 bg-theme-bg rounded-full text-xs font-medium text-theme-text"
            >
              {sw.name} v{sw.version}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}