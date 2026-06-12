import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: Array<{ _id: string; name: string; code: string }>;
  isAdmin?: boolean;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  status?: string;
  permissions?: Array<{ _id: string; name: string; code: string }>;
  followers?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasRole: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      let storedToken: string | null = null;
      let storedUser: string | null = null;
      
      try {
        storedToken = localStorage.getItem('token');
        storedUser = localStorage.getItem('user');
      } catch (storageError) {
        logger.error('读取 localStorage 失败:', storageError);
      }

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // 验证token是否有效
          const response = await authAPI.getMe();
          setUser(response.data.data);
          try {
            localStorage.setItem('user', JSON.stringify(response.data.data));
          } catch (storageError) {
            logger.error('写入 localStorage 失败:', storageError);
          }
        } catch (error) {
          logger.error('Token验证失败:', error);
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch (storageError) {
            logger.error('清除 localStorage 失败:', storageError);
          }
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { token: newToken, user: userData } = response.data;
    
    try {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      logger.error('写入 localStorage 失败:', error);
    }
    
    setToken(newToken);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authAPI.register(name, email, password);
    const { token: newToken, user: userData } = response.data;
    
    try {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      logger.error('写入 localStorage 失败:', error);
    }
    
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      logger.error('清除 localStorage 失败:', error);
    }
    setToken(null);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const response = await authAPI.updateProfile(data);
    const updatedUser = response.data.data;
    setUser(updatedUser);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      logger.error('写入 localStorage 失败:', error);
    }
  };

  // 检查用户是否有特定权限
  const hasPermission = (code: string): boolean => {
    if (!user) return false;
    
    // 管理员拥有所有权限
    if (user.isAdmin || user.role === 'admin') return true;
    
    // 检查直接分配的权限
    if (user.permissions?.some(p => p.code === code)) return true;
    
    // 检查角色中的权限
    if (user.roles?.some(r => r.code === 'SUPER_ADMIN')) return true;
    
    return false;
  };

  // 检查用户是否有特定角色
  const hasRole = (code: string): boolean => {
    if (!user) return false;
    
    // 管理员拥有所有角色
    if (user.isAdmin || user.role === 'admin') return true;
    
    // 检查用户角色
    if (user.roles?.some(r => r.code === code)) return true;
    
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
