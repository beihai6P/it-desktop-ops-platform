import { Bell, Search, User, Settings, HelpCircle, ChevronDown, LogOut, UserCircle, Menu, X, Cpu, BarChart3, FlaskConical, Users, MessageSquare, BookOpen, Wrench, Shield, UserCog, LayoutDashboard, CheckSquare, Home } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import { notificationAPI } from '@/services/api';
import { logger } from '@/lib/logger';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.isAdmin || user?.role === 'admin';
  const showUserManagement = isAdmin || hasPermission('USER_VIEW');
  const showRoleManagement = isAdmin || hasPermission('ROLE_MANAGE');

  // 用户菜单项
  const userMenuItems: MenuItem[] = [
    { id: 'home', label: '首页', icon: Home, path: '/' },
    { id: 'diagnosis', label: '故障诊断', icon: Cpu, path: '/diagnosis' },
    { id: 'tools', label: '工具分享', icon: Wrench, path: '/tools' },
    { id: 'sandbox', label: '沙盒实验室', icon: FlaskConical, path: '/sandbox' },
    { id: 'knowledge', label: '知识库', icon: BookOpen, path: '/knowledge' },
    { id: 'community', label: '社区交流', icon: MessageSquare, path: '/community' },
    { id: 'collaboration', label: '远程协作', icon: Users, path: '/collaboration' },
  ];

  // 管理员菜单项
  const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', label: '管理后台', icon: LayoutDashboard, path: '/home' },
    { id: 'analytics', label: '数据洞察', icon: BarChart3, path: '/analytics' },
    { id: 'review', label: '内容审核', icon: CheckSquare, path: '/admin/review' },
    { id: 'user-management', label: '用户管理', icon: UserCog, path: '/admin/users' },
    { id: 'role-management', label: '角色权限', icon: Shield, path: '/admin/roles' },
    { id: 'settings', label: '系统设置', icon: Settings, path: '/settings' },
  ];

  // 根据用户角色确定显示的菜单项
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleNavigation = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-primary/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo区域 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-white font-bold text-lg">IT</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-theme-text">萌萌的运维人</h1>
                <p className="text-xs text-text-muted -mt-0.5">IT Desktop Ops Platform</p>
              </div>
            </div>

            {/* 主导航菜单 - 桌面端 */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center px-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-text-muted hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 右侧功能区 */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 搜索框 - 桌面端 */}
              <div className="hidden md:block relative w-64 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="搜索故障案例、流程模板..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white transition-all text-sm"
                />
              </div>

              {/* 通知按钮 */}
              <button
                onClick={handleNotificationClick}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors relative"
                title="通知中心"
              >
                <Bell className="w-5 h-5 text-text-muted" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 帮助按钮 */}
              <button 
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors hidden sm:block"
                title="帮助中心"
              >
                <HelpCircle className="w-5 h-5 text-text-muted" />
              </button>

              {/* 用户菜单 */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 hover:bg-primary/10 rounded-lg transition-colors p-1.5"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center shadow-sm">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-sm font-medium text-theme-text block leading-tight">{user?.name || '运维工程师'}</span>
                    <span className="text-xs text-text-muted">{user?.role || '普通用户'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* 用户下拉菜单 */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary/5 transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-theme-text">个人中心</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary/5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-theme-text">账号设置</span>
                    </button>
                    <div className="border-t border-gray-100 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">退出登录</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5 text-text-muted" />
                ) : (
                  <Menu className="w-5 h-5 text-text-muted" />
                )}
              </button>
            </div>
          </div>

          {/* 移动端搜索框 */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {showMobileMenu && (
          <div 
            ref={mobileMenuRef}
            className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg"
          >
            <nav className="max-w-[1920px] mx-auto px-4 py-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-text-muted hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
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