export interface FaultStep {
  id: string;
  title: string;
  description: string;
  expectedResult: string;
  actualResult: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface FaultAnalysis {
  rootCause: string;
  symptoms: string[];
  impact: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
  estimatedTime: string;
  relatedLogs: string[];
}

export interface FaultType {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scenario: string;
  steps: FaultStep[];
  expectedAnalysis: FaultAnalysis;
}

// 故障类型数据 - 请从API获取
export const faultTypes: FaultType[] = [];

export const experimentStatuses = {
  idle: { label: '待开始', color: 'bg-gray-100 text-gray-600' },
  running: { label: '进行中', color: 'bg-yellow-100 text-yellow-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  failed: { label: '失败', color: 'bg-red-100 text-red-600' },
};

export const difficultyLabels = {
  easy: { label: '简单', color: 'bg-green-100 text-green-600' },
  medium: { label: '中等', color: 'bg-yellow-100 text-yellow-600' },
  hard: { label: '困难', color: 'bg-red-100 text-red-600' },
};

export const severityLabels = {
  low: { label: '低', color: 'bg-green-100 text-green-600' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-600' },
  high: { label: '高', color: 'bg-orange-100 text-orange-600' },
  critical: { label: '严重', color: 'bg-red-100 text-red-600' },
};