import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, MessageSquare, Heart, AtSign, CheckSquare, FileText, Ticket, Send } from 'lucide-react';
import { notificationAPI } from '@/services/api';
import type { Notification } from '@/types';
import { logger } from '@/lib/logger';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

const notificationIcons = {
  system: Bell,
  comment: MessageSquare,
  like: Heart,
  mention: AtSign,
  task: CheckSquare,
  review: FileText,
  ticket: Ticket,
  message: Send,
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const priorityLabels = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function NotificationCenter({ isOpen, onClose, unreadCount, onUnreadCountChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getAll({ limit: 50 });
      if (response.data.success) {
        const normalizedData = response.data.data.map((item: Notification) => ({
          ...item,
          id: item._id || item.id,
          createdAt: item.createdAt || new Date().toISOString(),
          read: item.read || false,
        }));
        setNotifications(normalizedData);
      }
    } catch (error) {
      logger.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId?: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      if (notificationId) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        onUnreadCountChange(0);
      }
    } catch (error) {
      logger.error('标记为已读失败:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      logger.error('删除通知失败:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationAPI.deleteAll();
      setNotifications([]);
      onUnreadCountChange(0);
    } catch (error) {
      logger.error('清空通知失败:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCountDisplay = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-96 bg-white rounded-2xl shadow-2xl border border-primary/20 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-theme-text">通知中心</h2>
            {unreadCountDisplay > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCountDisplay}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="flex gap-1 p-3 border-b border-primary/10 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary/10 text-text-muted'
            }`}
          >
            全部 ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filter === 'unread' 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary/10 text-text-muted'
            }`}
          >
            未读 ({unreadCountDisplay})
          </button>
          <button
            onClick={() => setFilter('system')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filter === 'system' 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary/10 text-text-muted'
            }`}
          >
            系统通知
          </button>
          <button
            onClick={() => setFilter('comment')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filter === 'comment' 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary/10 text-text-muted'
            }`}
          >
            评论
          </button>
          <button
            onClick={() => setFilter('ticket')}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filter === 'ticket' 
                ? 'bg-primary text-white' 
                : 'hover:bg-primary/10 text-text-muted'
            }`}
          >
            工单
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="mt-3 text-text-muted text-sm">加载中...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-primary/30" />
              <p className="mt-3 text-text-muted">暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {filteredNotifications.map((notification) => {
                const IconComponent = notificationIcons[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-primary/5 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${!notification.read ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[notification.priority]}`}>
                            {priorityLabels[notification.priority]}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <h3 className={`font-medium text-sm ${!notification.read ? 'text-theme-text' : 'text-text-muted'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="inline-block mt-2 text-xs text-primary hover:underline"
                          >
                            查看详情
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                            title="标记为已读"
                          >
                            <Check className="w-4 h-4 text-text-muted" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-text-muted" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2 p-4 border-t border-primary/10">
            <button
              onClick={() => handleMarkAsRead()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">全部标为已读</span>
            </button>
            <button
              onClick={handleDeleteAll}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">清空</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}