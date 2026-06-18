import { useState } from 'react';
import { Star, Send, MessageCircle, ThumbsUp, Reply } from 'lucide-react';
import type { ToolComment } from '@/types';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredToast from './LoginRequiredToast';

interface CommentSectionProps {
  comments: ToolComment[];
  toolId: string;
}

export default function CommentSection({ comments, toolId }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showLoginToast, setShowLoginToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
    if (newComment.trim()) {
      logger.info('提交评论:', { content: newComment, rating, toolId });
      setNewComment('');
      setRating(5);
    }
  };

  const handleReply = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setReplyContent('');
    } else {
      setReplyingTo(commentId);
    }
  };

  const handleSubmitReply = (commentId: string) => {
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
    if (replyContent.trim()) {
      logger.info('提交回复:', { content: replyContent, commentId });
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 cursor-pointer transition-colors ${
          i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-400'
        }`}
        onClick={() => setRating(i + 1)}
      />
    ));
  };

  const renderCommentStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-theme-text">用户评论</h4>
        <span className="text-sm text-text-muted">{comments.length} 条评论</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-theme-bg/50 rounded-xl p-4 space-y-4">
        <div>
          <p className="text-sm text-text-muted mb-2">评分</p>
          <div className="flex gap-1">{renderStars(rating)}</div>
        </div>
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
            disabled={!newComment.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            发表评论
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无评论，来发表第一条吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-theme-bg/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium flex-shrink-0">
                  {comment.userName.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-theme-text">{comment.userName}</span>
                    <div className="flex gap-0.5">{renderCommentStars(comment.rating)}</div>
                    <span className="text-xs text-text-muted">{comment.createdAt}</span>
                  </div>
                  <p className="text-sm text-text-muted mt-1">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      有用
                    </button>
                    <button
                      onClick={() => handleReply(comment.id)}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      回复
                    </button>
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
                      disabled={!replyContent.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
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
                        <span className="font-medium text-theme-text text-sm">{reply.userName}</span>
                        <span className="text-xs text-text-muted">{reply.createdAt}</span>
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