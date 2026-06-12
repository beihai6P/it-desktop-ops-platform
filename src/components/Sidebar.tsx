import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Cpu, BarChart3, FlaskConical, Users, MessageSquare, BookOpen, Settings, Home, Wrench, TrendingUp, Shield, UserCog, LayoutDashboard, CheckSquare } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  isHeader?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  adminMode?: boolean;
}

const userMenuItems: MenuItem[] = [
  { id: 'home', label: '首页', icon: Home, path: '/' },
  { id: 'diagnosis', label: '故障诊断', icon: Cpu, path: '/diagnosis' },
  { id: 'tools', label: '工具分享', icon: Wrench, path: '/tools' },
  { id: 'sandbox', label: '沙盒实验室', icon: FlaskConical, path: '/sandbox' },
  { id: 'knowledge', label: '知识库', icon: BookOpen, path: '/knowledge' },
  { id: 'community', label: '社区交流', icon: MessageSquare, path: '/community' },
  { id: 'collaboration', label: '远程协作', icon: Users, path: '/collaboration' },
];

const adminMenuItems: MenuItem[] = [
  { id: 'dashboard', label: '管理后台', icon: LayoutDashboard, path: '/' },
  { id: 'analytics', label: '数据洞察', icon: BarChart3, path: '/analytics' },
  { id: 'review', label: '内容审核', icon: CheckSquare, path: '/admin/review' },
  { id: 'user-management', label: '用户管理', icon: UserCog, path: '/admin/users' },
  { id: 'role-management', label: '角色权限', icon: Shield, path: '/admin/roles' },
  { id: 'settings', label: '系统设置', icon: Settings, path: '/settings' },
];

export default function Sidebar({ isOpen, adminMode = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const isAdmin = user?.isAdmin || user?.role === 'admin';
  const showUserManagement = isAdmin || hasPermission('USER_VIEW');
  const showRoleManagement = isAdmin || hasPermission('ROLE_MANAGE');

  let allMenuItems: MenuItem[];

  if (adminMode) {
    allMenuItems = [
      ...adminMenuItems,
    ];
  } else {
    allMenuItems = [
      ...userMenuItems,
      ...(showUserManagement || showRoleManagement ? [{ id: 'admin-header', label: '管理', icon: Settings, path: '', isHeader: true }] : []),
      ...(showUserManagement ? [{ id: 'user-management', label: '用户管理', icon: UserCog, path: '/admin/users' }] : []),
      ...(showRoleManagement ? [{ id: 'role-management', label: '角色权限', icon: Shield, path: '/admin/roles' }] : []),
      ...(isAdmin ? [{ id: 'settings', label: '系统设置', icon: Settings, path: '/settings' }] : []),
    ].filter(item => item.path !== '' || item.isHeader);
  }

  if (!isOpen) {
    return (
      <aside className="w-16 bg-white/85 backdrop-blur-sm border-r border-primary/20 min-h-[calc(100vh-64px)] flex flex-col items-center py-4">
        {allMenuItems.map((item) => {
          if (item.isHeader) return null;
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all mb-2 ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-muted hover:bg-primary/10 hover:text-primary'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white/85 backdrop-blur-sm border-r border-primary/20 min-h-[calc(100vh-64px)]">
      <nav className="p-4">
        <div className="space-y-1">
          {allMenuItems.map((item) => {
            if (item.isHeader) {
              return (
                <div
                  key={item.id}
                  className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider mt-4 mb-2 border-t border-gray-200 pt-4"
                >
                  {item.label}
                </div>
              );
            }
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-text-muted hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-theme-text">社区动态</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xl font-bold text-primary">128</p>
              <p className="text-xs text-text-muted">今日发帖</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-500">2.4k</p>
              <p className="text-xs text-text-muted">活跃用户</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}