import { apiGet, apiPost, apiPut, apiDelete } from '@scheduler';

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiPost('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    await apiPost('/auth/logout');
  },
};

export const userAPI = {
  getAll: async () => {
    const response = await apiGet('/users');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/users/' + id);
    return response.data;
  },
  create: async (data: { name: string; email: string; password: string; role: string }) => {
    const response = await apiPost('/users', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ name: string; email: string; role: string; status: string }>) => {
    const response = await apiPut('/users/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/users/' + id);
    return response.data;
  },
};

export const roleAPI = {
  getAll: async () => {
    const response = await apiGet('/roles');
    return response.data;
  },
  create: async (data: { name: string; description: string; permissions: string[] }) => {
    const response = await apiPost('/roles', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ name: string; description: string; permissions: string[] }>) => {
    const response = await apiPut('/roles/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/roles/' + id);
    return response.data;
  },
};

export const documentAPI = {
  getAll: async () => {
    const response = await apiGet('/documents');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/documents/' + id);
    return response.data;
  },
  create: async (data: { title: string; content: string; category: string; tags: string[] }) => {
    const response = await apiPost('/documents', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ title: string; content: string; category: string; tags: string[] }>) => {
    const response = await apiPut('/documents/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/documents/' + id);
    return response.data;
  },
};

export const postAPI = {
  getAll: async () => {
    const response = await apiGet('/posts');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/posts/' + id);
    return response.data;
  },
};

export const analyticsAPI = {
  getDashboard: async () => {
    const response = await apiGet('/analytics');
    return response.data;
  },
};

export const reviewAPI = {
  getPosts: async (status?: string) => {
    const params = status ? { status } : undefined;
    const response = await apiGet('/review/posts', params);
    return response.data;
  },
  approvePost: async (id: string) => {
    const response = await apiPut('/review/posts/' + id + '/approve');
    return response.data;
  },
  rejectPost: async (id: string, reason: string) => {
    const response = await apiPut('/review/posts/' + id + '/reject', { reason });
    return response.data;
  },
  deletePost: async (id: string) => {
    const response = await apiDelete('/review/posts/' + id);
    return response.data;
  },
  getComments: async (status?: string) => {
    const params = status ? { status } : undefined;
    const response = await apiGet('/review/comments', params);
    return response.data;
  },
  approveComment: async (id: string) => {
    const response = await apiPut('/review/comments/' + id + '/approve');
    return response.data;
  },
  rejectComment: async (id: string, reason: string) => {
    const response = await apiPut('/review/comments/' + id + '/reject', { reason });
    return response.data;
  },
  deleteComment: async (id: string) => {
    const response = await apiDelete('/review/comments/' + id);
    return response.data;
  },
};

export const settingsAPI = {
  getSettings: async () => {
    const response = await apiGet('/settings');
    return response.data;
  },
  updateSettings: async (data: Partial<{ siteName: string; siteDescription: string; defaultLanguage: string; timezone: string }>) => {
    const response = await apiPut('/settings', data);
    return response.data;
  },
  updateSecurity: async (data: Partial<{ enableTwoFactor: boolean; sessionTimeout: number; maxLoginAttempts: number }>) => {
    const response = await apiPut('/settings/security', data);
    return response.data;
  },
  updateNotifications: async (data: Partial<{ enableNotifications: boolean; enableEmailNotifications: boolean; enablePushNotifications: boolean }>) => {
    const response = await apiPut('/settings/notifications', data);
    return response.data;
  },
};

export { apiGet, apiPost, apiPut, apiDelete };
