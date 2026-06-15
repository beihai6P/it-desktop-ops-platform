import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, TrendingUp, Download, Flame } from 'lucide-react';
import type { Tool } from '@/types';
import ToolCard from '@/components/ToolCard';
import ToolUpload from '@/components/ToolUpload';
import { toolAPI } from '@/services/api';

type SortType = 'downloads' | 'views' | 'stars' | 'updated';

export default function Tools() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('downloads');
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await toolAPI.getAll();
      setTools(response.data.tools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['全部', '脚本工具', '系统工具', '硬件工具', '网络工具', '工具'];

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = activeCategory === '全部' || tool.category === activeCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tool.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedTools = [...filteredTools].sort((a, b) => {
    switch (sortBy) {
      case 'downloads':
        return b.downloads - a.downloads;
      case 'views':
        return b.views - a.views;
      case 'stars':
        return b.stars - a.stars;
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  const featuredTools = tools.filter((tool) => tool.isFeatured);
  const verifiedTools = tools.filter((tool) => tool.isVerified);

  const handleUpload = async (data: FormData) => {
    try {
      loadTools();
    } catch (error) {
      console.error('Failed to reload tools:', error);
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">工具分享</h2>
          <p className="text-sm text-text-muted mt-1">分享实用运维工具，提升工作效率</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
        >
          <Plus className="w-5 h-5" />
            上传工具
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-5 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme-text">{tools.length}</p>
                <p className="text-sm text-text-muted">工具总数</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-5 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme-text">{featuredTools.length}</p>
                <p className="text-sm text-text-muted">精选工具</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-theme-text">{verifiedTools.length}</p>
                <p className="text-sm text-text-muted">已验证工具</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索工具名称、描述、标签或作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="flex items-center gap-2 px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="downloads">按下载数排序</option>
                <option value="views">按浏览数排序</option>
                <option value="stars">按收藏数排序</option>
                <option value="updated">按更新时间排序</option>
              </select>
            </div>
          </div>
        </div>

        {featuredTools.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-theme-text">精选工具</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onClick={() => navigate(`/tools/${tool.id}`)} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-theme-text">全部工具</h3>
            <span className="text-sm text-text-muted">共 {sortedTools.length} 个工具</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onClick={() => navigate(`/tools/${tool.id}`)} />
              ))}
            </div>
          )}
          {!loading && sortedTools.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-text-muted">没有找到匹配的工具</p>
              <p className="text-sm text-text-muted mt-1">尝试使用其他关键词搜索</p>
            </div>
          )}
        </div>

        {showUploadModal && (
          <ToolUpload onClose={() => setShowUploadModal(false)} onSubmit={handleUpload} />
        )}
    </div>
  );
}