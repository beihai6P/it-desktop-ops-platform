import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Filter, Plus, Lock, TrendingUp, Tag, Flame, Clock, Zap, Heart } from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import LoginRequiredToast from '@/components/LoginRequiredToast';
import type { Post, Category } from '@/types';
import { postAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'hot', label: '热门' },
  { value: 'new', label: '最新' },
];

export default function Community() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState<'all' | 'title' | 'content' | 'author' | 'tag'>('all');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadPosts();
    loadHotPosts();
    loadCategories();
    loadTags();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await postAPI.getAll();
      setPosts(response.data.posts);
    } catch (error) {
      logger.error('Failed to load posts:', error);
    }
  };

  const loadHotPosts = async () => {
    try {
      const response = await postAPI.getHot();
      setHotPosts(response.data.posts || []);
    } catch (error) {
      logger.error('Failed to load hot posts:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.map((cat: { id: string; name: string; icon: string; postCount: number }) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          count: cat.postCount,
        })) || []);
      }
    } catch (error) {
      logger.error('Failed to load categories:', error);
      setCategories([
        { id: '1', name: '技术讨论', icon: 'code', count: 128 },
        { id: '2', name: '故障求助', icon: 'help', count: 89 },
        { id: '3', name: '经验分享', icon: 'book', count: 156 },
        { id: '4', name: '工具推荐', icon: 'wrench', count: 67 },
        { id: '5', name: '行业资讯', icon: 'news', count: 45 },
      ]);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags/popular');
      const data = await response.json();
      if (data.success) {
        setTags(data.data.map((tag: { name: string }) => tag.name) || []);
      }
    } catch (error) {
      logger.error('Failed to load tags:', error);
      setTags(['Windows', 'macOS', 'Linux', '脚本', '自动化', '安全', '网络', '硬件', '软件', '云服务']);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = () => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      switch (searchType) {
        case 'title':
          return post.title.toLowerCase().includes(query);
        case 'content':
          return post.content.toLowerCase().includes(query);
        case 'author':
          return post.author.toLowerCase().includes(query);
        case 'tag':
          return post.tags.some((tag) => tag.toLowerCase().includes(query));
        default:
          return post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.tags.some((tag) => tag.toLowerCase().includes(query)) ||
            post.author.toLowerCase().includes(query);
      }
    };
    const matchesFilter = activeFilter === 'all' || post.status === activeFilter;
    const matchesCategory = selectedCategory === '全部' || post.category === selectedCategory;
    return matchesSearch() && matchesFilter && matchesCategory;
  });

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
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
      setHotPosts(hotPosts.map((post) => {
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
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
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

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setSearchType('tag');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/community/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
    }
  };

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'code':
        return <Zap className="w-4 h-4" />;
      case 'help':
        return <MessageSquare className="w-4 h-4" />;
      case 'book':
        return <Clock className="w-4 h-4" />;
      case 'wrench':
        return <Tag className="w-4 h-4" />;
      case 'news':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const allCategories = ['全部', ...categories.map((c) => c.name)];

  useEffect(() => {
    setLoading(false);
  }, [posts, hotPosts, categories]);

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-theme-text">社区交流</h2>
            <p className="text-sm text-text-muted mt-1">分享经验、交流问题、共同成长</p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/30"
            >
              <Plus className="w-5 h-5" />
              发表帖子
            </button>
          ) : (
            <button
              onClick={() => setShowLoginToast(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors"
            >
              <Lock className="w-5 h-5" />
              登录后发表
            </button>
          )}
        </div>

        <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索帖子标题、内容、作者或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as typeof searchType)}
                className="px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">全文</option>
                <option value="title">标题</option>
                <option value="content">内容</option>
                <option value="author">作者</option>
                <option value="tag">标签</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-2xl p-4 mb-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-theme-text">筛选</span>
                </div>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === cat.name
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                    }`}
                  >
                    {getCategoryIcon(cat.icon)}
                    {cat.name}
                    <span className="text-xs opacity-70">({cat.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : filteredPosts.length > 0 ? (
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
              </div>
            ) : (
              <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-2xl p-12 text-center shadow-lg">
                <MessageSquare className="w-16 h-16 mx-auto text-primary/20 mb-4" />
                <p className="text-text-muted text-lg">暂无相关帖子</p>
                <p className="text-text-muted/70 text-sm mt-2">尝试调整筛选条件或搜索关键词</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-2xl p-5 shadow-lg sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-theme-text">热门帖子</span>
              </div>
              <div className="space-y-3">
                {hotPosts.slice(0, 5).map((post, index) => (
                  <div
                    key={post.id}
                    onClick={() => handleViewPost(post)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-red-500 text-white' :
                      index === 1 ? 'bg-orange-500 text-white' :
                      index === 2 ? 'bg-yellow-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-theme-text text-sm line-clamp-2">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-text-muted">{post.likes}</span>
                        <span className="text-xs text-text-muted">·</span>
                        <MessageSquare className="w-3 h-3 text-text-muted" />
                        <span className="text-xs text-text-muted">{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {hotPosts.length === 0 && (
                  <p className="text-text-muted text-sm text-center py-4">暂无热门帖子</p>
                )}
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary" />
                <span className="font-semibold text-theme-text">热门标签</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="px-3 py-1.5 bg-primary/5 text-primary rounded-full text-sm hover:bg-primary/10 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 shadow-lg">
              <h3 className="font-semibold text-theme-text mb-2">快速导航</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-white/50 transition-colors text-sm text-text-muted">
                  <MessageSquare className="w-4 h-4" />
                  问答专区
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-white/50 transition-colors text-sm text-text-muted">
                  <TrendingUp className="w-4 h-4" />
                  精华帖
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-white/50 transition-colors text-sm text-text-muted">
                  <Clock className="w-4 h-4" />
                  最新发布
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
          categories={categories}
        />
      )}

      <LoginRequiredToast
        show={showLoginToast}
        onClose={() => setShowLoginToast(false)}
      />
    </div>
  );
}