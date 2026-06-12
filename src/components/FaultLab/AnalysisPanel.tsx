import { useState } from 'react';
import { LayoutDashboard, GitCompare, Brain, CheckCircle, XCircle, AlertTriangle, Link2 } from 'lucide-react';
import type { OSConfig } from './SystemConfig';
import type { CPUConfig, MemoryConfig, DiskConfig, GPUConfig, NetworkConfig } from './HardwareConfig';
import type { DriverInfo } from './DriverConfig';
import type { Software } from './SoftwareConfig';
import type { FaultAnalysis } from './faultData';

interface CompareResult {
  eventId: number;
  productionTime: string;
  sandboxTime: string;
  productionMsg: string;
  sandboxMsg: string;
  matched: boolean;
}

interface AnalysisPanelProps {
  osConfig?: OSConfig;
  cpu?: CPUConfig;
  memory?: MemoryConfig;
  disks?: DiskConfig[];
  gpu?: GPUConfig;
  networks?: NetworkConfig[];
  drivers?: DriverInfo[];
  software?: Software[];
  analysis?: FaultAnalysis;
  isVisible?: boolean;
}

export default function AnalysisPanel({
  osConfig,
  cpu,
  memory,
  disks = [],
  gpu,
  networks = [],
  drivers = [],
  software = [],
  analysis,
  isVisible = true,
}: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'diagnosis'>('overview');

  const hasNewProps = osConfig && cpu && memory && gpu;

  const compareResults: CompareResult[] = [
    { eventId: 10016, productionTime: '2024-01-15 14:32:15', sandboxTime: '2024-01-15 14:32:15', productionMsg: 'DCOM无法与计算机通信', sandboxMsg: 'DCOM无法与计算机通信', matched: true },
    { eventId: 4688, productionTime: '2024-01-15 14:32:20', sandboxTime: '2024-01-15 14:32:20', productionMsg: '已创建新进程', sandboxMsg: '已创建新进程', matched: true },
    { eventId: 1000, productionTime: '2024-01-15 14:32:25', sandboxTime: '2024-01-15 14:32:24', productionMsg: '应用程序w3wp.exe发生严重错误', sandboxMsg: '应用程序w3wp.exe发生严重错误', matched: true },
    { eventId: 5140, productionTime: '2024-01-15 14:32:30', sandboxTime: '2024-01-15 14:32:31', productionMsg: '网络共享对象被访问', sandboxMsg: '网络连接正常', matched: false },
    { eventId: 129, productionTime: '2024-01-15 14:32:35', sandboxTime: '2024-01-15 14:32:35', productionMsg: '磁盘I/O错误', sandboxMsg: '磁盘I/O错误', matched: true },
    { eventId: 7000, productionTime: '2024-01-15 14:32:40', sandboxTime: '2024-01-15 14:32:40', productionMsg: '服务无法启动', sandboxMsg: '服务无法启动', matched: true },
  ];

  const matchedCount = compareResults.filter(r => r.matched).length;
  const matchRate = Math.round((matchedCount / compareResults.length) * 100);

  const diagnosisReport = {
    hardware: {
      status: 'healthy' as const,
      findings: ['CPU配置正常', '内存大小与生产环境一致', '磁盘配置匹配'],
    },
    driver: {
      status: 'warning' as const,
      findings: ['NVIDIA显卡驱动版本与生产环境存在差异', '建议回滚至版本531.79'],
    },
    system: {
      status: 'healthy' as const,
      findings: ['操作系统版本匹配', '系统补丁版本一致'],
    },
    application: {
      status: 'error' as const,
      findings: ['检测到应用程序崩溃事件', 'w3wp.exe进程异常退出', '建议检查IIS配置'],
    },
  };

  const kbArticles = [
    { id: 'KB5032189', title: '修复Windows Server 2022上的DCOM错误', url: 'https://support.microsoft.com/KB5032189' },
    { id: 'KB5031356', title: 'IIS应用池崩溃问题修复', url: 'https://support.microsoft.com/KB5031356' },
    { id: 'KB5030300', title: '显卡驱动兼容性更新', url: 'https://support.microsoft.com/KB5030300' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isVisible) return null;

  if (analysis && !hasNewProps) {
    return (
      <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
        <h3 className="font-semibold text-theme-text mb-4">实验结果分析</h3>
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg">
            <h4 className="text-sm font-medium text-theme-text mb-2">根因分析</h4>
            <p className="text-sm text-text-muted">{analysis.rootCause}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-700 mb-2">建议措施</h4>
            <ul className="space-y-1">
              {analysis.recommendedActions.map((solution, index) => (
                <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  {solution}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 mb-2">相关日志</h4>
            <ul className="space-y-1">
              {analysis.relatedLogs.map((log, index) => (
                <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  {log}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border border-primary/20 rounded-xl overflow-hidden">
      <div className="flex border-b border-primary/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:bg-primary/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          环境总览
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'compare'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:bg-primary/5'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          日志对标
        </button>
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'diagnosis'
              ? 'bg-primary text-white'
              : 'text-text-muted hover:bg-primary/5'
          }`}
        >
          <Brain className="w-4 h-4" />
          AI诊断
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-lg">
              <h4 className="text-sm font-medium text-theme-text mb-2">操作系统配置</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                <div>系统版本: <span className="text-theme-text">{osConfig?.version || '未配置'}</span></div>
                <div>位数: <span className="text-theme-text">{osConfig?.bit || '未配置'}位</span></div>
                <div>Build号: <span className="text-theme-text">{osConfig?.buildNumber || '未配置'}</span></div>
                <div>主机名: <span className="text-theme-text">{osConfig?.hostname || '未配置'}</span></div>
                <div>语言: <span className="text-theme-text">{osConfig?.language || '未配置'}</span></div>
                <div>时区: <span className="text-theme-text">{osConfig?.timezone || '未配置'}</span></div>
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg">
              <h4 className="text-sm font-medium text-theme-text mb-2">硬件配置</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">CPU:</span>
                  <span className="text-theme-text">{cpu?.brand || '未配置'} {cpu?.model || ''} ({cpu?.cores || 0}核{cpu?.threads || 0}线程)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">内存:</span>
                  <span className="text-theme-text">{memory?.sizeMB || 0}MB {memory?.type || ''} @ {memory?.frequency || 0}MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">显卡:</span>
                  <span className="text-theme-text">{gpu?.type === 'integrated' ? '核显' : gpu?.type || '未配置'} {gpu?.model || ''} ({gpu?.vramGB || 0}GB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">硬盘:</span>
                  <span className="text-theme-text">{disks.length}块 ({disks.reduce((sum, d) => sum + d.capacityGB, 0)}GB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">网卡:</span>
                  <span className="text-theme-text">{networks.length}块</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg">
              <h4 className="text-sm font-medium text-theme-text mb-2">驱动配置</h4>
              <div className="space-y-1">
                {drivers.filter(d => d.isFaulty).length > 0 ? (
                  drivers.filter(d => d.isFaulty).map(driver => (
                    <div key={driver.id} className="flex items-center justify-between text-xs p-2 bg-red-50 rounded">
                      <span className="text-red-700">{driver.name}</span>
                      <span className="text-red-600">{driver.version} - 故障驱动</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted">无故障驱动</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg">
              <h4 className="text-sm font-medium text-theme-text mb-2">软件配置</h4>
              <div className="text-xs text-text-muted">
                已安装 {software.filter(s => s.installed).length} 款软件
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {software.filter(s => s.installed).slice(0, 8).map(soft => (
                  <span key={soft.id} className="px-2 py-1 bg-white border border-primary/20 rounded text-xs text-theme-text">
                    {soft.name}
                  </span>
                ))}
                {software.filter(s => s.installed).length > 8 && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-text-muted">
                    +{software.filter(s => s.installed).length - 8}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">日志匹配度</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all" 
                    style={{ width: `${matchRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-blue-700">{matchRate}%</span>
              </div>
            </div>

            <div className="space-y-2">
              {compareResults.map((result, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg overflow-hidden ${result.matched ? 'border-green-200' : 'border-red-200'}`}
                >
                  <div className="flex items-center justify-between p-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        result.matched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.matched ? '✓' : '✗'}
                      </span>
                      <span className="text-sm font-medium text-theme-text">EventID: {result.eventId}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      result.matched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.matched ? '匹配' : '不匹配'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-primary/10">
                    <div className="p-2">
                      <div className="text-xs text-text-muted mb-1">生产日志</div>
                      <div className="text-xs text-theme-text">{result.productionTime}</div>
                      <div className="text-xs text-text-muted mt-1">{result.productionMsg}</div>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-text-muted mb-1">沙盒日志</div>
                      <div className="text-xs text-theme-text">{result.sandboxTime}</div>
                      <div className={`text-xs mt-1 ${result.matched ? 'text-text-muted' : 'text-red-600'}`}>
                        {result.sandboxMsg}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!compareResults.every(r => r.matched) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>配置修正建议:</strong> 检测到日志不匹配，建议检查网络配置和服务状态。
                </p>
                <button className="mt-2 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors">
                  一键回改配置
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnosis' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(diagnosisReport).map(([category, data]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div className={`flex items-center gap-2 p-3 ${getStatusColor(data.status)}`}>
                    {getStatusIcon(data.status)}
                    <span className="text-sm font-medium capitalize">
                      {category === 'hardware' ? '硬件层' : 
                       category === 'driver' ? '驱动层' : 
                       category === 'system' ? '系统层' : '应用层'}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    {data.findings.map((finding, index) => (
                      <p key={index} className="text-xs text-text-muted">{finding}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-primary/5 rounded-lg">
              <h4 className="text-sm font-medium text-theme-text mb-3">官方KB补丁建议</h4>
              <div className="space-y-2">
                {kbArticles.map(kb => (
                  <div key={kb.id} className="flex items-center justify-between p-2 bg-white border border-primary/10 rounded">
                    <div>
                      <div className="text-sm font-medium text-theme-text">{kb.id}</div>
                      <div className="text-xs text-text-muted">{kb.title}</div>
                    </div>
                    <a href={kb.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                      <Link2 className="w-3 h-3" />
                      查看
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-700 mb-2">应急处置步骤</h4>
              <ol className="space-y-1 text-xs text-green-600">
                <li>1. 检查IIS应用池状态，确认是否需要重启</li>
                <li>2. 回滚显卡驱动至版本531.79</li>
                <li>3. 验证DCOM配置是否正确</li>
                <li>4. 监控系统日志，确认故障是否复现</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}