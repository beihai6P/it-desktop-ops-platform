import { apiGet, apiPost, apiPut, apiDelete } from '@/scheduler';
import { logger } from '@/scheduler';

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
    apiPost('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    apiPost('/auth/register', { name, email, password }),
  getMe: () => apiGet('/auth/me'),
  updateProfile: (data: UpdateProfileData) => apiPut('/auth/me', data),
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
    apiGet('/auth/users', params),
  getById: (id: string) => apiGet(`/auth/users/${id}`),
  update: (id: string, data: UserUpdateData) => apiPut(`/auth/users/${id}`, data),
  delete: (id: string) => apiDelete(`/auth/users/${id}`),
  create: (data: { name: string; email: string; password: string; role?: string; phone?: string; department?: string; position?: string; roles?: Array<{ _id: string; name: string; code: string }>; isAdmin?: boolean }) => apiPost('/auth/users', data),
  deleteMultiple: (ids: string[]) => apiPost('/auth/users/delete-multiple', { ids }),
  toggleStatus: (id: string, status: string) => apiPost(`/auth/users/${id}/toggle-status`, { status }),
  getStats: () => apiGet('/auth/users/stats'),
  resetPassword: (id: string, newPassword: string) => apiPost(`/auth/users/${id}/reset-password`, { newPassword }),
};

import type { Case } from '@/types';

export const caseAPI = {
  getAll: (params?: { status?: string; difficulty?: string; page?: number; limit?: number }) =>
    apiGet('/cases', params),
  getById: (id: string) => apiGet(`/cases/${id}`),
  create: (data: Omit<Case, 'id' | 'views' | 'createdAt' | 'updatedAt' | 'author' | 'authorId'>) => apiPost('/cases', data),
  update: (id: string, data: Partial<Case>) => apiPut(`/cases/${id}`, data),
  delete: (id: string) => apiDelete(`/cases/${id}`),
  like: (id: string) => apiPost(`/cases/${id}/like`),
  bookmark: (id: string) => apiPost(`/cases/${id}/bookmark`),
  toggleEssence: (id: string) => apiPost(`/cases/${id}/essence`),
  togglePin: (id: string) => apiPost(`/cases/${id}/pin`),
  getStats: () => apiGet('/cases/stats'),
};

import type { Ticket } from '@/types';

export const ticketAPI = {
  getAll: (params?: { priority?: string; status?: string; assignee?: string; creatorId?: string; page?: number; limit?: number }) =>
    apiGet('/tickets', params),
  getById: (id: string) => apiGet(`/tickets/${id}`),
  create: (data: Omit<Ticket, 'id' | 'createdAt'>) => apiPost('/tickets', data),
  update: (id: string, data: Partial<Ticket>) => apiPut(`/tickets/${id}`, data),
  delete: (id: string) => apiDelete(`/tickets/${id}`),
  assign: (id: string, assignee: string, assigneeId: string) =>
    apiPost(`/tickets/${id}/assign`, { assignee, assigneeId }),
  resolve: (id: string) => apiPost(`/tickets/${id}/resolve`),
  getStats: () => apiGet('/tickets/stats'),
};

import type { Post } from '@/types';

export const postAPI = {
  getAll: (params?: { category?: string; status?: string; authorId?: string; page?: number; limit?: number }) =>
    apiGet('/posts', params),
  getById: (id: string) => apiGet(`/posts/${id}`),
  create: (data: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt' | 'views' | 'author' | 'authorId' | 'reviewStatus' | 'reviewReason' | 'status'>) => apiPost('/posts', data),
  update: (id: string, data: Partial<Post>) => apiPut(`/posts/${id}`, data),
  delete: (id: string) => apiDelete(`/posts/${id}`),
  like: (id: string) => apiPost(`/posts/${id}/like`),
  bookmark: (id: string) => apiPost(`/posts/${id}/bookmark`),
  getHot: () => apiGet('/posts/hot'),
  getStats: () => apiGet('/posts/stats'),
};

export const reviewAPI = {
  getPendingPosts: () => apiGet('/review/pending'),
  getReviewPosts: () => apiGet('/review/review'),
  getAllPosts: (params?: { status?: string; page?: number; limit?: number }) =>
    apiGet('/review/all', params),
  reviewPost: (postId: string, action: 'approve' | 'reject' | 'pending', reason?: string) =>
    apiPost('/review/review', { postId, action, reason }),
  batchReview: (postIds: string[], action: 'approve' | 'reject', reason?: string) =>
    apiPost('/review/batch', { postIds, action, reason }),
  getStats: () => apiGet('/review/stats'),
  checkContent: (title: string, content: string) =>
    apiPost('/review/check', { title, content }),
};

export const commentAPI = {
  getAll: (params?: { postId?: string; page?: number; limit?: number }) =>
    apiGet('/comments', params),
  getById: (id: string) => apiGet(`/comments/${id}`),
  create: (postId: string, content: string) =>
    apiPost('/comments', { postId, content }),
  update: (id: string, content: string) =>
    apiPut(`/comments/${id}`, { content }),
  delete: (id: string) => apiDelete(`/comments/${id}`),
  like: (id: string) => apiPost(`/comments/${id}/like`),
  reply: (id: string, content: string) =>
    apiPost(`/comments/${id}/reply`, { content }),
};

import type { Document } from '@/types';

export const documentAPI = {
  getAll: (params?: { category?: string; type?: string; status?: string; authorId?: string; page?: number; limit?: number }) =>
    apiGet('/documents', params),
  getById: (id: string) => apiGet(`/documents/${id}`),
  create: (data: Omit<Document, 'id' | 'views' | 'downloads' | 'favorites' | 'createdAt' | 'updatedAt' | 'author' | 'authorId'>) => apiPost('/documents', data),
  update: (id: string, data: Partial<Document>) => apiPut(`/documents/${id}`, data),
  delete: (id: string) => apiDelete(`/documents/${id}`),
  download: (id: string) => apiPost(`/documents/${id}/download`),
  favorite: (id: string) => apiPost(`/documents/${id}/favorite`),
  getStats: () => apiGet('/documents/stats'),
};

import type { Tool } from '@/types';

export const toolAPI = {
  getAll: (params?: { category?: string; type?: string; authorId?: string; page?: number; limit?: number }) =>
    apiGet('/tools', params),
  getById: (id: string) => apiGet(`/tools/${id}`),
  create: (data: Omit<Tool, 'id' | 'downloads' | 'views' | 'stars' | 'createdAt' | 'updatedAt' | 'author' | 'authorId' | 'comments'>) => apiPost('/tools', data),
  update: (id: string, data: Partial<Tool>) => apiPut(`/tools/${id}`, data),
  delete: (id: string) => apiDelete(`/tools/${id}`),
  download: (id: string) => apiPost(`/tools/${id}/download`),
  comment: (id: string, content: string, rating?: number) =>
    apiPost(`/tools/${id}/comment`, { content, rating }),
  reply: (id: string, commentId: string, content: string) =>
    apiPost(`/tools/${id}/comment/${commentId}/reply`, { content }),
  verify: (id: string) => apiPost(`/tools/${id}/verify`),
  feature: (id: string) => apiPost(`/tools/${id}/feature`),
  getStats: () => apiGet('/tools/stats'),
};

export const storageAPI = {
  upload: (data: FormData) => apiPost('/storage/upload', data, { skipContentType: true }),
  download: (fileId: string) => apiGet(`/storage/download/${fileId}`),
  info: (fileId: string) => apiGet(`/storage/info/${fileId}`),
};

import type { Session } from '@/types';

export const sessionAPI = {
  getAll: (params?: { status?: string; type?: string; page?: number; limit?: number }) =>
    apiGet('/sessions', params),
  getById: (id: string) => apiGet(`/sessions/${id}`),
  create: (data: Omit<Session, 'id' | 'participants' | 'startTime'>) => apiPost('/sessions', data),
  update: (id: string, data: Partial<Session>) => apiPut(`/sessions/${id}`, data),
  delete: (id: string) => apiDelete(`/sessions/${id}`),
  addParticipant: (id: string, participantData: { userId: string; role: string }) =>
    apiPost(`/sessions/${id}/participants`, participantData),
  removeParticipant: (id: string, participantId: string) =>
    apiDelete(`/sessions/${id}/participants/${participantId}`),
  start: (id: string) => apiPost(`/sessions/${id}/start`),
  end: (id: string) => apiPost(`/sessions/${id}/end`),
  getStats: () => apiGet('/sessions/stats'),
};

import type { Template } from '@/types';

export const templateAPI = {
  getAll: (params?: { category?: string; status?: string; page?: number; limit?: number }) =>
    apiGet('/templates', params),
  getById: (id: string) => apiGet(`/templates/${id}`),
  create: (data: Omit<Template, 'id' | 'downloads' | 'rating' | 'updatedAt'>) => apiPost('/templates', data),
  update: (id: string, data: Partial<Template>) => apiPut(`/templates/${id}`, data),
  delete: (id: string) => apiDelete(`/templates/${id}`),
  download: (id: string) => apiPost(`/templates/${id}/download`),
  verify: (id: string) => apiPost(`/templates/${id}/verify`),
};

import type { FaultType, Experiment } from '@/types';

export const faultTypeAPI = {
  getAll: () => apiGet('/fault-types'),
  getById: (id: string) => apiGet(`/fault-types/${id}`),
  create: (data: Omit<FaultType, 'id'>) => apiPost('/fault-types', data),
  update: (id: string, data: Partial<FaultType>) => apiPut(`/fault-types/${id}`, data),
  delete: (id: string) => apiDelete(`/fault-types/${id}`),
};

export const experimentAPI = {
  getAll: () => apiGet('/experiments'),
  getById: (id: string) => apiGet(`/experiments/${id}`),
  create: (data: Omit<Experiment, 'id'>) => apiPost('/experiments', data),
  update: (id: string, data: Partial<Experiment>) => apiPut(`/experiments/${id}`, data),
  delete: (id: string) => apiDelete(`/experiments/${id}`),
  run: (faultType: string, faultTypeId: string) => apiPost('/experiments/run', { faultType, faultTypeId }),
  complete: (id: string) => apiPost(`/experiments/${id}/complete`),
};

import type { SystemSettings, NotificationSettings, SecuritySettings, AppearanceSettings, DataRetentionSettings, IntegrationSettings, AISettings } from '@/types';

export const settingsAPI = {
  get: () => apiGet('/settings'),
  update: (data: Partial<SystemSettings>) => apiPut('/settings', data),
  updateNotifications: (data: Partial<NotificationSettings>) => apiPut('/settings/notifications', data),
  updateSecurity: (data: Partial<SecuritySettings>) => apiPut('/settings/security', data),
  updateAppearance: (data: Partial<AppearanceSettings>) => apiPut('/settings/appearance', data),
  updateDataRetention: (data: Partial<DataRetentionSettings>) => apiPut('/settings/data-retention', data),
  updateIntegrations: (data: Partial<IntegrationSettings>) => apiPut('/settings/integrations', data),
  updateAISettings: (data: Partial<AISettings>) => apiPut('/settings/ai-settings', data),
};

export const roleAPI = {
  getRoles: () => apiGet('/roles'),
  getRoleById: (id: string) => apiGet(`/roles/${id}`),
  createRole: (data: { name: string; code: string; description?: string; level?: number; permissions?: string[] }) => apiPost('/roles', data),
  updateRole: (id: string, data: { name?: string; description?: string; permissions?: string[]; isActive?: boolean }) => apiPut(`/roles/${id}`, data),
  deleteRole: (id: string) => apiDelete(`/roles/${id}`),
  getPermissions: () => apiGet('/permissions'),
  getPermissionById: (id: string) => apiGet(`/permissions/${id}`),
  createPermission: (data: { name: string; code: string; description?: string; category?: string }) => apiPost('/permissions', data),
  updatePermission: (id: string, data: { name?: string; code?: string; description?: string; category?: string }) => apiPut(`/permissions/${id}`, data),
  deletePermission: (id: string) => apiDelete(`/permissions/${id}`),
  initDefaults: () => apiPost('/roles/init-defaults'),
};

import type { DiagnosisRequest } from '@/types';

export const notificationAPI = {
  getAll: (params?: { page?: number; limit?: number; type?: string; priority?: string }) =>
    apiGet('/notifications', params),
  
  getUnreadCount: () => apiGet('/notifications/unread-count'),
  
  getById: (id: string) => apiGet(`/notifications/${id}`),
  
  markAsRead: (notificationId?: string) => 
    apiPost('/notifications/read', notificationId ? { notificationId } : {}),
  
  delete: (id: string) => apiDelete(`/notifications/${id}`),
  
  deleteAll: () => apiDelete('/notifications'),
  
  create: (data: { 
    userId: string; 
    type?: string; 
    title: string; 
    message: string; 
    link?: string; 
    priority?: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }) => apiPost('/notifications', data),
  
  broadcast: (data: {
    type?: string;
    title: string;
    message: string;
    link?: string;
    priority?: string;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
    userIds: string[];
  }) => apiPost('/notifications/broadcast', data),
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
      id: string;
      title: string;
      description: string;
      category: string;
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
  diagnose: (data: DiagnosisRequest) => apiPost('/ai/diagnose', data),
  getSymptoms: (params?: { query?: string; limit?: number }) => apiGet('/ai/symptoms', params),
  
  smartQA: (data: { question: string; useLocalOnly?: boolean; topK?: number }) => apiPost('/ai/qa', data),
  
  qa: (data: { question: string; topK?: number }) => apiPost('/ai/knowledge/qa', data),
  searchDocuments: (data: { query: string; filters?: { category?: string; type?: string }; topK?: number }) => apiPost('/ai/knowledge/search', data),
  summarizeDocument: (data: { documentId: string; length?: 'short' | 'medium' | 'long' }) => apiPost('/ai/knowledge/summarize', data),
  
  analyzeExperiment: (data: { experimentId: string; faultType: string; logs?: Array<{ timestamp: string; level: string; message: string }>; metrics?: { responseTime?: number; successRate?: number; errorCount?: number } }) => 
    apiPost('/ai/experiment/analyze', data),
  compareExperiments: (data: { experimentIds: string[]; comparisonType?: string }) => 
    apiPost('/ai/experiment/compare', data),
};

export { apiGet, apiPost, apiPut, apiDelete, logger };
