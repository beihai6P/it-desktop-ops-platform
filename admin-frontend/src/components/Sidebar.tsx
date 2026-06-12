import { LayoutDashboard, Users, Shield, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: '仪表台', icon: LayoutDashboard },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'roles', label: '角色权限', icon: Shield },
  { id: 'review', label: '内容审核', icon: FileCheck },
  { id: 'analytics', label: '数据洞察', icon: BarChart3 },
  { id: 'settings', label: '系统设置', icon: Settings },
];

export default function Sidebar({ isOpen, onToggle, activeMenu, onMenuChange }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-theme-text">管理后台</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500'
                  : 'text-text-muted hover:bg-gray-50 hover:text-theme-text'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:bg-red-50 hover:text-red-500 transition-all`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="font-medium">退出登录</span>}
        </button>
      </div>
    </aside>
  );
}
