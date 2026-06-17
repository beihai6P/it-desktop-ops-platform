import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import PublicHome from '@/pages/PublicHome';
import Home from '@/pages/Home';
import Diagnosis from '@/pages/Diagnosis';
import Collaboration from '@/pages/Collaboration';
import Templates from '@/pages/Templates';
import Analytics from '@/pages/Analytics';
import Sandbox from '@/pages/Sandbox';
import Community from '@/pages/Community';
import Knowledge from '@/pages/Knowledge';
import Tools from '@/pages/Tools';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import UserManagement from '@/pages/UserManagement';
import RoleManagement from '@/pages/RoleManagement';
import Review from '@/pages/Review';
import Profile from '@/pages/Profile';
import ToolDetailPage from '@/pages/ToolDetailPage';
import DocumentDetailPage from '@/pages/DocumentDetailPage';
import PostDetailPage from '@/pages/PostDetailPage';
import SessionDetailPage from '@/pages/SessionDetailPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const isAdmin = user?.isAdmin || user?.role === 'admin';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-theme-bg">
      <Header />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-theme-bg">
      <Header />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.isAdmin || user?.role === 'admin';
  
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      
      <Route path="/home" element={
        <AdminRoute>
          <AdminLayout>
            <Home />
          </AdminLayout>
        </AdminRoute>
      } />
      
      <Route path="/" element={
        isAuthenticated ? (
          <MainLayout>
            <PublicHome />
          </MainLayout>
        ) : (
          <PublicHome />
        )
      } />
      
      <Route path="/diagnosis" element={
        <ProtectedRoute>
          <MainLayout>
            <Diagnosis />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/collaboration" element={
        <ProtectedRoute>
          <MainLayout>
            <Collaboration />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/collaboration/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <SessionDetailPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/templates" element={
        <ProtectedRoute>
          <MainLayout>
            <Templates />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/community" element={
        isAuthenticated ? (
          <MainLayout>
            <Community />
          </MainLayout>
        ) : (
          <Community />
        )
      } />
      
      <Route path="/community/:id" element={
        isAuthenticated ? (
          <MainLayout>
            <PostDetailPage />
          </MainLayout>
        ) : (
          <PostDetailPage />
        )
      } />
      
      <Route path="/knowledge" element={
        isAuthenticated ? (
          <MainLayout>
            <Knowledge />
          </MainLayout>
        ) : (
          <Knowledge />
        )
      } />
      
      <Route path="/knowledge/:id" element={
        isAuthenticated ? (
          <MainLayout>
            <DocumentDetailPage />
          </MainLayout>
        ) : (
          <DocumentDetailPage />
        )
      } />
      
      <Route path="/tools" element={
        <ProtectedRoute>
          <MainLayout>
            <Tools />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tools/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ToolDetailPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/sandbox" element={
        <ProtectedRoute>
          <MainLayout>
            <Sandbox />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <AdminRoute>
          <AdminLayout>
            <Analytics />
          </AdminLayout>
        </AdminRoute>
      } />
      
      <Route path="/settings" element={
        <AdminRoute>
          <AdminLayout>
            <Settings />
          </AdminLayout>
        </AdminRoute>
      } />
      
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </AdminRoute>
      } />
      
      <Route path="/admin/roles" element={
        <AdminRoute>
          <AdminLayout>
            <RoleManagement />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/admin/review" element={
        <AdminRoute>
          <AdminLayout>
            <Review />
          </AdminLayout>
        </AdminRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout>
            <Profile />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}