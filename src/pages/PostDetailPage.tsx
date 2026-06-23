import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Tag, Heart, MessageCircle, Bookmark, Share2, Eye, Clock, Send, ThumbsUp, Reply, Lock, ArrowLeft, HelpCircle, CheckCircle, Copy, Link2, Bell, BellOff, Edit2, Trash2, Award, Pin } from 'lucide-react';
import type { Post, Comment } from '@/types';
import { postAPI, commentAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { logger } from '@/lib/logger';
import LoginRequiredToast from '@/components/LoginRequiredToast';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, hasPermission, hasRole } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isQuestion, setIsQuestion] = useState(false);
  const [hasAcceptedAnswer, setHasAcceptedAnswer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');

  const isAdmin = hasRole('admin') || user?.isAdmin || user?.role === 'admin';
  const isAuthor = isAuthenticated && user?.id === post?.authorId;
  const canEdit = isAuthor || isAdmin;
  const canDelete = isAuthor || isAdmin;
  const canManage = isAdmin;

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await postAPI.getById(id);
      setPost(response.data);
      setIsQuestion(response.data.category === '故障求助');
      setHasAcceptedAnswer(false);
      setEditTitle(response.data.title);
      setEditContent(response.data.content);
      setEditCategory(response.data.category);
      setEditTags(response.data.tags);
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
      const response = await commentAPI.getAll({ postId: id });
      setComments(response.data.comments || []);
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
      setShowLoginToast(true);
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
      setShowLoginToast(true);
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

  const handleFollow = async () => {
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
    try {
      setIsFollowing(!isFollowing);
    } catch (error) {
      logger.error('Failed to follow author:', error);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy link:', error);
    }
    setShowShareMenu(false);
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
                  author: user?.name || '用户',
                  authorId: user?.id || 'current-user',
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

  const handleToggleEssence = async () => {
    if (!post) return;
    try {
      await postAPI.toggleEssence(post.id);
      setPost((prev) =>
        prev ? { ...prev, isEssence: !prev.isEssence } : null
      );
    } catch (error) {
      logger.error('Failed to toggle essence:', error);
    }
  };

  const handleTogglePin = async () => {
    if (!post) return;
    try {
      await postAPI.togglePin(post.id);
      setPost((prev) =>
        prev ? { ...prev, isPinned: !prev.isPinned } : null
      );
    } catch (error) {
      logger.error('Failed to toggle pin:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm('确定要删除这篇帖子吗？此操作无法撤销。')) return;
    try {
      await postAPI.delete(post.id);
      navigate('/community');
    } catch (error) {
      logger.error('Failed to delete post:', error);
    }
  };

  const handleEditPost = async () => {
    if (!post) return;
    try {
      await postAPI.update(post.id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        tags: editTags,
      });
      setPost((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              content: editContent,
              category: editCategory,
              tags: editTags,
            }
          : null
      );
      setShowEditModal(false);
    } catch (error) {
      logger.error('Failed to update post:', error);
    }
  };

  const handleAddEditTag = () => {
    if (editTagInput.trim() && !editTags.includes(editTagInput.trim())) {
      setEditTags([...editTags, editTagInput.trim()]);
      setEditTagInput('');
    }
  };

  const handleRemoveEditTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((tag) => tag !== tagToRemove));
  };

  const postComments = comments.filter((c) => c.postId === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center px-4">
        <MessageCircle className="w-16 h-16 text-primary/30 mb-4" />
        <p className="text-text-muted text-lg">{error || '帖子不存在'}</p>
        <button
          onClick={() => navigate('/community')}
          className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
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
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
          <div className="p-6 border-b border-primary/10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-theme-text text-lg">{post.author}</p>
                    {isAuthenticated && (
                      <button
                        onClick={handleFollow}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                          isFollowing
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <BellOff className="w-3.5 h-3.5" />
                            已关注
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5" />
                            关注
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
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

              <div className="flex items-center gap-2">
                {post.isEssence && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    <Award className="w-4 h-4" />
                    精华
                  </span>
                )}
                {post.isPinned && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    <Pin className="w-4 h-4" />
                    置顶
                  </span>
                )}
                {isQuestion && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    <HelpCircle className="w-4 h-4" />
                    问答
                  </span>
                )}
                {hasAcceptedAnswer && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    已解决
                  </span>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-text-muted mr-2">管理员操作:</span>
                <button
                  onClick={handleToggleEssence}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    post.isEssence
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-white text-text-muted hover:bg-yellow-50'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  {post.isEssence ? '取消精华' : '设为精华'}
                </button>
                <button
                  onClick={handleTogglePin}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    post.isPinned
                      ? 'bg-red-100 text-red-700'
                      : 'bg-white text-text-muted hover:bg-red-50'
                  }`}
                >
                  <Pin className="w-4 h-4" />
                  {post.isPinned ? '取消置顶' : '设为置顶'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {post.category}
              </span>
              {post.status === 'hot' && (
                <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                  热门
                </span>
              )}
              {post.status === 'new' && (
                <span className="px-3 py-1.5 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                  新帖
                </span>
              )}
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

            <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                  post.isLiked ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary/5 text-text-muted hover:bg-primary/10 rounded-xl transition-all">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.comments}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                  post.isBookmarked ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary/5 text-text-muted hover:bg-primary/10 rounded-xl transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-primary/20 py-2 z-10">
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-primary/5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-text-muted" />
                          <span className="text-sm text-theme-text">复制链接</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowShareMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-primary/5 transition-colors"
                    >
                      <Link2 className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-theme-text">分享链接</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isQuestion && (
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">这是一个问答帖子</p>
                  <p className="text-xs text-yellow-600">最佳答案将被标记为采纳答案</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <h3 className="text-lg font-semibold text-theme-text mb-4">评论 ({postComments.length})</h3>

            <div className="space-y-4 mb-6">
              {postComments.map((comment) => (
                <div key={comment.id} className="bg-primary/5 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-theme-text">{comment.author}</span>
                        <span className="text-sm text-text-muted">{comment.createdAt}</span>
                        {comment.authorId === post.authorId && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">作者</span>
                        )}
                      </div>
                      <p className="text-text-muted mb-3">{comment.content}</p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-500 transition-colors"
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
                          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          <span>回复</span>
                        </button>
                        {isQuestion && comment.authorId !== post.authorId && (
                          <button className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 transition-colors">
                            <CheckCircle className="w-4 h-4" />
                            <span>采纳答案</span>
                          </button>
                        )}
                      </div>

                      {replyingTo === comment.id && (
                        <div className="mt-4 flex gap-3">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`回复 ${comment.author}...`}
                              className="w-full pl-4 pr-4 py-3 bg-white border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                              onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(comment.id)}
                            />
                          </div>
                          <button
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyText.trim()}
                            className="px-5 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-primary/20 space-y-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-theme-text">{reply.author}</span>
                                  <span className="text-xs text-text-muted">{reply.createdAt}</span>
                                </div>
                                <p className="text-sm text-text-muted">{reply.content}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <button className="flex items-center gap-1 text-xs text-text-muted hover:text-red-500 transition-colors">
                                    <ThumbsUp className="w-3 h-3" />
                                    <span>{reply.likes}</span>
                                  </button>
                                </div>
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
                <div className="text-center py-12 text-text-muted">
                  <MessageCircle className="w-14 h-14 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">暂无评论</p>
                  <p className="text-sm mt-1">快来发表第一条评论吧！</p>
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

        <div className="mt-8 bg-white/85 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 shadow-lg">
          <h3 className="font-semibold text-theme-text mb-4">相关帖子</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                onClick={() => navigate('/community')}
                className="p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <h4 className="font-medium text-theme-text line-clamp-2 mb-2">
                  {['Windows 11 更新后系统变慢的解决方法', 'PowerShell 脚本批量处理文件的技巧', '如何优化 Active Directory 性能', 'Exchange Server 备份策略最佳实践'][index - 1]}
                </h4>
                <p className="text-sm text-text-muted">作者: 运维工程师 · 2小时前</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-primary/10">
              <h2 className="text-xl font-bold text-theme-text">编辑帖子</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Lock className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">标题</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">分类</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {['技术讨论', '故障求助', '经验分享', '工具推荐', '行业资讯'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">内容</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">标签</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEditTag()}
                      className="flex-1 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button onClick={handleAddEditTag} className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20">添加</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button onClick={() => handleRemoveEditTag(tag)} className="ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-primary/10 bg-white">
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowEditModal(false)} className="px-6 py-3 bg-primary/5 text-text-muted rounded-xl hover:bg-primary/10">取消</button>
                <button onClick={handleEditPost} className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoginRequiredToast
        show={showLoginToast}
        onClose={() => setShowLoginToast(false)}
      />
    </div>
  );
}