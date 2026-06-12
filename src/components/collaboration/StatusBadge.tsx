import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'pending' | 'ended';
  size?: 'sm' | 'md';
}

const config = {
  active: {
    label: '进行中',
    icon: CheckCircle,
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-500',
  },
  pending: {
    label: '等待中',
    icon: Clock,
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-500',
  },
  ended: {
    label: '已结束',
    icon: XCircle,
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-500',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const info = config[status];
  const Icon = info.icon;
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-3 py-1 text-sm gap-1.5';

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full ${info.bgColor} ${info.textColor} font-medium`}>
      <Icon className={`w-3.5 h-3.5 ${info.iconColor}`} />
      {info.label}
    </span>
  );
}