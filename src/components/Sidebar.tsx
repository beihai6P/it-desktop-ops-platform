import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, ChevronDown, LayoutDashboard, BarChart3, FileCheck, MessageSquare, Users, Shield, Settings } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarProps {
  isOpen: boolean;
  adminMode?: boolean;
  onToggle?: () => void;
}

const adminMenuItems: MenuItem[] = [
  { id: 'dashboard', label: '管理后台', path: '/home', icon: LayoutDashboard },
  { id: 'analytics', label: '数据洞察', path: '/analytics', icon: BarChart3 },
  { id: 'review', label: '内容审核', path: '/admin/review', icon: FileCheck },
  { id: 'tickets', label: '工单管理', path: '/tickets', icon: MessageSquare },
  { id: 'user-management', label: '用户管理', path: '/admin/users', icon: Users },
  { id: 'role-management', label: '角色权限', path: '/admin/roles', icon: Shield },
  { id: 'settings', label: '系统设置', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, adminMode = false, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = adminMode ? adminMenuItems : [];

  if (!isOpen) {
    return (
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="收起菜单"
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="收起菜单"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </nav>
  );
}
