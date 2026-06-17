import { FileText, Package, Search, Users, Settings, Bell, Inbox } from 'lucide-react';

interface EmptyProps {
  type?: 'default' | 'search' | 'data' | 'users' | 'settings' | 'notifications' | 'inbox';
  message?: string;
  subMessage?: string;
}

const iconMap = {
  default: FileText,
  search: Search,
  data: Package,
  users: Users,
  settings: Settings,
  notifications: Bell,
  inbox: Inbox,
};

const messageMap = {
  default: '暂无数据',
  search: '未找到匹配的结果',
  data: '暂无数据',
  users: '暂无用户',
  settings: '暂无设置',
  notifications: '暂无通知',
  inbox: '收件箱为空',
};

export default function Empty({ type = 'default', message, subMessage }: EmptyProps) {
  const Icon = iconMap[type];
  const defaultMessage = messageMap[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-600 mb-1">
        {message || defaultMessage}
      </h3>
      {subMessage && (
        <p className="text-sm text-gray-400">{subMessage}</p>
      )}
    </div>
  );
}
