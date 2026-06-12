
import { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, ChevronRight, AlertCircle, Zap, History, X, CheckCircle, Clock, Target, Shield } from 'lucide-react';
import type { DiagnosisResult, DiagnosisSolution, Symptom } from '@/types';
import { aiAPI } from '@/services/api';

interface AIDiagnosisAssistantProps {
  onSolutionSelect?: (solution: DiagnosisSolution) => void;
}

export default function AIDiagnosisAssistant({ onSolutionSelect }: AIDiagnosisAssistantProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSymptoms();
  }, []);

  const loadSymptoms = async () => {
    try {
      const response = await aiAPI.getSymptoms({ limit: 15 });
      setSymptoms(response.data.data.symptoms);
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
      ]);
    } finally {
      setLoading(false);
    }
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
    if (selectedSymptoms.length === 0 || loading) return;

    setIsAnalyzing(true);
    setDiagnosisResult(null);

    try {
      const response = await aiAPI.diagnose({
        symptoms: selectedSymptoms,
        deviceType,
        errorCode,
      });
      setDiagnosisResult(response.data.data);

      const queryStr = selectedSymptoms.join('、');
      setHistory((prev) => [queryStr, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Diagnosis failed:', error);
    } finally {
      setIsAnalyzing(false);
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

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-theme-text">AI智能诊断助手</h3>
          <p className="text-sm text-text-muted">基于AI推理提供故障解决方案</p>
        </div>
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
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-theme-text">已选症状 ({selectedSymptoms.length})</span>
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

          {history.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-muted">历史查询</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSymptoms(item.split('、'));
                    }}
                    className="px-3 py-1 bg-theme-bg text-text-muted rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {diagnosisResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-theme-text">诊断结果</h4>
              </div>

              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
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
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-theme-text">解决方案 ({diagnosisResult.analysis.suggestedSolutions.length})</span>
                </div>
                <div className="space-y-3">
                  {diagnosisResult.analysis.suggestedSolutions.map((solution, index) => (
                    <div
                      key={solution.id}
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
                        className="flex items-center justify-between p-3 bg-theme-bg rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-theme-text">{relatedCase.title}</p>
                          <p className="text-xs text-text-muted">匹配度 {relatedCase.matchScore}%</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
