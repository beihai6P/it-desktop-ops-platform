import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, FolderOpen, Tag, Search, ChevronRight, ExternalLink, Download, Eye, Heart, Filter, Plus, Star, Award, CheckCircle2, Lock } from 'lucide-react';
import type { Document } from '@/types';
import DocumentUpload from '@/components/DocumentUpload';
import LoginModal from '@/components/LoginModal';
import AIKnowledgeAssistant from '@/components/AIKnowledgeAssistant';
import { documentAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type SortType = 'views' | 'downloads' | 'favorites' | 'updated';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  totalDocuments: number;
  completedDocuments: number;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  buttonColor: string;
  documents: string[];
}

const learningPaths: LearningPath[] = [
  {
    id: '1',
    title: '初级运维工程师',
    description: '适合刚入门的运维人员，学习基础操作技能',
    level: 'beginner',
    progress: 45,
    totalDocuments: 12,
    completedDocuments: 5,
    icon: Star,
    color: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
    buttonColor: 'text-primary',
    documents: ['1', '4'],
  },
  {
    id: '2',
    title: '中级运维工程师',
    description: '适合有一定经验，学习进阶技能',
    level: 'intermediate',
    progress: 25,
    totalDocuments: 15,
    completedDocuments: 4,
    icon: Award,
    color: 'from-green-50 to-green-100',
    borderColor: 'border-green-200',
    buttonColor: 'text-green-600',
    documents: ['2', '3'],
  },
  {
    id: '3',
    title: '高级运维专家',
    description: '适合资深工程师，深入技术研究',
    level: 'advanced',
    progress: 10,
    totalDocuments: 8,
    completedDocuments: 1,
    icon: CheckCircle2,
    color: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-200',
    buttonColor: 'text-purple-600',
    documents: ['5', '6'],
  },
];

const categories = ['全部', '操作系统', '脚本工具', '办公软件', '硬件设备', '安全合规', '网络管理', '系统维护'];
const types = ['全部', '指南', '手册', '脚本', '规范', '流程', '教程'];

export default function Knowledge() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeType, setActiveType] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('views');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentAPI.getAll();
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    try {
      await documentAPI.favorite(id);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                isFavorite: !doc.isFavorite,
                favorites: doc.isFavorite ? doc.favorites - 1 : doc.favorites + 1,
              }
            : doc
        )
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDownload = (doc: Document) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, downloads: d.downloads + 1 } : d
      )
    );
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = activeCategory === '全部' || doc.category === activeCategory;
    const matchesType = activeType === '全部' || doc.type === activeType;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesType && matchesSearch;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.views - a.views;
      case 'downloads':
        return b.downloads - a.downloads;
      case 'favorites':
        return b.favorites - a.favorites;
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  const favoriteDocuments = documents.filter((doc) => doc.isFavorite);
  const totalViews = documents.reduce((sum, doc) => sum + doc.views, 0);
  const totalDownloads = documents.reduce((sum, doc) => sum + doc.downloads, 0);

  const handleUpload = async (data: FormData) => {
    try {
      const documentData = {
        title: data.get('title') as string,
        category: data.get('category') as string,
        type: data.get('type') as string,
        tags: (data.get('tags') as string).split(',').map((t: string) => t.trim()).filter(Boolean),
        author: '运维工程师',
        description: data.get('description') as string,
        content: data.get('content') as string,
        version: data.get('version') as string,
        status: 'published' as const,
      };
      const response = await documentAPI.create(documentData);
      setDocuments((prev) => [response.data as Document, ...prev]);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
    setShowUploadModal(false);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">知识库</h2>
          <p className="text-sm text-text-muted mt-1">专业文档资料，助力技能提升</p>
        </div>
        {isAuthenticated ? (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
            >
              <Plus className="w-5 h-5" />
              上传文档
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors"
            >
              <Lock className="w-5 h-5" />
              登录后上传
            </button>
          )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-text">{documents.length}</p>
              <p className="text-sm text-text-muted">文档总数</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-text">{totalViews.toLocaleString()}</p>
              <p className="text-sm text-text-muted">总浏览量</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-text">{totalDownloads.toLocaleString()}</p>
              <p className="text-sm text-text-muted">总下载量</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-5 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-text">{favoriteDocuments.length}</p>
              <p className="text-sm text-text-muted">收藏文档</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="搜索文档标题、描述、标签或作者..."
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
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
              className="px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {types.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="flex items-center gap-2 px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="views">按浏览数排序</option>
              <option value="downloads">按下载数排序</option>
              <option value="favorites">按收藏数排序</option>
              <option value="updated">按更新时间排序</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {favoriteDocuments.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <h3 className="font-semibold text-theme-text">我的收藏</h3>
                <span className="text-sm text-text-muted">({favoriteDocuments.length})</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {favoriteDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/knowledge/${doc.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                          {doc.type}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                          {doc.category}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(doc.id);
                        }}
                        className="p-2 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-theme-text mb-2">{doc.title}</h3>
                    <p className="text-sm text-text-muted mb-3 line-clamp-2">{doc.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {doc.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-red-200">
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {doc.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {doc.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {doc.favorites}
                        </span>
                      </div>
                      <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-theme-text">学习路径推荐</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {learningPaths.map((path) => {
                const Icon = path.icon;
                return (
                  <div
                    key={path.id}
                    className={`bg-gradient-to-br ${path.color} rounded-xl p-5 border ${path.borderColor} hover:shadow-lg transition-all`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${path.buttonColor}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-theme-text">{path.title}</h4>
                        <p className="text-xs text-text-muted">
                          {path.completedDocuments}/{path.totalDocuments} 文档
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-text-muted mb-4">{path.description}</p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">学习进度</span>
                        <span className={path.buttonColor}>{path.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${path.buttonColor.replace('text-', 'bg-')} rounded-full transition-all`}
                          style={{ width: `${path.progress}%` }}
                        />
                      </div>
                    </div>
                    <button className={`flex items-center gap-1 text-sm ${path.buttonColor} hover:underline`}>
                      继续学习
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AIKnowledgeAssistant onDocumentSelect={(id) => {
            const doc = documents.find(d => d.id === id);
            if (doc) navigate(`/knowledge/${doc.id}`);
          }} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-theme-text">全部文档</h3>
            </div>
            <span className="text-sm text-text-muted">共 {sortedDocuments.length} 个文档</span>
          </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDocuments.map((doc) => (
              <div
              key={doc.id}
              className="bg-white/85 border border-primary/20 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer card-hover"
              onClick={() => navigate(`/knowledge/${doc.id}`)}
            >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                      {doc.type}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                      {doc.category}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-xs">
                      v{doc.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(doc.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        doc.isFavorite ? 'text-red-500 hover:bg-red-50' : 'text-text-muted hover:bg-primary/10'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${doc.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      className="p-2 text-text-muted hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-theme-text mb-2">{doc.title}</h3>
                <p className="text-sm text-text-muted mb-3 line-clamp-2">{doc.description}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {doc.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {doc.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {doc.downloads}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {doc.favorites}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                    查看详情
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && sortedDocuments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-text-muted">没有找到匹配的文档</p>
            <p className="text-sm text-text-muted mt-1">尝试使用其他关键词搜索</p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <DocumentUpload onClose={() => setShowUploadModal(false)} onSubmit={handleUpload} />
      )}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}