import axios from 'axios';

const API_BASE_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
};

export const userAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: { name: string; email: string; password: string; role: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ name: string; email: string; role: string; status: string }>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const roleAPI = {
  getAll: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
  create: async (data: { name: string; description: string; permissions: string[] }) => {
    const response = await api.post('/roles', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ name: string; description: string; permissions: string[] }>) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
};

export const documentAPI = {
  getAll: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  create: async (data: { title: string; content: string; category: string; tags: string[] }) => {
    const response = await api.post('/documents', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ title: string; content: string; category: string; tags: string[] }>) => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

export const postAPI = {
  getAll: async () => {
    const response = await api.get('/posts');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },
};

export const analyticsAPI = {
  getDashboard: async () => {
    const response = await api.get('/analytics');
    return response.data;
  },
};

export const reviewAPI = {
  getPosts: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/review/posts${params}`);
    return response.data;
  },
  approvePost: async (id: string) => {
    const response = await api.put(`/review/posts/${id}/approve`);
    return response.data;
  },
  rejectPost: async (id: string, reason: string) => {
    const response = await api.put(`/review/posts/${id}/reject`, { reason });
    return response.data;
  },
  deletePost: async (id: string) => {
    const response = await api.delete(`/review/posts/${id}`);
    return response.data;
  },
  getComments: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/review/comments${params}`);
    return response.data;
  },
  approveComment: async (id: string) => {
    const response = await api.put(`/review/comments/${id}/approve`);
    return response.data;
  },
  rejectComment: async (id: string, reason: string) => {
    const response = await api.put(`/review/comments/${id}/reject`, { reason });
    return response.data;
  },
  deleteComment: async (id: string) => {
    const response = await api.delete(`/review/comments/${id}`);
    return response.data;
  },
};

export const settingsAPI = {
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  updateSettings: async (data: Partial<{ siteName: string; siteDescription: string; defaultLanguage: string; timezone: string }>) => {
    const response = await api.put('/settings', data);
    return response.data;
  },
  updateSecurity: async (data: Partial<{ enableTwoFactor: boolean; sessionTimeout: number; maxLoginAttempts: number }>) => {
    const response = await api.put('/settings/security', data);
    return response.data;
  },
  updateNotifications: async (data: Partial<{ enableNotifications: boolean; enableEmailNotifications: boolean; enablePushNotifications: boolean }>) => {
    const response = await api.put('/settings/notifications', data);
    return response.data;
  },
};

export default api;
