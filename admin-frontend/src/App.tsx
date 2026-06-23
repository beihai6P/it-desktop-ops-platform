import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketManagement from './pages/TicketManagement'
import DocumentManagement from './pages/DocumentManagement'
import ToolManagement from './pages/ToolManagement'
import CaseManagement from './pages/CaseManagement'
import UserManagement from './pages/UserManagement'
import RoleManagement from './pages/RoleManagement'
import ReviewManagement from './pages/ReviewManagement'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import AdminLayout from './components/AdminLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/tickets" element={
        <ProtectedRoute>
          <AdminLayout>
            <TicketManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute>
          <AdminLayout>
            <DocumentManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/tools" element={
        <ProtectedRoute>
          <AdminLayout>
            <ToolManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/cases" element={
        <ProtectedRoute>
          <AdminLayout>
            <CaseManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/roles" element={
        <ProtectedRoute>
          <AdminLayout>
            <RoleManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/review" element={
        <ProtectedRoute>
          <AdminLayout>
            <ReviewManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AdminLayout>
            <Analytics />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AdminLayout>
            <Settings />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
