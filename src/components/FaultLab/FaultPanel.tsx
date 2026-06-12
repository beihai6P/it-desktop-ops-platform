import { useState } from 'react';
import { Zap, Clock, AlertTriangle, Check, Lock } from 'lucide-react';

interface Fault {
  id: string;
  name: string;
  category: 'general' | 'timeline';
  description: string;
  parameters: { name: string; value: number; min: number; max: number; unit: string }[];
  isTimeline?: boolean;
  timestamp?: string;
  isCompatible: boolean;
  selected: boolean;
}

interface FaultPanelProps {
  faults: Fault[];
  onFaultsChange: (faults: Fault[]) => void;
  osVersion: string;
  isLogMode: boolean;
}

const generalFaults: Omit<Fault, 'id' | 'isCompatible' | 'selected'>[] = [
  {
    name: 'CPU过载',
    category: 'general',
    description: '模拟CPU使用率达到峰值，导致系统响应缓慢',
    parameters: [
      { name: 'CPU使用率', value: 95, min: 10, max: 100, unit: '%' },
      { name: '持续时间', value: 60, min: 10, max: 300, unit: '秒' },
    ],
  },
  {
    name: '内存泄漏',
    category: 'general',
    description: '模拟进程内存持续增长，最终导致内存耗尽',
    parameters: [
      { name: '泄漏速率', value: 50, min: 10, max: 500, unit: 'MB/s' },
      { name: '目标内存', value: 80, min: 50, max: 99, unit: '%' },
    ],
  },
  {
    name: '磁盘IO异常',
    category: 'general',
    description: '模拟磁盘读写速度变慢或IO队列阻塞',
    parameters: [
      { name: 'IO延迟', value: 500, min: 100, max: 5000, unit: 'ms' },
      { name: '队列深度', value: 100, min: 10, max: 500, unit: '' },
    ],
  },
  {
    name: '网络丢包',
    category: 'general',
    description: '模拟网络数据包丢失，影响网络通信',
    parameters: [
      { name: '丢包率', value: 10, min: 1, max: 50, unit: '%' },
      { name: '延迟增加', value: 100, min: 10, max: 1000, unit: 'ms' },
    ],
  },
  {
    name: '端口冲突',
    category: 'general',
    description: '模拟端口被占用，导致服务无法启动',
    parameters: [
      { name: '冲突端口', value: 80, min: 1, max: 65535, unit: '' },
    ],
  },
  {
    name: '运行库缺失',
    category: 'general',
    description: '模拟系统缺少必要的运行库文件',
    parameters: [],
  },
  {
    name: '服务崩溃',
    category: 'general',
    description: '模拟系统服务意外终止',
    parameters: [
      { name: '崩溃延迟', value: 30, min: 5, max: 120, unit: '秒' },
    ],
  },
  {
    name: '注册表损坏',
    category: 'general',
    description: '模拟系统注册表关键项损坏',
    parameters: [],
  },
];

const timelineFaults: Omit<Fault, 'id' | 'isCompatible' | 'selected'>[] = [
  {
    name: '磁盘读写延迟升高',
    category: 'timeline',
    description: '磁盘IO性能下降，读写响应变慢',
    timestamp: '00:00:00',
    parameters: [
      { name: '延迟', value: 200, min: 50, max: 2000, unit: 'ms' },
    ],
    isTimeline: true,
  },
  {
    name: '数据库事务阻塞',
    category: 'timeline',
    description: '数据库事务长时间未提交，导致阻塞',
    timestamp: '00:01:30',
    parameters: [
      { name: '阻塞时长', value: 120, min: 30, max: 600, unit: '秒' },
    ],
    isTimeline: true,
  },
  {
    name: '进程内存持续泄漏',
    category: 'timeline',
    description: '特定进程内存占用持续上升',
    timestamp: '00:03:00',
    parameters: [
      { name: '泄漏速率', value: 100, min: 10, max: 500, unit: 'MB/s' },
    ],
    isTimeline: true,
  },
  {
    name: '驱动无响应',
    category: 'timeline',
    description: '设备驱动停止响应，可能导致系统不稳定',
    timestamp: '00:05:00',
    parameters: [],
    isTimeline: true,
  },
  {
    name: '整机蓝屏重启',
    category: 'timeline',
    description: '系统完全崩溃，触发蓝屏重启',
    timestamp: '00:06:30',
    parameters: [],
    isTimeline: true,
  },
];

export default function FaultPanel({ faults, onFaultsChange, osVersion, isLogMode }: FaultPanelProps) {
  const [expandedFault, setExpandedFault] = useState<string | null>(null);

  const checkCompatibility = (faultName: string): boolean => {
    if (osVersion.includes('XP') && faultName.includes('蓝屏')) {
      return false;
    }
    if (osVersion.includes('11') && faultName.includes('运行库缺失')) {
      return false;
    }
    return true;
  };

  const toggleFault = (faultId: string) => {
    onFaultsChange(faults.map(f => 
      f.id === faultId ? { ...f, selected: !f.selected } : f
    ));
  };

  const updateParameter = (faultId: string, paramName: string, value: number) => {
    onFaultsChange(faults.map(f => {
      if (f.id === faultId) {
        return {
          ...f,
          parameters: f.parameters.map(p => 
            p.name === paramName ? { ...p, value } : p
          ),
        };
      }
      return f;
    }));
  };

  const filteredFaults = isLogMode 
    ? faults.filter(f => f.category === 'timeline')
    : faults.filter(f => f.category === 'general');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-theme-text">故障场景</h3>
          {isLogMode && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              日志溯源
            </span>
          )}
        </div>
        <span className="text-sm text-text-muted">
          已选 {faults.filter(f => f.selected).length} 个故障
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredFaults.map(fault => (
          <div
            key={fault.id}
            className={`border rounded-xl overflow-hidden transition-all ${
              fault.isCompatible
                ? fault.selected
                  ? 'border-primary bg-primary/5'
                  : 'border-primary/20 hover:border-primary/40'
                : 'border-gray-200 bg-gray-50 opacity-50'
            }`}
          >
            <div
              className={`flex items-center gap-3 p-3 cursor-pointer ${fault.isCompatible ? 'hover:bg-primary/5' : 'cursor-not-allowed'}`}
              onClick={() => fault.isCompatible && (expandedFault === fault.id ? setExpandedFault(null) : setExpandedFault(fault.id))}
            >
              <input
                type="checkbox"
                checked={fault.selected}
                onChange={() => fault.isCompatible && toggleFault(fault.id)}
                disabled={!fault.isCompatible}
                className={`w-4 h-4 rounded ${!fault.isCompatible ? 'cursor-not-allowed' : ''}`}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-theme-text truncate">{fault.name}</span>
                  {fault.isTimeline && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      日志溯源
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted truncate">{fault.description}</p>
              </div>

              {fault.isTimeline && fault.timestamp && (
                <span className="text-xs text-text-muted">{fault.timestamp}</span>
              )}

              {!fault.isCompatible && (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {expandedFault === fault.id && fault.parameters.length > 0 && (
              <div className="px-3 pb-3 space-y-3">
                {fault.parameters.map(param => (
                  <div key={param.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">{param.name}</span>
                      <span className="text-sm font-medium text-theme-text">
                        {param.value}{param.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      value={param.value}
                      onChange={(e) => updateParameter(fault.id, param.name, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>{param.min}{param.unit}</span>
                      <span>{param.max}{param.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {faults.filter(f => !f.isCompatible).length > 0 && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">
              {faults.filter(f => !f.isCompatible).length} 个故障与当前环境不兼容，已自动禁用
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function generateInitialFaults(): Fault[] {
  return [
    ...generalFaults.map((f, i) => ({
      ...f,
      id: `general-${i}`,
      isCompatible: true,
      selected: false,
    })),
    ...timelineFaults.map((f, i) => ({
      ...f,
      id: `timeline-${i}`,
      isCompatible: true,
      selected: false,
    })),
  ];
}

export type { Fault };