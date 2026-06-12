import { useState, useCallback } from 'react';
import { Play, Square, RotateCcw, Share2, AlertCircle, CheckCircle, Server, Database, Network, Cpu, HardDrive, Zap, Settings } from 'lucide-react';
import { faultTypes, difficultyLabels, type FaultType, type FaultStep } from './faultData';
import FaultStepCard from './FaultStepCard';
import AnalysisPanel from './AnalysisPanel';
import EnvironmentConfig from './EnvironmentConfig';

interface Experiment {
  id: string;
  name: string;
  faultType: string;
  status: 'idle' | 'running' | 'completed';
  progress: number;
  createdAt: string;
}

const iconMap: Record<string, typeof Server> = {
  '网络': Network,
  '数据库': Database,
  '缓存': Server,
  '系统': Cpu,
  '存储': HardDrive,
  '安全': Settings,
};

export default function FaultLab() {
  const [selectedFault, setSelectedFault] = useState<FaultType | null>(null);
  const [experimentStatus, setExperimentStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<FaultStep[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const experiments: Experiment[] = [
    { id: 'exp-001', name: 'DNS故障排查演练', faultType: 'DNS解析故障', status: 'completed', progress: 100, createdAt: '2024-01-20' },
    { id: 'exp-002', name: '数据库故障恢复', faultType: 'MySQL连接中断', status: 'running', progress: 45, createdAt: '2024-01-21' },
    { id: 'exp-003', name: 'Redis性能测试', faultType: 'Redis延迟', status: 'idle', progress: 0, createdAt: '2024-01-22' },
    { id: 'exp-004', name: 'SSL证书更新演练', faultType: 'SSL证书过期', status: 'completed', progress: 100, createdAt: '2024-01-23' },
    { id: 'exp-005', name: '防火墙规则配置', faultType: '防火墙规则错误', status: 'completed', progress: 100, createdAt: '2024-01-24' },
  ];

  const handleSelectFault = (fault: FaultType) => {
    setSelectedFault(fault);
    setSteps(fault.steps.map(step => ({ ...step, status: 'pending' as const })));
    setCurrentStepIndex(0);
    setExperimentStatus('idle');
    setShowAnalysis(false);
  };

  const handleStartExperiment = useCallback(() => {
    if (selectedFault) {
      setExperimentStatus('running');
      setShowAnalysis(false);
    }
  }, [selectedFault]);

  const handleExecuteStep = useCallback(() => {
    if (experimentStatus !== 'running') return;

    const updatedSteps = [...steps];
    if (currentStepIndex < updatedSteps.length) {
      updatedSteps[currentStepIndex] = { ...updatedSteps[currentStepIndex], status: 'completed' };
      setSteps(updatedSteps);

      if (currentStepIndex < updatedSteps.length - 1) {
        setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
        }, 500);
      } else {
        setExperimentStatus('completed');
        setShowAnalysis(true);
      }
    }
  }, [steps, currentStepIndex, experimentStatus]);

  const handleStopExperiment = useCallback(() => {
    setExperimentStatus('completed');
    const completedSteps = steps.map((step, index) => ({
      ...step,
      status: index <= currentStepIndex ? 'completed' as const : 'pending' as const,
    }));
    setSteps(completedSteps);
    setShowAnalysis(true);
  }, [steps, currentStepIndex]);

  const handleResetExperiment = useCallback(() => {
    if (selectedFault) {
      setSteps(selectedFault.steps.map(step => ({ ...step, status: 'pending' as const })));
      setCurrentStepIndex(0);
      setExperimentStatus('idle');
      setShowAnalysis(false);
    }
  }, [selectedFault]);

  const completedSteps = steps.filter(s => s.status === 'completed').length;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <EnvironmentConfig />
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-theme-text">选择故障场景</h3>
            <span className="text-sm text-text-muted">
              共 {faultTypes.length} 个场景
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faultTypes.map((fault) => {
              const Icon = iconMap[fault.category] || Server;
              const difficulty = difficultyLabels[fault.difficulty];
              return (
                <div
                  key={fault.id}
                  onClick={() => handleSelectFault(fault)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedFault?.id === fault.id
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-theme-text">{fault.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.color}`}>
                          {difficulty.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{fault.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedFault && (
          <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme-text">故障诊断流程</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">
                  {completedSteps}/{steps.length} 步骤
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">诊断进度</span>
                <span className="text-sm font-medium text-primary">{Math.round((completedSteps / steps.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-theme-text mb-1">故障场景描述</p>
                  <p className="text-sm text-text-muted">{selectedFault.scenario}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <FaultStepCard
                  key={step.id}
                  step={step}
                  isActive={experimentStatus === 'running' && index === currentStepIndex}
                  isCompleted={index < currentStepIndex || step.status === 'completed'}
                  onExecute={handleExecuteStep}
                />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="font-semibold text-theme-text mb-4">实验记录</h3>
          <div className="space-y-3">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-4 bg-theme-bg rounded-xl"
              >
                <div>
                  <p className="font-medium text-theme-text">{exp.name}</p>
                  <p className="text-xs text-text-muted">{exp.faultType} - {exp.createdAt}</p>
                </div>
                <div className="flex items-center gap-3">
                  {exp.status === 'running' && (
                    <div className="w-24">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${exp.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-text-muted mt-1 text-right">{exp.progress}%</p>
                    </div>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      exp.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : exp.status === 'running'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {exp.status === 'completed' ? '已完成' : exp.status === 'running' ? '进行中' : '待开始'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold">故障模拟控制台</h3>
              <p className="text-sm opacity-80">交互式故障诊断与分析</p>
            </div>
          </div>

          {experimentStatus === 'running' && (
            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{selectedFault?.name || '实验'}诊断中</p>
                  <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium animate-pulse">
                    运行中
                  </span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${(currentStepIndex / (steps.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={handleStopExperiment}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                <Square className="w-4 h-4" />
                停止诊断
              </button>
            </div>
          )}

          {experimentStatus === 'idle' && (
            <div className="space-y-4">
              {selectedFault ? (
                <>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-sm opacity-80 mb-1">已选择场景</p>
                    <p className="font-medium">{selectedFault.name}</p>
                  </div>
                  <button
                    onClick={handleStartExperiment}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-primary font-medium rounded-xl hover:bg-white/90 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    开始诊断
                  </button>
                </>
              ) : (
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <p className="text-sm opacity-80">请先选择故障场景</p>
                </div>
              )}
            </div>
          )}

          {experimentStatus === 'completed' && (
            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="font-medium">诊断完成</p>
                </div>
                <p className="text-sm opacity-80 text-center">AI分析报告已生成</p>
              </div>
              <button
                onClick={handleResetExperiment}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-primary font-medium rounded-xl hover:bg-white/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重新开始
              </button>
            </div>
          )}
        </div>

        {selectedFault && showAnalysis && (
          <AnalysisPanel analysis={selectedFault.expectedAnalysis} isVisible={showAnalysis} />
        )}

        {!showAnalysis && (
          <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold text-theme-text mb-4">实验结果分析</h3>
            <div className="text-center py-8">
              <Server className="w-12 h-12 mx-auto text-text-muted mb-2 opacity-50" />
              <p className="text-sm text-text-muted">暂无实验结果</p>
              <p className="text-xs text-text-muted mt-1">完成诊断后将显示AI分析报告</p>
            </div>
          </div>
        )}

        <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
          <h3 className="font-semibold text-theme-text mb-4">快捷操作</h3>
          <div className="space-y-2">
            <button
              onClick={handleResetExperiment}
              className="w-full flex items-center justify-between px-4 py-3 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm">重置实验环境</span>
              <RotateCcw className="w-4 h-4 text-text-muted" />
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-theme-bg rounded-xl hover:bg-primary/5 transition-colors">
              <span className="text-sm">生成分享链接</span>
              <Share2 className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}