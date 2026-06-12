import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface LogUploaderProps {
  onParseComplete: (parsedData: ParsedLogData) => void;
}

interface ParsedLogData {
  osVersion: string;
  osBit: '32' | '64';
  buildNumber: string;
  hostname: string;
  cpuModel: string;
  memorySizeMB: number;
  diskInfo: { type: string; capacityGB: number }[];
  gpuModel: string;
  faultyDriver?: string;
  driverVersion?: string;
  timelineEvents: TimelineEvent[];
}

interface TimelineEvent {
  timestamp: string;
  eventId: number;
  source: string;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export default function LogUploader({ onParseComplete }: LogUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedLogData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.evtx', '.dmp', '.log', '.txt'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      setError('不支持的文件格式，请上传 .evtx、.dmp、.log 或 .txt 文件');
      return;
    }

    setError('');
    setUploading(true);

    setTimeout(() => {
      const mockParsedData: ParsedLogData = {
        osVersion: 'Windows 10 Pro 22H2',
        osBit: '64',
        buildNumber: '10.0.19045.3693',
        hostname: 'WIN-SRV-2023',
        cpuModel: 'Intel Core i7-12700',
        memorySizeMB: 16384,
        diskInfo: [
          { type: 'NVMe', capacityGB: 1024 },
          { type: 'HDD', capacityGB: 4096 },
        ],
        gpuModel: 'NVIDIA GeForce RTX 3060',
        faultyDriver: 'NVIDIA GeForce',
        driverVersion: '531.79',
        timelineEvents: [
          { timestamp: '2024-01-15 14:32:15', eventId: 10016, source: 'Microsoft-Windows-DistributedCOM', message: 'DCOM 无法与计算机 192.168.1.100 上的服务器 {12345678-1234-1234-1234-1234567890AB} 通信', level: 'error' },
          { timestamp: '2024-01-15 14:32:20', eventId: 4688, source: 'Security', message: '已创建新进程。进程 ID: 1234', level: 'info' },
          { timestamp: '2024-01-15 14:32:25', eventId: 1000, source: 'Application Error', message: '应用程序 w3wp.exe 发生严重错误', level: 'error' },
          { timestamp: '2024-01-15 14:32:30', eventId: 5140, source: 'Security', message: '网络共享对象被访问', level: 'info' },
          { timestamp: '2024-01-15 14:32:35', eventId: 129, source: 'Disk', message: '磁盘 I/O 错误', level: 'warning' },
          { timestamp: '2024-01-15 14:32:40', eventId: 7000, source: 'Service Control Manager', message: '服务无法启动', level: 'error' },
        ],
      };

      setParsedResult(mockParsedData);
      setUploading(false);
    }, 2000);
  };

  const handleConfirm = () => {
    if (parsedResult) {
      onParseComplete(parsedResult);
      setIsOpen(false);
      setParsedResult(null);
    }
  };

  const handleReset = () => {
    setParsedResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Upload className="w-4 h-4" />
        <span>上传日志自动回填环境</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-primary/10">
              <h3 className="text-lg font-semibold text-theme-text">上传日志文件</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setParsedResult(null);
                  setError('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6">
              {!parsedResult ? (
                <>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      error ? 'border-red-300 bg-red-50' : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".evtx,.dmp,.log,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-theme-text">正在解析日志文件...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-theme-text font-medium mb-2">点击或拖拽文件到此处上传</p>
                        <p className="text-sm text-text-muted">支持 .evtx、.dmp、.log、.txt 格式</p>
                      </>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-600">{error}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">日志解析成功！</span>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-text-muted mb-1">操作系统</p>
                      <p className="text-sm font-medium text-theme-text">{parsedResult.osVersion} ({parsedResult.osBit}位)</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-text-muted mb-1">主机名</p>
                      <p className="text-sm font-medium text-theme-text">{parsedResult.hostname}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-text-muted mb-1">CPU</p>
                      <p className="text-sm font-medium text-theme-text">{parsedResult.cpuModel}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-text-muted mb-1">内存</p>
                      <p className="text-sm font-medium text-theme-text">{parsedResult.memorySizeMB} MB</p>
                    </div>
                    {parsedResult.faultyDriver && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600 mb-1">检测到故障驱动</p>
                        <p className="text-sm font-medium text-red-700">{parsedResult.faultyDriver} v{parsedResult.driverVersion}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2">时序事件 ({parsedResult.timelineEvents.length} 条)</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {parsedResult.timelineEvents.slice(0, 5).map((event, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 ${
                            event.level === 'error' ? 'bg-red-500' : 
                            event.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-theme-text">{event.timestamp}</p>
                            <p className="text-xs text-text-muted truncate">{event.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-primary/10">
              {parsedResult ? (
                <>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    重新上传
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    确认回填
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export type { ParsedLogData, TimelineEvent };