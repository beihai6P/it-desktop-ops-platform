import { useState, useMemo, useEffect } from 'react';
import { Sparkles, MessageCircle, ChevronRight, AlertCircle, Zap, History, X } from 'lucide-react';
import type { Case } from '@/types';
import { caseAPI } from '@/services/api';

interface DiagnosisAssistantProps {
  onCaseSelect: (caseItem: Case) => void;
}

export default function DiagnosisAssistant({ onCaseSelect }: DiagnosisAssistantProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [matchedCases, setMatchedCases] = useState<{ case: Case; score: number; matchedSymptoms: string[] }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const response = await caseAPI.getAll();
      setCases(response.data.cases);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const commonSymptoms = useMemo(() => [
    '系统无法正常关机',
    'Office崩溃',
    '网络连接问题',
    'DNS故障',
    '打印机脱机',
    '虚拟机卡顿',
    '蓝屏错误',
    '更新失败',
    '认证失败',
    '连接超时',
  ], []);

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

  const analyzeSymptoms = () => {
    if (selectedSymptoms.length === 0 || loading) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const results = cases.map((caseItem) => {
        const matched = caseItem.symptoms.filter((s) =>
          selectedSymptoms.some((ss) => s.includes(ss) || ss.includes(s))
        );
        const score = matched.length / Math.max(caseItem.symptoms.length, selectedSymptoms.length) * 100;
        return { case: caseItem, score: Math.round(score), matchedSymptoms: matched };
      }).filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setMatchedCases(results);

      const queryStr = selectedSymptoms.join('、');
      setHistory((prev) => [queryStr, ...prev.slice(0, 4)]);

      setIsAnalyzing(false);
    }, 1500);
  };

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

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-theme-text">智能诊断助手</h3>
          <p className="text-sm text-text-muted">输入症状，智能匹配解决方案</p>
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
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => handleSymptomClick(symptom)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-primary text-white'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {selectedSymptoms.length > 0 && (
            <div className="mb-4 p-3 bg-theme-bg rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-theme-text">已选症状</span>
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
                正在分析...
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

          {matchedCases.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-theme-text">匹配结果</h4>
                <span className="text-sm text-text-muted">({matchedCases.length}个案例)</span>
              </div>
              <div className="space-y-3">
                {matchedCases.map(({ case: caseItem, score, matchedSymptoms }) => (
                  <div
                    key={caseItem.id}
                    onClick={() => onCaseSelect(caseItem)}
                    className="p-4 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors cursor-pointer border border-primary/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-theme-text">{caseItem.title}</p>
                        <p className="text-sm text-text-muted">{caseItem.brand} {caseItem.model}</p>
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">{caseItem.views}人浏览 · {caseItem.author}</span>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedCases.length === 0 && !isAnalyzing && selectedSymptoms.length > 0 && (
            <div className="mt-6 p-6 bg-yellow-50 rounded-xl text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-theme-text font-medium mb-1">未找到完全匹配的案例</p>
              <p className="text-sm text-text-muted">请尝试调整症状关键词，或查看完整案例库</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}