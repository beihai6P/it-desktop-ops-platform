import axios from 'axios';
import { logger } from '@/lib/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error('读取 localStorage 失败:', error);
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
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (storageError) {
        logger.error('清除 localStorage 失败:', storageError);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
}

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: UpdateProfileData) => api.put('/auth/me', data),
};

interface UserUpdateData {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  phone?: string;
  department?: string;
  position?: string;
  roles?: Array<{ _id: string; name: string; code: string }>;
  isAdmin?: boolean;
}

export const userAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; role?: string }) =>
    api.get('/auth/users', { params }),
  getById: (id: string) => api.get(`/auth/users/${id}`),
  update: (id: string, data: UserUpdateData) => api.put(`/auth/users/${id}`, data),
  delete: (id: string) => api.delete(`/auth/users/${id}`),
  create: (data: { name: string; email: string; password: string; role?: string; phone?: string; department?: string; position?: string; roles?: Array<{ _id: string; name: string; code: string }>; isAdmin?: boolean }) => api.post('/auth/users', data),
  deleteMultiple: (ids: string[]) => api.post('/auth/users/delete-multiple', { ids }),
  toggleStatus: (id: string, status: string) => api.post(`/auth/users/${id}/toggle-status`, { status }),
  getStats: () => api.get('/auth/users/stats'),
  resetPassword: (id: string, newPassword: string) => api.post(`/auth/users/${id}/reset-password`, { newPassword }),
};

import type { Case } from '@/types';

export const caseAPI = {
  getAll: (params?: { status?: string; difficulty?: string; page?: number; limit?: number }) =>
    api.get('/cases', { params }),
  getById: (id: string) => api.get(`/cases/${id}`),
  create: (data: Omit<Case, 'id' | 'views' | 'createdAt' | 'updatedAt' | 'author' | 'authorId'>) => api.post('/cases', data),
  update: (id: string, data: Partial<Case>) => api.put(`/cases/${id}`, data),
  delete: (id: string) => api.delete(`/cases/${id}`),
  like: (id: string) => api.post(`/cases/${id}/like`),
  bookmark: (id: string) => api.post(`/cases/${id}/bookmark`),
  getStats: () => api.get('/cases/stats'),
};

import type { Ticket } from '@/types';

export const ticketAPI = {
  getAll: (params?: { priority?: string; status?: string; assignee?: string; creatorId?: string; page?: number; limit?: number }) =>
    api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (data: Omit<Ticket, 'id' | 'createdAt'>) => api.post('/tickets', data),
  update: (id: string, data: Partial<Ticket>) => api.put(`/tickets/${id}`, data),
  delete: (id: string) => api.delete(`/tickets/${id}`),
  assign: (id: string, assignee: string, assigneeId: string) =>
    api.post(`/tickets/${id}/assign`, { assignee, assigneeId }),
  resolve: (id: string) => api.post(`/tickets/${id}/resolve`),
  getStats: () => api.get('/tickets/stats'),
};

import type { Post, ReviewStats, ContentCheckResult } from '@/types';

export const postAPI = {
  getAll: (params?: { category?: string; status?: string; authorId?: string; page?: number; limit?: number }) =>
    api.get('/posts', { params }),
  getById: (id: string) => api.get(`/posts/${id}`),
  create: (data: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt' | 'views' | 'author' | 'authorId' | 'reviewStatus' | 'reviewReason' | 'status'>) => api.post('/posts', data),
  update: (id: string, data: Partial<Post>) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  like: (id: string) => api.post(`/posts/${id}/like`),
  bookmark: (id: string) => api.post(`/posts/${id}/bookmark`),
  getHot: () => api.get('/posts/hot'),
  getStats: () => api.get('/posts/stats'),
};

export const reviewAPI = {
  getPendingPosts: () => api.get('/review/pending'),
  getReviewPosts: () => api.get('/review/review'),
  getAllPosts: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/review/all', { params }),
  reviewPost: (postId: string, action: 'approve' | 'reject' | 'pending', reason?: string) =>
    api.post('/review/review', { postId, action, reason }),
  batchReview: (postIds: string[], action: 'approve' | 'reject', reason?: string) =>
    api.post('/review/batch', { postIds, action, reason }),
  getStats: () => api.get<ReviewStats>('/review/stats'),
  checkContent: (title: string, content: string) =>
    api.post<ContentCheckResult>('/review/check', { title, content }),
};

export const commentAPI = {
  getAll: (params?: { postId?: string; page?: number; limit?: number }) =>
    api.get('/comments', { params }),
  getById: (id: string) => api.get(`/comments/${id}`),
  create: (postId: string, content: string) =>
    api.post('/comments', { postId, content }),
  update: (id: string, content: string) =>
    api.put(`/comments/${id}`, { content }),
  delete: (id: string) => api.delete(`/comments/${id}`),
  like: (id: string) => api.post(`/comments/${id}/like`),
  reply: (id: string, content: string) =>
    api.post(`/comments/${id}/reply`, { content }),
};

import type { Document } from '@/types';

export const documentAPI = {
  getAll: (params?: { category?: string; type?: string; status?: string; authorId?: string; page?: number; limit?: number }) =>
    api.get('/documents', { params }),
  getById: (id: string) => api.get(`/documents/${id}`),
  create: (data: Omit<Document, 'id' | 'views' | 'downloads' | 'favorites' | 'createdAt' | 'updatedAt' | 'author' | 'authorId'>) => api.post('/documents', data),
  update: (id: string, data: Partial<Document>) => api.put(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  download: (id: string) => api.post(`/documents/${id}/download`),
  favorite: (id: string) => api.post(`/documents/${id}/favorite`),
  getStats: () => api.get('/documents/stats'),
};

import type { Tool } from '@/types';

export const toolAPI = {
  getAll: (params?: { category?: string; type?: string; authorId?: string; page?: number; limit?: number }) =>
    api.get('/tools', { params }),
  getById: (id: string) => api.get(`/tools/${id}`),
  create: (data: Omit<Tool, 'id' | 'downloads' | 'views' | 'stars' | 'createdAt' | 'updatedAt' | 'author' | 'authorId' | 'comments'>) => api.post('/tools', data),
  update: (id: string, data: Partial<Tool>) => api.put(`/tools/${id}`, data),
  delete: (id: string) => api.delete(`/tools/${id}`),
  download: (id: string) => api.post(`/tools/${id}/download`),
  comment: (id: string, content: string, rating?: number) =>
    api.post(`/tools/${id}/comment`, { content, rating }),
  reply: (id: string, commentId: string, content: string) =>
    api.post(`/tools/${id}/comment/reply`, { commentId, content }),
  verify: (id: string) => api.post(`/tools/${id}/verify`),
  feature: (id: string) => api.post(`/tools/${id}/feature`),
  getStats: () => api.get('/tools/stats'),
};

export const storageAPI = {
  upload: (data: FormData) => api.post('/storage/upload', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  download: (fileId: string) => api.get(`/storage/download/${fileId}`),
  info: (fileId: string) => api.get(`/storage/info/${fileId}`),
};

import type { Session } from '@/types';

export const sessionAPI = {
  getAll: (params?: { status?: string; type?: string; page?: number; limit?: number }) =>
    api.get('/sessions', { params }),
  getById: (id: string) => api.get(`/sessions/${id}`),
  create: (data: Omit<Session, 'id' | 'participants' | 'startTime'>) => api.post('/sessions', data),
  update: (id: string, data: Partial<Session>) => api.put(`/sessions/${id}`, data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
  addParticipant: (id: string, participantData: { userId: string; role: string }) =>
    api.post(`/sessions/${id}/participants`, participantData),
  removeParticipant: (id: string, participantId: string) =>
    api.delete(`/sessions/${id}/participants`, { data: { participantId } }),
  start: (id: string) => api.post(`/sessions/${id}/start`),
  end: (id: string) => api.post(`/sessions/${id}/end`),
  getStats: () => api.get('/sessions/stats'),
};

import type { Template } from '@/types';

export const templateAPI = {
  getAll: (params?: { category?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/templates', { params }),
  getById: (id: string) => api.get(`/templates/${id}`),
  create: (data: Omit<Template, 'id' | 'downloads' | 'rating' | 'updatedAt'>) => api.post('/templates', data),
  update: (id: string, data: Partial<Template>) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  download: (id: string) => api.post(`/templates/${id}/download`),
  verify: (id: string) => api.post(`/templates/${id}/verify`),
};

import type { FaultType, Experiment } from '@/types';

export const faultTypeAPI = {
  getAll: () => api.get('/fault-types'),
  getById: (id: string) => api.get(`/fault-types/${id}`),
  create: (data: Omit<FaultType, 'id'>) => api.post('/fault-types', data),
  update: (id: string, data: Partial<FaultType>) => api.put(`/fault-types/${id}`, data),
  delete: (id: string) => api.delete(`/fault-types/${id}`),
};

export const experimentAPI = {
  getAll: () => api.get('/experiments'),
  getById: (id: string) => api.get(`/experiments/${id}`),
  create: (data: Omit<Experiment, 'id'>) => api.post('/experiments', data),
  update: (id: string, data: Partial<Experiment>) => api.put(`/experiments/${id}`, data),
  delete: (id: string) => api.delete(`/experiments/${id}`),
  run: (faultType: string, faultTypeId: string) => api.post('/experiments/run', { faultType, faultTypeId }),
  complete: (id: string) => api.post(`/experiments/${id}/complete`),
};

import type { SystemSettings, NotificationSettings, SecuritySettings, AppearanceSettings, DataRetentionSettings, IntegrationSettings, AISettings } from '@/types';

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: Partial<SystemSettings>) => api.put('/settings', data),
  updateNotifications: (data: Partial<NotificationSettings>) => api.put('/settings/notifications', data),
  updateSecurity: (data: Partial<SecuritySettings>) => api.put('/settings/security', data),
  updateAppearance: (data: Partial<AppearanceSettings>) => api.put('/settings/appearance', data),
  updateDataRetention: (data: Partial<DataRetentionSettings>) => api.put('/settings/data-retention', data),
  updateIntegrations: (data: Partial<IntegrationSettings>) => api.put('/settings/integrations', data),
  updateAISettings: (data: Partial<AISettings>) => api.put('/settings/ai-settings', data),
};

export const roleAPI = {
  getRoles: () => api.get('/roles'),
  getRoleById: (id: string) => api.get(`/roles/${id}`),
  createRole: (data: { name: string; code: string; description?: string; level?: number; permissions?: string[] }) => api.post('/roles', data),
  updateRole: (id: string, data: { name?: string; description?: string; permissions?: string[]; isActive?: boolean }) => api.put(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  getPermissions: () => api.get('/permissions'),
  getPermissionById: (id: string) => api.get(`/permissions/${id}`),
  createPermission: (data: { name: string; code: string; description?: string; category?: string }) => api.post('/permissions', data),
  updatePermission: (id: string, data: { name?: string; code?: string; description?: string; category?: string }) => api.put(`/permissions/${id}`, data),
  deletePermission: (id: string) => api.delete(`/permissions/${id}`),
  initDefaults: () => api.post('/roles/init-defaults'),
};

import type { DiagnosisRequest, DiagnosisResult, Symptom, QAResult, KnowledgeSearchResult, DocumentSummary, ExperimentAnalysisResult, ExperimentComparisonResult, Notification, NotificationStats } from '@/types';

export const notificationAPI = {
  getAll: (params?: { page?: number; limit?: number; type?: string; priority?: string }) =>
    api.get('/notifications', { params }),
  
  getUnreadCount: () => api.get<{ success: boolean; data: NotificationStats }>('/notifications/unread-count'),
  
  getById: (id: string) => api.get<{ success: boolean; data: Notification }>(`/notifications/${id}`),
  
  markAsRead: (notificationId?: string) => 
    api.post('/notifications/read', notificationId ? { notificationId } : {}),
  
  delete: (id: string) => api.delete(`/notifications/${id}`),
  
  deleteAll: () => api.delete('/notifications'),
  
  create: (data: { 
    userId: string; 
    type?: string; 
    title: string; 
    message: string; 
    link?: string; 
    priority?: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }) => api.post('/notifications', data),
  
  broadcast: (data: {
    type?: string;
    title: string;
    message: string;
    link?: string;
    priority?: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
    userIds: string[];
  }) => api.post('/notifications/broadcast', data),
};

export interface SmartQAResult {
  question: string;
  answer: string;
  confidence: number;
  dataSource: 'local' | 'network';
  localResults: {
    cases: Array<{
      type: string;
      id: string;
      title: string;
      description: string;
      symptoms: string[];
      tags: string[];
      category: string;
      status: string;
      author: string;
      createdAt: string;
    }>;
    documents: Array<{
      type: string;
      id: string;
      title: string;
      description: string;
      category: string;
      type: string;
      tags: string[];
      createdAt: string;
    }>;
  };
  sources: Array<{
    id: string;
    title: string;
    type: string;
    relevance: number;
  }>;
  hasLocalData: boolean;
}

export const aiAPI = {
  // 智能诊断助手
  diagnose: (data: DiagnosisRequest) => api.post<{ success: boolean; data: DiagnosisResult }>('/ai/diagnose', data),
  getSymptoms: (params?: { query?: string; limit?: number }) => api.get<{ success: boolean; data: { symptoms: Symptom[] } }>('/ai/symptoms', { params }),
  
  // 智能问答（本地知识库优先，支持联网回退）
  smartQA: (data: { question: string; useLocalOnly?: boolean; topK?: number }) => api.post<{ success: boolean; data: SmartQAResult }>('/ai/qa', data),
  
  // 知识库AI助手
  qa: (data: { question: string; topK?: number }) => api.post<{ success: boolean; data: QAResult }>('/ai/knowledge/qa', data),
  searchDocuments: (data: { query: string; filters?: { category?: string; type?: string }; topK?: number }) => api.post<{ success: boolean; data: KnowledgeSearchResult }>('/ai/knowledge/search', data),
  summarizeDocument: (data: { documentId: string; length?: 'short' | 'medium' | 'long' }) => api.post<{ success: boolean; data: DocumentSummary }>('/ai/knowledge/summarize', data),
  
  // 沙盒实验室AI分析
  analyzeExperiment: (data: { experimentId: string; faultType: string; logs?: Array<{ timestamp: string; level: string; message: string }>; metrics?: { responseTime?: number; successRate?: number; errorCount?: number } }) => 
    api.post<{ success: boolean; data: ExperimentAnalysisResult }>('/ai/experiment/analyze', data),
  compareExperiments: (data: { experimentIds: string[]; comparisonType?: string }) => 
    api.post<{ success: boolean; data: ExperimentComparisonResult }>('/ai/experiment/compare', data),
};

export default api;