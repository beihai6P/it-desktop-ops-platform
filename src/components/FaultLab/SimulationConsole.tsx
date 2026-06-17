import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Camera, RotateCcw, Download, FileText, GitCompare } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  source: string;
  eventId: number;
  message: string;
  level: 'info' | 'warning' | 'error';
}

interface SimulationConsoleProps {
  isLogMode: boolean;
  environmentSource: 'manual' | 'log';
  productionLogs: LogEntry[];
  sandboxLogs: LogEntry[];
}

const generateSandboxLogs = (): LogEntry[] => {
  const sources = ['Application', 'System', 'Security', 'Microsoft-Windows-DistributedCOM', 'Disk', 'Service Control Manager'];
  const messages = [
    { message: '服务已启动', level: 'info' as const },
    { message: '应用程序正常运行', level: 'info' as const },
    { message: '检测到高CPU使用率', level: 'warning' as const },
    { message: '内存使用率达到85%', level: 'warning' as const },
    { message: '磁盘I/O延迟增加', level: 'warning' as const },
    { message: '应用程序崩溃', level: 'error' as const },
    { message: '服务无法启动', level: 'error' as const },
    { message: '网络连接中断', level: 'error' as const },
    { message: '驱动无响应', level: 'error' as const },
    { message: '系统即将重启', level: 'error' as const },
  ];

  const logs: LogEntry[] = [];
  for (let i = 0; i < 50; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    logs.push({
      timestamp: new Date(Date.now() - (50 - i) * 5000).toLocaleString('zh-CN'),
      source,
      eventId: Math.floor(Math.random() * 10000),
      message: msg.message,
      level: msg.level,
    });
  }
  return logs;
};

export default function SimulationConsole({ isLogMode, environmentSource, productionLogs, sandboxLogs }: SimulationConsoleProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([]);
  const [localSandboxLogs, setLocalSandboxLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = sandboxLogs.length > 0 ? sandboxLogs : generateSandboxLogs();
    setCurrentLogs(initial);
    setLocalSandboxLogs(initial);
  }, [sandboxLogs]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const sources = ['Application', 'System', 'Security', 'Microsoft-Windows-DistributedCOM'];
      const messages = [
        { message: '系统运行正常', level: 'info' as const },
        { message: '进程创建成功', level: 'info' as const },
        { message: '内存使用正常', level: 'info' as const },
        { message: 'CPU使用率偏高', level: 'warning' as const },
        { message: '磁盘写入延迟', level: 'warning' as const },
        { message: '服务响应缓慢', level: 'warning' as const },
        { message: '应用程序异常退出', level: 'error' as const },
        { message: '驱动超时', level: 'error' as const },
      ];

      const source = sources[Math.floor(Math.random() * sources.length)];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleString('zh-CN'),
        source,
        eventId: Math.floor(Math.random() * 10000),
        message: msg.message,
        level: msg.level,
      };

      setCurrentLogs(prev => [...prev.slice(-99), newLog]);
      setLocalSandboxLogs(prev => [...prev.slice(-99), newLog]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentLogs, isRunning]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-50';
      case 'warning': return 'text-yellow-500 bg-yellow-50';
      default: return 'text-green-500 bg-green-50';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return '✓';
    }
  };

  const exportLogs = () => {
    const sourceLogs = localSandboxLogs.length > 0 ? localSandboxLogs : currentLogs;
    const logText = sourceLogs.map(log => {
      return `[${log.timestamp}] [${log.source}] [EventID: ${log.eventId}] [${log.level.toUpperCase()}] ${log.message}`;
    }).join('\n');

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sandbox_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const takeSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toLocaleString('zh-CN'),
      logs: [...localSandboxLogs],
      isRunning: isRunning,
    };
    localStorage.setItem('sandbox_snapshot', JSON.stringify(snapshot));
    alert('环境快照已保存！');
  };

  const restartSandbox = () => {
    setIsRunning(false);
    setCurrentLogs([]);
    setLocalSandboxLogs([]);
    setTimeout(() => {
      const initialLogs = generateSandboxLogs();
      setCurrentLogs(initialLogs);
      setLocalSandboxLogs(initialLogs);
    }, 100);
    alert('沙盒已重启！');
  };

  return (
    <div className="h-full flex flex-col border border-primary/20 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-theme-bg">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-theme-text">仿真控制台</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            environmentSource === 'manual' 
              ? 'bg-gray-100 text-gray-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {environmentSource === 'manual' ? '手动自定义环境' : '日志溯源还原环境'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 border-b border-primary/10 bg-gray-50">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isRunning 
              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? '暂停' : '启动仿真'}
        </button>
        <button onClick={takeSnapshot} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-lg text-sm text-theme-text hover:bg-primary/5 transition-colors">
          <Camera className="w-4 h-4" />
          快照环境
        </button>
        <button onClick={restartSandbox} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-lg text-sm text-theme-text hover:bg-primary/5 transition-colors">
          <RotateCcw className="w-4 h-4" />
          重启沙盒
        </button>
        <button onClick={exportLogs} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/20 rounded-lg text-sm text-theme-text hover:bg-primary/5 transition-colors">
          <Download className="w-4 h-4" />
          导出日志
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLogMode && productionLogs.length > 0 ? (
          <div className="h-full flex">
            <div className="flex-1 border-r border-primary/10 flex flex-col">
              <div className="p-2 bg-red-50 text-red-700 text-xs font-medium text-center">
                原始生产日志
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {productionLogs.slice(-20).map((log, index) => (
                  <div key={index} className={`flex items-start gap-2 p-2 rounded text-xs ${getLevelColor(log.level)}`}>
                    <span className="font-medium">{getLevelIcon(log.level)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">{log.timestamp}</span>
                        <span className="font-medium">{log.source}</span>
                        <span className="text-text-muted">EventID: {log.eventId}</span>
                      </div>
                      <p className="truncate">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="p-2 bg-green-50 text-green-700 text-xs font-medium text-center flex items-center justify-center gap-2">
                <GitCompare className="w-3 h-3" />
                沙盒复现日志
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {currentLogs.slice(-20).map((log, index) => (
                  <div key={index} className={`flex items-start gap-2 p-2 rounded text-xs ${getLevelColor(log.level)}`}>
                    <span className="font-medium">{getLevelIcon(log.level)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">{log.timestamp}</span>
                        <span className="font-medium">{log.source}</span>
                        <span className="text-text-muted">EventID: {log.eventId}</span>
                      </div>
                      <p className="truncate">{log.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-3 space-y-1">
            {currentLogs.map((log, index) => (
              <div key={index} className={`flex items-start gap-2 p-2 rounded text-xs ${getLevelColor(log.level)}`}>
                <span className="font-medium">{getLevelIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">{log.timestamp}</span>
                    <span className="font-medium">{log.source}</span>
                    <span className="text-text-muted">EventID: {log.eventId}</span>
                  </div>
                  <p className="truncate">{log.message}</p>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="p-2 border-t border-primary/10 bg-gray-50 flex items-center justify-between text-xs text-text-muted">
        <span>日志条目: {currentLogs.length}</span>
        <span className={isRunning ? 'text-green-500' : 'text-gray-400'}>
          {isRunning ? '仿真运行中' : '仿真已停止'}
        </span>
      </div>
    </div>
  );
}