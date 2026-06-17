import { useState, useEffect } from 'react';
import { FlaskConical, AlertTriangle, AlertCircle, Info, CheckCircle, TrendingUp, Download, Share2, RefreshCw, BarChart3 } from 'lucide-react';
import type { Experiment, ExperimentAnalysisResult, ExperimentComparisonResult } from '@/types';
import { aiAPI } from '@/services/api';

interface AIExperimentAnalyzerProps {
  experiment: Experiment;
}

export default function AIExperimentAnalyzer({ experiment }: AIExperimentAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<ExperimentAnalysisResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ExperimentComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (experiment.status === 'completed') {
      analyzeExperiment();
    }
  }, [experiment]);

  const analyzeExperiment = async () => {
    setIsAnalyzing(true);
    try {
      const response = await aiAPI.analyzeExperiment({
        experimentId: experiment.id,
        faultType: experiment.faultType,
        logs: experiment.logs,
        metrics: {
          successRate: experiment.result?.issues.length ? (100 - experiment.result.issues.length * 10) / 100 : 0.8,
        },
      });
      setAnalysisResult(response.data.data);
    } catch (error) {
      console.error('Experiment analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompare = async () => {
    try {
      const response = await aiAPI.compareExperiments({
        experimentIds: ['exp-001', experiment.id],
        comparisonType: 'performance',
      });
      setComparisonResult(response.data.data);
      setShowComparison(true);
    } catch (error) {
      console.error('Comparison failed:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      default:
        return '低优先级';
    }
  };

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-theme-text">AI实验分析</h3>
            <p className="text-sm text-text-muted">自动分析实验结果和根因诊断</p>
          </div>
        </div>
        <button
          onClick={analyzeExperiment}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              重新分析
            </>
          )}
        </button>
      </div>

      {(isAnalyzing || !analysisResult) ? (
        <div className="text-center py-12">
          <FlaskConical className="w-12 h-12 mx-auto text-primary/30 mb-3" />
          <p className="text-text-muted">{isAnalyzing ? 'AI正在分析实验数据...' : '等待实验完成以进行分析'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-purple-700">分析完成</span>
            </div>
            <p className="text-sm text-theme-text">{analysisResult.report.summary}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-theme-text">根因分析</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                置信度 {(analysisResult.analysis.rootCause.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm font-medium text-red-700 mb-1">主要原因</p>
                <p className="text-sm text-theme-text">{analysisResult.analysis.rootCause.primary}</p>
              </div>
              {analysisResult.analysis.rootCause.secondary.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-700 mb-1">次要原因</p>
                  <ul className="space-y-1">
                    {analysisResult.analysis.rootCause.secondary.map((cause, index) => (
                      <li key={index} className="text-sm text-text-muted flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-theme-text">检测到的问题 ({analysisResult.analysis.issues.length})</span>
            </div>
            <div className="space-y-2">
              {analysisResult.analysis.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-xl border ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <p className="text-sm font-medium text-theme-text capitalize">{issue.severity}:</p>
                      <p className="text-sm text-text-muted">{issue.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-theme-text">解决方案建议 ({analysisResult.analysis.recommendations.length})</span>
            </div>
            <div className="space-y-2">
              {analysisResult.analysis.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 bg-theme-bg rounded-xl border border-primary/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getPriorityColor(rec.priority)}`}>
                        {getPriorityLabel(rec.priority)}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">预期影响: {rec.expectedImpact}</span>
                  </div>
                  <p className="text-sm text-theme-text">{rec.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">改进评分</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ width: `${analysisResult.report.improvementScore}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">{analysisResult.report.improvementScore}</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-green-700">
              <span>关键发现: {analysisResult.report.keyFindings.length} 项</span>
              <span>建议: {analysisResult.report.recommendationsCount} 条</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
              <Download className="w-4 h-4" />
              生成报告
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
              <Share2 className="w-4 h-4" />
              分享分析
            </button>
            <button
              onClick={handleCompare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              对比分析
            </button>
          </div>

          {showComparison && comparisonResult && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">实验对比分析</span>
                <button
                  onClick={() => setShowComparison(false)}
                  className="ml-auto text-xs text-text-muted hover:text-blue-600"
                >
                  关闭
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {comparisonResult.experiments.map((exp) => (
                  <div key={exp.id} className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-theme-text">{exp.name}</p>
                    <p className="text-xs text-text-muted">{new Date(exp.date).toLocaleDateString('zh-CN')}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                      exp.result === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {exp.result === 'completed' ? '已完成' : exp.result}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white rounded-lg mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-text-muted">成功率对比</span>
                  <span className={`text-sm font-medium ${
                    comparisonResult.comparison.status === 'improved' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparisonResult.comparison.status === 'improved' ? '有所提升' : '有所下降'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span>基准值</span>
                      <span>{comparisonResult.comparison.baseline}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gray-400 rounded-full"
                        style={{ width: `${comparisonResult.comparison.baseline}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span>当前值</span>
                      <span className={comparisonResult.comparison.status === 'improved' ? 'text-green-600' : 'text-red-600'}>
                        {comparisonResult.comparison.current}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          comparisonResult.comparison.status === 'improved' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${comparisonResult.comparison.current}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className={`text-lg font-bold ${
                    comparisonResult.comparison.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparisonResult.comparison.improvement >= 0 ? '+' : ''}{comparisonResult.comparison.improvement}%
                  </span>
                  <p className="text-xs text-text-muted">与基准相比</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-theme-text mb-2">关键洞察</p>
                <ul className="space-y-2">
                  {comparisonResult.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-text-muted flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
