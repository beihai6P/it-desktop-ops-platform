import { useState, useEffect, useCallback } from 'react';
import { Star, Send, MessageCircle, ThumbsUp, Reply, Loader2, Trash2, Edit2 } from 'lucide-react';
import type { ToolComment } from '@/types';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredToast from './LoginRequiredToast';
import { commentApi } from '@/scheduler';

interface CommentSectionProps {
  comments: ToolComment[];
  toolId?: string;
  postId?: string;
}

interface ApiComment {
  id: string;
  postId?: string;
  author?: string;
  authorId?: string;
  userId?: string;
  userName?: string;
  content: string;
  rating?: number;
  likes: number;
  createdAt: string;
  replies: {
    id: string;
    commentId: string;
    author?: string;
    authorId?: string;
    userId?: string;
    userName?: string;
    content: string;
    likes: number;
    createdAt: string;
  }[];
}

export default function CommentSection({ toolId, postId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const isToolComment = !!toolId;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await commentApi.getComments(postId, toolId);
      if (response.success && response.data) {
        setComments((response.data.comments || []).map(comment => ({
          ...comment,
          createdAt: typeof comment.createdAt === 'object' ? comment.createdAt.toISOString() : comment.createdAt,
          replies: comment.replies.map(reply => ({
            ...reply,
            createdAt: typeof reply.createdAt === 'object' ? reply.createdAt.toISOString() : reply.createdAt
          }))
        })));
      }
    } catch (error) {
      logger.error('获取评论失败:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, toolId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const requestData = isToolComment
        ? { toolId, content: newComment, rating }
        : { postId, content: newComment };

      const response = await commentApi.createComment(requestData);
      if (response.success) {
        logger.info('评论创建成功');
        setNewComment('');
        setRating(5);
        await fetchComments();
      }
    } catch (error) {
      logger.error('创建评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await commentApi.addReply(commentId, { content: replyContent }, toolId);
      if (response.success) {
        logger.info('回复创建成功');
        setReplyContent('');
        setReplyingTo(null);
        await fetchComments();
      }
    } catch (error) {
      logger.error('创建回复失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }

    try {
      const response = await commentApi.likeComment(commentId, toolId);
      if (response.success) {
        await fetchComments();
      }
    } catch (error) {
      logger.error('点赞失败:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      const response = await commentApi.deleteComment(commentId, toolId);
      if (response.success) {
        logger.info('评论删除成功');
        await fetchComments();
      }
    } catch (error) {
      logger.error('删除评论失败:', error);
    }
  };

  const handleStartEdit = (comment: ApiComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSubmitEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await commentApi.updateComment(commentId, editContent, toolId);
      if (response.success) {
        logger.info('评论更新成功');
        setEditingId(null);
        setEditContent('');
        await fetchComments();
      }
    } catch (error) {
      logger.error('更新评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const renderStars = (currentRating: number, onChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 cursor-pointer transition-colors ${
          i < currentRating
            ? 'text-yellow-500 fill-yellow-500'
            : 'text-gray-300 hover:text-yellow-400'
        }`}
        onClick={() => onChange && onChange(i + 1)}
      />
    ));
  };

  const getAuthorName = (comment: ApiComment) => {
    return comment.userName || comment.author || '匿名用户';
  };

  const getAuthorId = (comment: ApiComment) => {
    return comment.userId || comment.authorId;
  };

  const canModifyComment = (comment: ApiComment) => {
    if (!user) return false;
    const commentAuthorId = getAuthorId(comment);
    return commentAuthorId && (user.id === commentAuthorId.toString() || user.role === 'admin');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-theme-text">用户评论</h4>
        <span className="text-sm text-text-muted">{comments.length} 条评论</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-theme-bg/50 rounded-xl p-4 space-y-4">
        {isToolComment && (
          <div>
            <p className="text-sm text-text-muted mb-2">评分</p>
            <div className="flex gap-1">{renderStars(rating, setRating)}</div>
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="分享您的使用体验..."
          className="w-full px-4 py-3 bg-white border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-4 h-4" />
            发表评论
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无评论，来发表第一条吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-theme-bg/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium flex-shrink-0">
                  {getAuthorName(comment)?.charAt(0) || 'U'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-theme-text">{getAuthorName(comment)}</span>
                    <span className="text-xs text-text-muted">{formatDate(comment.createdAt)}</span>
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-sm text-text-muted hover:text-primary transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSubmitEdit(comment.id)}
                          disabled={!editContent.trim() || submitting}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted mt-1">{comment.content}</p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {comment.likes > 0 && comment.likes}
                      有用
                    </button>
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      回复
                    </button>
                    {canModifyComment(comment) && (
                      <>
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {replyingTo === comment.id && (
                <div className="ml-11 space-y-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="写下您的回复..."
                    className="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || submitting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <Send className="w-3.5 h-3.5" />
                      回复
                    </button>
                  </div>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-theme-text text-sm">{reply.userName || reply.author}</span>
                        <span className="text-xs text-text-muted">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-text-muted">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <LoginRequiredToast
        show={showLoginToast}
        onClose={() => setShowLoginToast(false)}
      />
    </div>
  );
}