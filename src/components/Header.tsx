import { Bell, Search, User, Settings, HelpCircle, Menu, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import { notificationAPI } from '@/services/api';
import { logger } from '@/lib/logger';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      logger.error('获取未读通知数量失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setShowNotificationCenter(!showNotificationCenter);
  };

  return (
    <>
      <header className="bg-white/85 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors mr-2"
              >
                <Menu className="w-5 h-5 text-text-muted" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">IT</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-theme-text">萌萌的运维人</h1>
                <p className="text-xs text-text-muted">IT Desktop Ops Interactive Platform</p>
              </div>
            </div>

            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="搜索故障案例、流程模板..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-theme-bg border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleNotificationClick}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-text-muted" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5 text-text-muted" />
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-text-muted" />
              </button>
              <div className="relative pl-4 border-l border-primary/20">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:bg-primary/10 rounded-lg transition-colors p-1"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-theme-text">{user?.name || '运维工程师'}</span>
                    <p className="text-xs text-text-muted">{user?.role || '普通用户'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-primary/20 py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-primary/5 transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-theme-text">个人中心</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-primary/5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-theme-text">账号设置</span>
                    </button>
                    <div className="border-t border-primary/10 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}