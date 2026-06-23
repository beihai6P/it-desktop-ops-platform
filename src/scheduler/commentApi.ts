import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type { ApiResponse, Comment, CommentListResponse } from './types';

export interface CreateCommentData {
  postId?: string;
  toolId?: string;
  content: string;
  rating?: number;
}

export interface CreateReplyData {
  content: string;
}

/**
 * 评论API服务
 * 集成到统一API调度层
 */
export const commentApi = {
  /**
   * 获取评论列表
   * @param postId 可选的帖子ID筛选
   * @param page 页码
   * @param limit 每页数量
   */
  async getComments(postId?: string, toolId?: string, page: number = 1, limit: number = 20): Promise<ApiResponse<CommentListResponse>> {
    const params: Record<string, string | number | boolean> = { page, limit };
    if (postId) {
      params.postId = postId;
    }
    if (toolId) {
      params.toolId = toolId;
    }
    const result = await apiGet('/comments', params);
    return result as ApiResponse<CommentListResponse>;
  },

  /**
   * 获取单个评论
   * @param commentId 评论ID
   * @param toolId 可选的工具ID
   */
  async getComment(commentId: string, toolId?: string): Promise<ApiResponse<Comment>> {
    const params: Record<string, string> = {};
    if (toolId) {
      params.toolId = toolId;
    }
    const result = await apiGet(`/comments/${commentId}`, params);
    return result as ApiResponse<Comment>;
  },

  /**
   * 创建评论
   * @param data 包含postId和content
   */
  async createComment(data: CreateCommentData): Promise<ApiResponse<Comment>> {
    const result = await apiPost('/comments', data as unknown as Record<string, unknown>);
    return result as ApiResponse<Comment>;
  },

  /**
   * 更新评论
   * @param commentId 评论ID
   * @param content 新的评论内容
   * @param toolId 可选的工具ID
   */
  async updateComment(commentId: string, content: string, toolId?: string): Promise<ApiResponse<Comment>> {
    const params: Record<string, string> = {};
    if (toolId) {
      params.toolId = toolId;
    }
    const result = await apiPut(`/comments/${commentId}`, { content }, params);
    return result as ApiResponse<Comment>;
  },

  /**
   * 删除评论
   * @param commentId 评论ID
   * @param toolId 可选的工具ID
   */
  async deleteComment(commentId: string, toolId?: string): Promise<ApiResponse<{ message: string }>> {
    const params: Record<string, string> = {};
    if (toolId) {
      params.toolId = toolId;
    }
    const result = await apiDelete(`/comments/${commentId}`, params);
    return result as ApiResponse<{ message: string }>;
  },

  /**
   * 点赞评论
   * @param commentId 评论ID
   * @param toolId 可选的工具ID
   */
  async likeComment(commentId: string, toolId?: string): Promise<ApiResponse<Comment>> {
    const params: Record<string, string> = {};
    if (toolId) {
      params.toolId = toolId;
    }
    const result = await apiPost(`/comments/${commentId}/like`, {}, params);
    return result as ApiResponse<Comment>;
  },

  /**
   * 添加回复
   * @param commentId 所属评论ID
   * @param data 回复内容
   * @param toolId 可选的工具ID
   */
  async addReply(commentId: string, data: CreateReplyData, toolId?: string): Promise<ApiResponse<Comment>> {
    const params: Record<string, string> = {};
    if (toolId) {
      params.toolId = toolId;
    }
    const result = await apiPost(`/comments/${commentId}/reply`, data as unknown as Record<string, unknown>, params);
    return result as ApiResponse<Comment>;
  },

  /**
   * 批量获取帖子的评论数
   * @param postIds 帖子ID数组
   */
  async getCommentCounts(postIds: string[]): Promise<ApiResponse<Record<string, number>>> {
    const params: Record<string, string> = { ids: postIds.join(',') };
    const result = await apiGet('/comments/counts', params);
    return result as ApiResponse<Record<string, number>>;
  }
};

export default commentApi;