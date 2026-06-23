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

export const ticketAPI = {
  getAll: async (params?: { status?: string; priority?: string; assignee?: string }) => {
    const response = await apiGet('/tickets', params);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/tickets/' + id);
    return response.data;
  },
  create: async (data: { title: string; description: string; priority: string; category: string }) => {
    const response = await apiPost('/tickets', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ title: string; description: string; status: string; priority: string; assignee: string; category: string }>) => {
    const response = await apiPut('/tickets/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/tickets/' + id);
    return response.data;
  },
  assign: async (id: string, assignee: string) => {
    const response = await apiPost('/tickets/' + id + '/assign', { assignee });
    return response.data;
  },
  resolve: async (id: string) => {
    const response = await apiPost('/tickets/' + id + '/resolve');
    return response.data;
  },
  getStats: async () => {
    const response = await apiGet('/tickets/stats');
    return response.data;
  },
};

export const documentAPI = {
  getAll: async (params?: { category?: string; status?: string; search?: string }) => {
    const response = await apiGet('/documents', params);
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
  update: async (id: string, data: Partial<{ title: string; content: string; category: string; tags: string[]; status: string }>) => {
    const response = await apiPut('/documents/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/documents/' + id);
    return response.data;
  },
  publish: async (id: string) => {
    const response = await apiPost('/documents/' + id + '/publish');
    return response.data;
  },
  unpublish: async (id: string) => {
    const response = await apiPost('/documents/' + id + '/unpublish');
    return response.data;
  },
};

export const toolAPI = {
  getAll: async (params?: { category?: string; status?: string }) => {
    const response = await apiGet('/tools', params);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/tools/' + id);
    return response.data;
  },
  create: async (data: { name: string; description: string; category: string; tags: string[]; downloadUrl: string }) => {
    const response = await apiPost('/tools', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ name: string; description: string; category: string; tags: string[]; status: string }>) => {
    const response = await apiPut('/tools/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/tools/' + id);
    return response.data;
  },
  verify: async (id: string) => {
    const response = await apiPost('/tools/' + id + '/verify');
    return response.data;
  },
  feature: async (id: string) => {
    const response = await apiPost('/tools/' + id + '/feature');
    return response.data;
  },
};

export const caseAPI = {
  getAll: async (params?: { category?: string; status?: string }) => {
    const response = await apiGet('/cases', params);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/cases/' + id);
    return response.data;
  },
  create: async (data: { title: string; description: string; category: string; severity: string; symptoms: string[] }) => {
    const response = await apiPost('/cases', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ title: string; description: string; category: string; status: string; severity: string }>) => {
    const response = await apiPut('/cases/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/cases/' + id);
    return response.data;
  },
  verify: async (id: string) => {
    const response = await apiPost('/cases/' + id + '/verify');
    return response.data;
  },
  getStats: async () => {
    const response = await apiGet('/cases/stats');
    return response.data;
  },
};

export const notificationAPI = {
  getAll: async (params?: { type?: string; status?: string }) => {
    const response = await apiGet('/notifications', params);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/notifications/' + id);
    return response.data;
  },
  create: async (data: { title: string; message: string; type: string; priority: string; userIds?: string[] }) => {
    const response = await apiPost('/notifications', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{ title: string; message: string; status: string }>) => {
    const response = await apiPut('/notifications/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/notifications/' + id);
    return response.data;
  },
  broadcast: async (data: { title: string; message: string; type: string; priority: string }) => {
    const response = await apiPost('/notifications/broadcast', data);
    return response.data;
  },
  getStats: async () => {
    const response = await apiGet('/notifications/stats');
    return response.data;
  },
};

export const postAPI = {
  getAll: async (params?: { category?: string; status?: string }) => {
    const response = await apiGet('/posts', params);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiGet('/posts/' + id);
    return response.data;
  },
  update: async (id: string, data: Partial<{ title: string; content: string; status: string; category: string }>) => {
    const response = await apiPut('/posts/' + id, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiDelete('/posts/' + id);
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
  updateAISettings: async (data: Partial<{ enabled: boolean; provider: string; apiKey: string; apiUrl: string; model: string; maxTokens: number; temperature: number; timeout: number }>) => {
    const response = await apiPut('/settings/ai-settings', data);
    return response.data;
  },
  updateDataRetention: async (data: Partial<{ logRetentionDays: number; backupFrequency: string; autoCleanupEnabled: boolean; cleanupIntervalDays: number; maxStorageMB: number }>) => {
    const response = await apiPut('/settings/data-retention', data);
    return response.data;
  },
};

export { apiGet, apiPost, apiPut, apiDelete };
