import { useState } from 'react';
import { X, User, Tag, Heart, MessageCircle, Bookmark, Share2, Eye, Clock, Send, ThumbsUp, Reply, Lock } from 'lucide-react';
import type { Post, Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

interface PostDetailModalProps {
  post: Post;
  comments: Comment[];
  onClose: () => void;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onLikeComment: (commentId: string) => void;
  onReplyComment: (commentId: string, content: string) => void;
}

export default function PostDetailModal({
  post,
  comments,
  onClose,
  onLike,
  onBookmark,
  onAddComment,
  onLikeComment,
  onReplyComment,
}: PostDetailModalProps) {
  const { isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const postComments = comments.filter((c) => c.postId === post.id);

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleSubmitReply = (commentId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (replyText.trim()) {
      onReplyComment(commentId, replyText);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    onLike(post.id);
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    onBookmark(post.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-theme-text mb-4">{post.title}</h2>

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

          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-primary/10">
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

          <div>
            <h3 className="text-lg font-semibold text-theme-text mb-4">评论 ({postComments.length})</h3>

            <div className="space-y-4">
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
                          onClick={() => onLikeComment(comment.id)}
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
          </div>
        </div>

        {isAuthenticated ? (
          <div className="p-4 border-t border-primary/10 bg-white">
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
          </div>
        ) : (
          <div className="p-4 border-t border-primary/10 bg-gray-50">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>登录后可以发表评论</span>
            </button>
          </div>
        )}
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}