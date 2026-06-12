import { CheckCircle, Circle, AlertCircle, Play } from 'lucide-react';
import type { FaultStep } from './faultData';

interface FaultStepCardProps {
  step: FaultStep;
  isActive: boolean;
  isCompleted: boolean;
  onExecute: () => void;
}

export default function FaultStepCard({ step, isActive, isCompleted, onExecute }: FaultStepCardProps) {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-text-muted" />;
    }
  };

  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isActive
          ? 'border-primary bg-primary/5 shadow-lg'
          : isCompleted
          ? 'border-green-200 bg-green-50/50'
          : 'border-primary/20 bg-white/85 hover:border-primary/40'
      }`}
    >
      {isActive && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
          当前步骤
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-theme-text">{step.title}</h4>
            {isActive && step.status === 'pending' && (
              <button
                onClick={onExecute}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                执行
              </button>
            )}
          </div>
          <p className="text-sm text-text-muted mb-3">{step.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-text-muted mb-1">预期结果</p>
              <p className="text-sm text-green-600">{step.expectedResult}</p>
            </div>
            <div className={`rounded-lg p-2 ${step.status !== 'pending' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-text-muted mb-1">实际结果</p>
              <p className={`text-sm ${step.status !== 'pending' ? 'text-red-600' : 'text-text-muted'}`}>
                {step.status === 'pending' ? '点击执行查看结果' : step.actualResult}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}