import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Filter, Plus, Lock } from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import type { Post } from '@/types';
import { postAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const categories = [
  { id: '1', name: '技术讨论', count: 128 },
  { id: '2', name: '故障求助', count: 89 },
  { id: '3', name: '经验分享', count: 156 },
  { id: '4', name: '工具推荐', count: 67 },
  { id: '5', name: '行业资讯', count: 45 },
];

const allCategories = ['全部', ...categories.map((c) => c.name)];
const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'hot', label: '热门' },
  { value: 'new', label: '最新' },
];

export default function Community() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await postAPI.getAll();
      setPosts(response.data.posts);
    } catch (error) {
      logger.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || post.status === activeFilter;
    const matchesCategory = selectedCategory === '全部' || post.category === selectedCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const handleLike = async (postId: string) => {
    try {
      await postAPI.like(postId);
      setPosts(posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      }));
    } catch (error) {
      logger.error('Failed to like post:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      await postAPI.bookmark(postId);
      setPosts(posts.map((post) => {
        if (post.id === postId) {
          return { ...post, isBookmarked: !post.isBookmarked };
        }
        return post;
      }));
    } catch (error) {
      logger.error('Failed to bookmark post:', error);
    }
  };

  const handleViewPost = (post: Post) => {
    navigate(`/community/${post.id}`);
  };

  const handleCreatePost = async (data: { title: string; content: string; tags: string[]; category: string }) => {
    try {
      const response = await postAPI.create(data);
      setPosts([response.data as Post, ...posts]);
    } catch (error) {
      logger.error('Failed to create post:', error);
    }
    setShowCreateModal(false);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-theme-text">社区交流</h2>
            <p className="text-sm text-text-muted mt-1">分享经验、交流问题、共同成长</p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              发表帖子
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors"
            >
              <Lock className="w-4 h-4" />
              登录后发表
            </button>
          )}
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索帖子、标签、作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onClick={() => handleViewPost(post)}
              />
            ))}
            {filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 mx-auto text-primary/20 mb-4" />
                <p className="text-text-muted">暂无相关帖子</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
}