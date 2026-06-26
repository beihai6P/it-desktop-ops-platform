﻿﻿﻿import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuRouteMap: Record<string, string> = {
  dashboard: '/dashboard',
  tickets: '/tickets',
  documents: '/documents',
  tools: '/tools',
  cases: '/cases',
  users: '/users',
  roles: '/roles',
  review: '/review',
  analytics: '/analytics',
  settings: '/settings',
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getActiveMenu = () => {
    for (const [menuId, route] of Object.entries(menuRouteMap)) {
      if (location.pathname === route || (route === '/dashboard' && location.pathname === '/')) {
        return menuId;
      }
    }
    return 'dashboard';
  };

  const handleMenuChange = (menuId: string) => {
    const route = menuRouteMap[menuId];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeMenu={getActiveMenu()}
        onMenuChange={handleMenuChange}
      />
      <div className="flex-1 flex flex-col transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
