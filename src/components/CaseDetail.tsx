import { useState, useEffect } from 'react';
import { X, ThumbsUp, MessageSquare, Eye, Calendar, CheckCircle, Star, AlertCircle, Clock } from 'lucide-react';
import type { Case } from '@/types';
import { caseAPI } from '@/services/api';

interface CaseDetailProps {
  case: Case;
  onClose: () => void;
}

export default function CaseDetail({ case: currentCase, onClose }: CaseDetailProps) {
  const [relatedCases, setRelatedCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatedCases();
  }, [currentCase.id]);

  const loadRelatedCases = async () => {
    if (currentCase.relatedCases.length === 0) {
      setLoading(false);
      return;
    }
    try {
      const response = await caseAPI.getAll();
      const cases = response.data.cases;
      const related = cases.filter((c: Case) => currentCase.relatedCases.includes(c.id));
      setRelatedCases(related);
    } catch (error) {
      console.error('Failed to load related cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-600';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return '已解决';
      case 'in_progress':
        return '处理中';
      default:
        return '待处理';
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

  const handleMarkResolved = async () => {
    try {
      await caseAPI.update(currentCase.id, { status: 'resolved' });
      alert('案例已标记为已解决');
      onClose();
    } catch (error) {
      console.error('Failed to mark case as resolved:', error);
      alert('标记失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentCase.status)}`}>
                {getStatusLabel(currentCase.status)}
              </span>
              {currentCase.errorCode !== '-' && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {currentCase.errorCode}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentCase.difficulty)}`}>
                {getDifficultyLabel(currentCase.difficulty)}
              </span>
            </div>
            {currentCase.verification && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">已验证</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold text-theme-text mb-4">{currentCase.title}</h2>

          <div className="flex items-center gap-6 mb-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{currentCase.views} 浏览</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              <span>{currentCase.likes} 点赞</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{currentCase.comments} 评论</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>发布于 {currentCase.createdAt ? new Date(currentCase.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
            </div>
            {currentCase.createdAt !== currentCase.updatedAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>更新于 {currentCase.updatedAt ? new Date(currentCase.updatedAt).toLocaleDateString('zh-CN') : '-'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-6 p-4 bg-primary/5 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{currentCase.author?.[0] || '?'}</span>
            </div>
            <div>
              <p className="font-medium text-theme-text">{currentCase.author}</p>
              <p className="text-sm text-text-muted">运维工程师</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-text-muted">设备类型</p>
              <p className="font-medium text-theme-text">{currentCase.brand} {currentCase.model}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              症状描述
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentCase.symptoms.map((symptom, index) => (
                <span key={index} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              原因分析
            </h3>
            <p className="text-text-muted leading-relaxed bg-theme-bg p-4 rounded-xl">
              {currentCase.causeAnalysis}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              解决方案
            </h3>
            <p className="text-text-muted leading-relaxed bg-green-50 p-4 rounded-xl">
              {currentCase.solution}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">1</span>
              排查步骤
            </h3>
            <div className="space-y-4">
              {currentCase.steps.map((step, index) => (
                <div key={index} className="bg-theme-bg rounded-xl p-4 border border-primary/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-theme-text mb-1">{step.title}</h4>
                      <p className="text-sm text-text-muted mb-2">{step.description}</p>
                      {step.commands && step.commands.length > 0 && (
                        <div className="bg-black/90 rounded-lg p-3 mb-2">
                          {step.commands.map((cmd, cmdIndex) => (
                            <p key={cmdIndex} className="text-green-400 text-sm font-mono">{cmd}</p>
                          ))}
                        </div>
                      )}
                      {step.expectedResult && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                          <span>预期结果：{step.expectedResult}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentCase.relatedCases.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-theme-text mb-4">相关案例</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : relatedCases.length > 0 ? (
                <div className="grid gap-3">
                  {relatedCases.map((related) => (
                    <div key={related.id} className="bg-theme-bg rounded-xl p-4 hover:bg-primary/5 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-theme-text">{related.title}</p>
                          <p className="text-sm text-text-muted">{related.deviceType} · {related.brand} {related.model}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(related.status)}`}>
                          {getStatusLabel(related.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-muted">
                  未找到相关案例
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-primary/10 flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
            <ThumbsUp className="w-4 h-4" />
            点赞 ({currentCase.likes})
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
            <MessageSquare className="w-4 h-4" />
            评论 ({currentCase.comments})
          </button>
          <button 
            onClick={handleMarkResolved}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors ml-auto">
            <CheckCircle className="w-4 h-4" />
            标记已解决
          </button>
        </div>
      </div>
    </div>
  );
}