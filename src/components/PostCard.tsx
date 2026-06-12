import { User, Tag, Heart, MessageCircle, Bookmark, Share2, Eye, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onClick: () => void;
}

export default function PostCard({ post, onLike, onBookmark, onClick }: PostCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hot':
        return <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">热门</span>;
      case 'new':
        return <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">新帖</span>;
      default:
        return null;
    }
  };

  const getReviewStatusBadge = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'pending':
        return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium"><Clock className="w-3 h-3" />待审核</span>;
      case 'review':
        return <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" />需审核</span>;
      case 'approved':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />已通过</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium"><XCircle className="w-3 h-3" />已拒绝</span>;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/85 border border-primary/20 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-theme-text">{post.author}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock className="w-3 h-3" />
              <span>{post.createdAt}</span>
              <span>·</span>
              <Eye className="w-3 h-3" />
              <span>{post.views}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(post.status)}
          {getReviewStatusBadge(post.reviewStatus)}
          <span className="px-2 py-1 bg-primary/5 text-primary rounded-full text-xs font-medium">
            {post.category}
          </span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-theme-text mb-2 line-clamp-2">{post.title}</h3>
      <p className="text-text-muted mb-4 line-clamp-3 whitespace-pre-line">{post.content}</p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(post.id);
            }}
            className={`flex items-center gap-1 transition-colors ${
              post.isLiked ? 'text-red-500' : 'text-text-muted hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes}</span>
          </button>
          <button className="flex items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comments}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(post.id);
            }}
            className={`flex items-center gap-1 transition-colors ${
              post.isBookmarked ? 'text-primary' : 'text-text-muted hover:text-primary'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button className="flex items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}