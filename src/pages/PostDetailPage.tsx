import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Tag, Heart, MessageCircle, Bookmark, Share2, Eye, Clock, Send, ThumbsUp, Reply, Lock, ArrowLeft } from 'lucide-react';
import type { Post, Comment } from '@/types';
import { postAPI, commentAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { logger } from '@/lib/logger';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await postAPI.getById(id);
      setPost(response.data);
    } catch (err) {
      logger.error('Failed to load post:', err);
      setError('获取帖子详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      const response = await commentAPI.getAll();
      setComments(response.data.comments);
    } catch (err) {
      logger.error('Failed to load comments:', err);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [loadPost, loadComments]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!post) return;
    try {
      await postAPI.like(post.id);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !prev.isLiked,
              likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
            }
          : null
      );
    } catch (error) {
      logger.error('Failed to like post:', error);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!post) return;
    try {
      await postAPI.bookmark(post.id);
      setPost((prev) =>
        prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null
      );
    } catch (error) {
      logger.error('Failed to bookmark post:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!commentText.trim() || !post) return;
    try {
      const response = await commentAPI.create(post.id, commentText);
      setComments([response.data, ...comments]);
      setPost((prev) =>
        prev ? { ...prev, comments: prev.comments + 1 } : null
      );
      setCommentText('');
    } catch (error) {
      logger.error('Failed to add comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await commentAPI.like(commentId);
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, likes: comment.likes + 1 };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply
              ),
            };
          }
          return comment;
        })
      );
    } catch (error) {
      logger.error('Failed to like comment:', error);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!replyText.trim()) return;
    try {
      await commentAPI.reply(commentId, replyText);
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [
                ...comment.replies,
                {
                  id: `r${Date.now()}`,
                  commentId,
                  author: '运维工程师',
                  authorId: 'current-user',
                  content: replyText,
                  likes: 0,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
          return comment;
        })
      );
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      logger.error('Failed to reply comment:', error);
    }
  };

  const postComments = comments.filter((c) => c.postId === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <MessageCircle className="w-16 h-16 text-primary/30 mb-4" />
        <p className="text-text-muted">{error || '帖子不存在'}</p>
        <button
          onClick={() => navigate('/community')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          返回社区
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      <header className="bg-white/85 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/community')}
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回社区
            </button>
            <h1 className="text-lg font-semibold text-theme-text">帖子详情</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
          <div className="p-6 border-b border-primary/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-theme-text">{post.author}</p>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {post.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-theme-text mb-4">{post.title}</h1>

            <div className="prose prose-sm max-w-none text-text-muted whitespace-pre-line mb-6">
              {post.content}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-primary/10">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  post.isLiked ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-text-muted hover:bg-primary/10 rounded-xl transition-all">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.comments}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  post.isBookmarked ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-text-muted hover:bg-primary/10 rounded-xl transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-theme-text mb-4">评论 ({postComments.length})</h3>

            <div className="space-y-4 mb-6">
              {postComments.map((comment) => (
                <div key={comment.id} className="bg-primary/5 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-theme-text">{comment.author}</span>
                        <span className="text-sm text-text-muted">{comment.createdAt}</span>
                      </div>
                      <p className="text-text-muted mb-3">{comment.content}</p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className="flex items-center gap-1 text-sm text-text-muted hover:text-red-500 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{comment.likes}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!isAuthenticated) {
                              setShowLoginModal(true);
                              return;
                            }
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                          }}
                          className="flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          <span>回复</span>
                        </button>
                      </div>

                      {replyingTo === comment.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="输入回复..."
                            className="flex-1 px-4 py-2 bg-white border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(comment.id)}
                          />
                          <button
                            onClick={() => handleSubmitReply(comment.id)}
                            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-theme-text">{reply.author}</span>
                                  <span className="text-xs text-text-muted">{reply.createdAt}</span>
                                </div>
                                <p className="text-sm text-text-muted">{reply.content}</p>
                                <button className="flex items-center gap-1 text-xs text-text-muted hover:text-red-500 transition-colors mt-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{reply.likes}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {postComments.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无评论，快来发表第一条评论吧！</p>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  className="flex-1 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>登录后可以发表评论</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}