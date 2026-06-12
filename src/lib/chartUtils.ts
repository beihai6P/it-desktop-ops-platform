export const formatNumber = (num: number, format?: string): string => {
  if (format === 'k') {
    return (num / 1000).toFixed(1) + 'k';
  }
  if (format === 'percent') {
    return num.toFixed(1) + '%';
  }
  if (format === 'currency') {
    return '¥' + num.toLocaleString();
  }
  return num.toLocaleString();
};

export const getPercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const generateGradient = (color: string): string => {
  return `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`;
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    normal: '#6B7280',
    warning: '#F59E0B',
    critical: '#EF4444',
    resolved: '#10B981',
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    open: '#EF4444',
    completed: '#10B981',
    running: '#3B82F6',
    idle: '#6B7280',
    active: '#10B981',
    ended: '#6B7280',
    online: '#10B981',
    offline: '#EF4444',
    away: '#F59E0B',
    hot: '#EF4444',
    new: '#3B82F6',
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
    verified: '#10B981',
    draft: '#F59E0B',
    published: '#10B981',
    featured: '#F59E0B',
  };
  return statusColors[status] || '#6B7280';
};

export const chartColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  orange: '#F97316',
  pink: '#EC4899',
  cyan: '#06B6D4',
  gray: '#6B7280',
};

export const generateChartColors = (count: number): string[] => {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#F97316',
    '#84CC16',
    '#6366F1',
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

export const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
};

export const calculateChange = (current: number, previous: number): string => {
  if (previous === 0) return '+0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return sign + change.toFixed(1) + '%';
};

export const getTimeRangeLabel = (value: string): string => {
  const ranges: Record<string, string> = {
    today: '今日',
    week: '本周',
    month: '本月',
    quarter: '本季度',
    year: '全年',
  };
  return ranges[value] || value;
};

export const getGaugeStatus = (value: number, max: number): 'normal' | 'warning' | 'critical' => {
  const percentage = (value / max) * 100;
  if (percentage >= 80) return 'normal';
  if (percentage >= 50) return 'warning';
  return 'critical';
};