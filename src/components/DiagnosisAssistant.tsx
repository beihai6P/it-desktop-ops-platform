import { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageCircle, ChevronRight, AlertCircle, Zap, History, X, Send, BookOpen, Lightbulb, Trash2 } from 'lucide-react';
import type { DiagnosisHistory } from '@/types';
import { caseAPI } from '@/services/api';

interface DiagnosisAssistantProps {
  onCaseSelect?: (caseId: string) => void;
}

interface APICase {
  id: string;
  title: string;
  author: string;
  deviceType: string;
  views: number;
  symptoms?: string[];
}

const commonSymptoms = [
  '系统无法正常关机', 'Office崩溃', '网络连接问题', 'DNS故障',
  '打印机脱机', '虚拟机卡顿', '蓝屏错误', '更新失败',
  '认证失败', '连接超时', '无法打印', '应用无响应'
];

export default function DiagnosisAssistant({ onCaseSelect }: DiagnosisAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<{
    simpleSteps: string[];
    advancedSteps: string[];
    matchedCases: { id: string; title: string; author: string; deviceType: string; score: number; matchedSymptoms: string[] }[];
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('diagnosisHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const saveHistory = (newHistory: DiagnosisHistory[]) => {
    const trimmed = newHistory.slice(0, 10);
    setHistory(trimmed);
    localStorage.setItem('diagnosisHistory', JSON.stringify(trimmed));
  };

  // 添加症状到输入框
  const handleSymptomClick = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
      setInputText(inputText.replace(symptom, '').replace(/、{2,}/g, '、').replace(/^、|、$/g, ''));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      setInputText(inputText ? `${inputText}、${symptom}` : symptom);
    }
  };

  // 移除症状
  const handleRemoveSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    setInputText(inputText.replace(symptom, '').replace(/、{2,}/g, '、').replace(/^、|、$/g, ''));
  };

  // 清空输入
  const handleClearInput = () => {
    setInputText('');
    setSelectedSymptoms([]);
    setDiagnosisResult(null);
  };

  // 执行诊断
  const analyzeSymptoms = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    setDiagnosisResult(null);

    try {
      const symptoms = inputText.split('、').filter(s => s.trim());
      
      const response = await caseAPI.search({
        query: symptoms.join(' '),
        limit: 5
      });
      
      const apiCases = response.data.cases || [];
      
      const matchedCases = apiCases.map((caseItem: APICase) => {
        const matched = (caseItem.symptoms || []).filter((s: string) =>
          symptoms.some((ss) => s.includes(ss) || ss.includes(s))
        );
        const score = matched.length / Math.max((caseItem.symptoms?.length || 1), symptoms.length) * 100;
        return { 
          id: caseItem.id,
          title: caseItem.title,
          author: caseItem.author,
          deviceType: caseItem.deviceType,
          score: Math.round(score), 
          matchedSymptoms: matched 
        };
      }).filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score);

      const simpleSteps = generateSimpleSteps(symptoms);
      const advancedSteps = generateAdvancedSteps(symptoms);

      setDiagnosisResult({
        simpleSteps,
        advancedSteps,
        matchedCases
      });

      const newHistoryItem: DiagnosisHistory = {
        id: `history-${Date.now()}`,
        symptoms,
        timestamp: new Date().toISOString(),
        resultCount: matchedCases.length
      };
      saveHistory([newHistoryItem, ...history]);
    } catch (error) {
      console.error('Diagnosis failed:', error);
      
      const symptoms = inputText.split('、').filter(s => s.trim());
      
      setDiagnosisResult({
        simpleSteps: generateSimpleSteps(symptoms),
        advancedSteps: generateAdvancedSteps(symptoms),
        matchedCases: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 生成简易修复步骤
  const generateSimpleSteps = (symptoms: string[]): string[] => {
    const steps: string[] = [];
    
    if (symptoms.some(s => s.includes('崩溃') || s.includes('闪退') || s.includes('无响应'))) {
      steps.push('1. 关闭所有应用程序，重新启动电脑');
      steps.push('2. 检查是否有可用的系统更新和软件更新');
      steps.push('3. 尝试以管理员身份运行程序');
    }
    
    if (symptoms.some(s => s.includes('网络') || s.includes('连接') || s.includes('DNS'))) {
      steps.push('1. 检查网络线缆是否插好，路由器是否正常工作');
      steps.push('2. 尝试断开并重新连接网络');
      steps.push('3. 重启路由器或联系网络管理员');
    }
    
    if (symptoms.some(s => s.includes('打印') || s.includes('脱机'))) {
      steps.push('1. 检查打印机是否已开机并连接');
      steps.push('2. 确保打印机有足够的纸张和墨水');
      steps.push('3. 尝试重新添加打印机');
    }
    
    if (symptoms.some(s => s.includes('蓝屏') || s.includes('关机'))) {
      steps.push('1. 记下蓝屏错误代码');
      steps.push('2. 重启电脑，进入安全模式');
      steps.push('3. 卸载最近安装的软件或更新');
    }

    if (steps.length === 0) {
      steps.push('1. 尝试重启相关应用程序');
      steps.push('2. 检查系统是否有可用更新');
      steps.push('3. 查看相关错误日志');
    }

    return steps;
  };

  // 生成专业排查步骤
  const generateAdvancedSteps = (symptoms: string[]): string[] => {
    const steps: string[] = [];
    
    if (symptoms.some(s => s.includes('崩溃') || s.includes('闪退'))) {
      steps.push('> 打开事件查看器 (eventvwr.msc) 查看应用程序日志');
      steps.push('> 运行 sfc /scannow 检查系统文件完整性');
      steps.push('> 使用任务管理器检查内存和CPU占用');
      steps.push('> 检查应用程序兼容性设置');
    }
    
    if (symptoms.some(s => s.includes('网络') || s.includes('DNS'))) {
      steps.push('> ipconfig /flushdns 刷新DNS缓存');
      steps.push('> ipconfig /release && ipconfig /renew 重新获取IP');
      steps.push('> nslookup 测试DNS解析');
      steps.push('> tracert 跟踪路由路径');
    }
    
    if (symptoms.some(s => s.includes('打印'))) {
      steps.push('> net stop spooler && net start spooler 重启打印服务');
      steps.push('> 删除 C:\\Windows\\System32\\spool\\PRINTERS\\*.*');
      steps.push('> 检查打印机驱动版本并更新');
      steps.push('> 使用 Print Management 管理打印队列');
    }

    if (steps.length === 0) {
      steps.push('> 收集事件日志和系统信息');
      steps.push('> 使用性能监视器分析系统状态');
      steps.push('> 检查相关服务运行状态');
    }

    return steps;
  };

  // 获取匹配度颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // 清除历史记录
  const clearHistory = () => {
    saveHistory([]);
  };

  // 重新诊断历史记录
  const reDiagnose = (historyItem: DiagnosisHistory) => {
    setInputText(historyItem.symptoms.join('、'));
    setSelectedSymptoms(historyItem.symptoms);
    setShowHistory(false);
  };

  return (
    <div className="bg-white/95 border border-primary/20 rounded-xl p-6 sticky top-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-theme-text">智能诊断助手</h3>
          <p className="text-sm text-text-muted">输入症状，智能匹配解决方案</p>
        </div>
      </div>

      {/* AI诊断输入区 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-theme-text mb-2">描述你的故障</label>
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入你的电脑故障，例如：打开Excel就闪退、电脑连不上公司内网WiFi、开机蓝屏..."
            rows={3}
            className="w-full px-4 py-3 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm"
          />
          {inputText && (
            <button
              onClick={handleClearInput}
              className="absolute right-3 top-3 p-1 hover:bg-primary/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* 快捷症状标签组 */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {commonSymptoms.map((item) => (
            <button
              key={item.text}
              onClick={() => handleSymptomClick(item.text)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                selectedSymptoms.includes(item.text)
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {/* 已选症状标签 */}
      {selectedSymptoms.length > 0 && (
        <div className="mb-4 p-3 bg-theme-bg rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-theme-text">已选症状</span>
            </div>
            <button
              onClick={() => {
                setSelectedSymptoms([]);
                setInputText('');
              }}
              className="text-xs text-text-muted hover:text-red-500"
            >
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((symptom) => (
              <span
                key={symptom}
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm"
              >
                {symptom}
                <button onClick={() => handleRemoveSymptom(symptom)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 智能诊断按钮 */}
      <button
        onClick={analyzeSymptoms}
        disabled={!inputText.trim() || isAnalyzing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
          !inputText.trim() || isAnalyzing
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30'
        }`}
      >
        {isAnalyzing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            正在智能诊断...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            智能诊断
          </>
        )}
      </button>

      {/* 诊断历史记录 */}
      <div className="mt-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-3 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">历史查询 ({history.length})</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>

        {showHistory && history.length > 0 && (
          <div ref={historyRef} className="mt-3 space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white border border-primary/10 rounded-xl hover:border-primary/30 transition-colors"
              >
                <button
                  onClick={() => reDiagnose(item)}
                  className="flex-1 text-left text-sm text-text-muted hover:text-primary transition-colors truncate"
                  title={item.symptoms.join('、')}
                >
                  {item.symptoms.join('、')}
                </button>
                <span className="text-xs text-text-muted ml-2">
                  {new Date(item.timestamp).toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
            <button
              onClick={clearHistory}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-text-muted hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              清除所有历史记录
            </button>
          </div>
        )}
      </div>

      {/* 诊断结果展示区 */}
      {diagnosisResult && (
        <div className="mt-6 space-y-4">
          {/* 简易自助修复步骤 */}
          <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-700">简易自助修复步骤</h4>
            </div>
            <ul className="space-y-2">
              {diagnosisResult.simpleSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="w-5 h-5 bg-green-200 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 专业深度排查方案 */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-700">运维专业深度排查方案</h4>
            </div>
            <div className="space-y-2">
              {diagnosisResult.advancedSteps.map((step, index) => (
                <div key={index} className="bg-white rounded-lg p-3 text-sm text-blue-800 font-mono">
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* 站内匹配案例 */}
          {diagnosisResult.matchedCases.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-theme-text">匹配到的故障案例</h4>
                <span className="text-sm text-text-muted">({diagnosisResult.matchedCases.length}个)</span>
              </div>
              <div className="space-y-3">
                {diagnosisResult.matchedCases.map(({ id, title, author, deviceType, score, matchedSymptoms }) => (
                  <div
                    key={id}
                    onClick={() => onCaseSelect?.(id)}
                    className="p-4 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors cursor-pointer border border-primary/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-theme-text line-clamp-2">{title}</p>
                        <p className="text-sm text-text-muted mt-1">{author} · {deviceType}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
                        {score}%匹配
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {matchedSymptoms.slice(0, 3).map((symptom, index) => (
                        <span key={index} className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs">
                          ✓ {symptom}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{caseItem.views}人浏览</span>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 无匹配方案引导 */}
          {diagnosisResult.matchedCases.length === 0 && (
            <div className="bg-yellow-50 rounded-xl p-6 text-center border border-yellow-200">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-theme-text font-medium mb-1">未找到完全匹配的案例</p>
              <p className="text-sm text-text-muted mb-4">提交你的故障经验，全网运维同行帮你分析</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openCaseSubmit'))}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary-dark transition-colors"
              >
                <Send className="w-4 h-4" />
                提交新案例
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}