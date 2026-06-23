import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, MessageCircle, ChevronRight, AlertCircle, Zap, History, X, 
  CheckCircle, Clock, Target, Shield, Database, Globe, RefreshCw, Send,
  MessageSquare, Lightbulb, BookOpen, ExternalLink, FileText, FolderOpen
} from 'lucide-react';
import type { DiagnosisResult, DiagnosisSolution, Symptom } from '@/types';
import { aiAPI, type SmartQAResult } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredToast from './LoginRequiredToast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  dataSource?: 'local' | 'network';
  confidence?: number;
  localResults?: SmartQAResult['localResults'];
}

interface AIDiagnosisAssistantProps {
  onSolutionSelect?: (solution: DiagnosisSolution) => void;
  onCaseSelect?: (caseId: string) => void;
  onRequireLogin?: () => void;
}

export default function AIDiagnosisAssistant({ onSolutionSelect, onCaseSelect, onRequireLogin }: AIDiagnosisAssistantProps) {
  const { isAuthenticated } = useAuth();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginToast, setShowLoginToast] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSymptoms();
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadSymptoms = async () => {
    try {
      const response = await aiAPI.getSymptoms({ limit: 15 });
      if (response && response.data && response.data.symptoms) {
        setSymptoms(response.data.symptoms);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Failed to load symptoms:', error);
      setSymptoms([
        { id: 'sym-001', text: '系统无法正常关机', category: 'system', frequency: 156 },
        { id: 'sym-002', text: 'Office崩溃', category: 'software', frequency: 89 },
        { id: 'sym-003', text: '网络连接问题', category: 'network', frequency: 234 },
        { id: 'sym-004', text: 'DNS故障', category: 'network', frequency: 167 },
        { id: 'sym-005', text: '打印机脱机', category: 'hardware', frequency: 98 },
        { id: 'sym-006', text: '虚拟机卡顿', category: 'system', frequency: 76 },
        { id: 'sym-007', text: '蓝屏错误', category: 'system', frequency: 145 },
        { id: 'sym-008', text: '更新失败', category: 'software', frequency: 112 },
        { id: 'sym-009', text: '认证失败', category: 'system', frequency: 67 },
        { id: 'sym-010', text: '连接超时', category: 'network', frequency: 189 },
        { id: 'sym-011', text: '磁盘空间不足', category: 'hardware', frequency: 134 },
        { id: 'sym-012', text: '进程占用过高', category: 'system', frequency: 87 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = () => {
    const saved = localStorage.getItem('diagnosisChatHistory');
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch {
        setChatHistory([]);
      }
    }
  };

  const saveChatHistory = (newHistory: string[]) => {
    const trimmed = newHistory.slice(0, 10);
    setChatHistory(trimmed);
    localStorage.setItem('diagnosisChatHistory', JSON.stringify(trimmed));
  };

  const handleSymptomClick = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const analyzeSymptoms = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    if (selectedSymptoms.length === 0 || loading) return;

    setIsAnalyzing(true);
    setDiagnosisResult(null);

    try {
      const response = await aiAPI.diagnose({
        symptoms: selectedSymptoms,
        deviceType,
        errorCode,
      });
      setDiagnosisResult(response.data);

      const queryStr = selectedSymptoms.join('、');
      saveChatHistory([queryStr, ...chatHistory]);
    } catch (error) {
      console.error('Diagnosis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    if (!inputMessage.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsThinking(true);

    try {
      const response = await aiAPI.smartQA({
        question: inputMessage,
        useLocalOnly: false,
        topK: 5
      });

      const result = response.data;
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: result.answer,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        dataSource: result.dataSource,
        confidence: result.confidence,
        localResults: result.localResults
      };

      setChatMessages(prev => [...prev, aiMessage]);
      saveChatHistory([inputMessage, ...chatHistory]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: '抱歉，暂时无法回答您的问题，请稍后重试。',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-red-100 text-red-600';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单';
      case 'medium':
        return '中等';
      default:
        return '困难';
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const reSendMessage = (message: string) => {
    setInputMessage(message);
  };

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-text">AI智能诊断助手</h3>
            <p className="text-sm text-text-muted">基于AI推理提供故障解决方案</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted px-2 py-1 bg-primary/5 rounded">
            本地知识库优先
          </span>
        </div>
      </div>

      {/* 智能问答模式 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-theme-text">智能问答</span>
        </div>
        
        <div className="bg-theme-bg/50 rounded-xl overflow-hidden">
          <div className="h-64 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <Sparkles className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">有什么可以帮助您的？</p>
                <p className="text-xs mt-1">输入您的问题，AI会先检索本地知识库，若无资料再联网回答</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'user' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {msg.type === 'user' ? (
                      <MessageCircle className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`max-w-[75%] ${msg.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-2 rounded-xl ${
                      msg.type === 'user' 
                        ? 'bg-primary text-white rounded-br-md' 
                        : 'bg-white border border-primary/10 rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.type === 'ai' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted">{msg.timestamp}</span>
                        {msg.dataSource && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            msg.dataSource === 'local' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {msg.dataSource === 'local' ? (
                              <span className="flex items-center gap-1">
                                <Database className="w-3 h-3" /> 本地
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" /> 联网
                              </span>
                            )}
                          </span>
                        )}
                        {msg.confidence !== undefined && (
                          <span className="text-xs text-text-muted">
                            置信度: {(msg.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                    {msg.type === 'ai' && msg.localResults && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                        {(msg.localResults.cases.length > 0 || msg.localResults.documents.length > 0) && (
                          <>
                            {msg.localResults.cases.length > 0 && (
                              <div className="mb-3">
                                <div className="flex items-center gap-1 text-xs text-primary mb-2">
                                  <FolderOpen className="w-3 h-3" />
                                  相关故障案例 ({msg.localResults.cases.length})
                                </div>
                                {msg.localResults.cases.slice(0, 2).map((item) => (
                                  <div 
                                    key={item.id}
                                    onClick={() => onCaseSelect?.(item.id)}
                                    className="text-xs p-2 bg-white rounded-lg cursor-pointer hover:bg-primary/5 mb-1"
                                  >
                                    <p className="text-theme-text font-medium">{item.title}</p>
                                    <p className="text-text-muted truncate">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {msg.localResults.documents.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1 text-xs text-primary mb-2">
                                  <FileText className="w-3 h-3" />
                                  相关文档 ({msg.localResults.documents.length})
                                </div>
                                {msg.localResults.documents.slice(0, 2).map((item) => (
                                  <div 
                                    key={item.id}
                                    className="text-xs p-2 bg-white rounded-lg cursor-pointer hover:bg-primary/5 mb-1"
                                  >
                                    <p className="text-theme-text font-medium">{item.title}</p>
                                    <p className="text-text-muted truncate">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isThinking && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-primary/10 rounded-xl px-4 py-2 rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t border-primary/10 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="输入您的问题，如：Excel打不开怎么办？..."
                className="flex-1 px-4 py-2 bg-white border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={isThinking}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isThinking}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-text-muted hover:text-red-500 mt-2"
              >
                清空对话
              </button>
            )}
          </div>
        </div>

        {chatHistory.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted">历史查询</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {chatHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => reSendMessage(item)}
                  className="px-3 py-1 bg-theme-bg text-text-muted rounded-lg text-xs hover:bg-primary/10 hover:text-primary transition-colors max-w-[150px] truncate"
                  title={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 症状选择模式 */}
      <div className="border-t border-primary/10 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-theme-text">症状诊断</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-text mb-2">选择症状</label>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => handleSymptomClick(symptom.text)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedSymptoms.includes(symptom.text)
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {symptom.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-text mb-2">自定义症状</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSymptom()}
                  placeholder="输入其他症状..."
                  className="flex-1 px-4 py-2 bg-theme-bg/50 border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleAddCustomSymptom}
                  disabled={!customSymptom.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">设备类型</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-bg/50 border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">请选择</option>
                  <option value="台式机">台式机</option>
                  <option value="笔记本">笔记本</option>
                  <option value="虚拟桌面">虚拟桌面</option>
                  <option value="服务器">服务器</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">错误代码</label>
                <input
                  type="text"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="如: 0x80070005"
                  className="w-full px-4 py-2 bg-theme-bg/50 border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {selectedSymptoms.length > 0 && (
              <div className="mb-4 p-3 bg-theme-bg rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-theme-text">已选症状 ({selectedSymptoms.length})</span>
                  </div>
                  <button
                    onClick={() => setSelectedSymptoms([])}
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

            <button
              onClick={analyzeSymptoms}
              disabled={selectedSymptoms.length === 0 || isAnalyzing}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                selectedSymptoms.length === 0 || isAnalyzing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI正在分析...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  智能诊断
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* 诊断结果展示 */}
      {diagnosisResult && (
        <div className="mt-6 border-t border-primary/10 pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-theme-text">诊断结果</h4>
          </div>

          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">AI分析建议</span>
            </div>
            <p className="text-sm text-theme-text">{diagnosisResult.aiSuggestion}</p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">根因分析</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-theme-text">
                <span className="font-medium">主要原因：</span>{diagnosisResult.analysis.primaryCause}
              </p>
              {diagnosisResult.analysis.secondaryCauses.length > 0 && (
                <p className="text-sm text-text-muted">
                  <span className="font-medium">次要原因：</span>{diagnosisResult.analysis.secondaryCauses.join('、')}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">置信度：</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                  {(diagnosisResult.analysis.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-theme-text">解决方案 ({diagnosisResult.analysis.suggestedSolutions.length})</span>
            </div>
            <div className="space-y-3">
              {diagnosisResult.analysis.suggestedSolutions.map((solution, index) => (
                <div
                  key={solution.id || `solution-${index}`}
                  onClick={() => onSolutionSelect?.(solution)}
                  className="p-4 bg-theme-bg rounded-xl border border-primary/10 hover:border-primary/30 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          方案{index + 1}
                        </span>
                        <h5 className="font-medium text-theme-text">{solution.title}</h5>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(solution.difficulty)}`}>
                        {getDifficultyLabel(solution.difficulty)}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                        成功率 {(solution.successRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span className="text-xs text-text-muted">预计耗时：{solution.estimatedTime}</span>
                  </div>
                  <div className="space-y-1">
                    {solution.steps.map((step, stepIndex) => (
                      <p key={stepIndex} className="text-sm text-theme-text flex items-start gap-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-primary/10 text-primary rounded-full text-xs flex-shrink-0">
                          {stepIndex + 1}
                        </span>
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {diagnosisResult.analysis.precautions.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">注意事项</span>
              </div>
              <ul className="space-y-1">
                {diagnosisResult.analysis.precautions.map((precaution, index) => (
                  <li key={index} className="text-sm text-text-muted flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    {precaution}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnosisResult.analysis.relatedCases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChevronRight className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-theme-text">相关案例</span>
              </div>
              <div className="space-y-2">
                {diagnosisResult.analysis.relatedCases.map((relatedCase) => (
                  <div
                    key={relatedCase.id}
                    onClick={() => onCaseSelect?.(relatedCase.id)}
                    className="flex items-center justify-between p-3 bg-theme-bg rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-theme-text">{relatedCase.title}</p>
                      <p className="text-xs text-text-muted">匹配度 {relatedCase.matchScore}%</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
