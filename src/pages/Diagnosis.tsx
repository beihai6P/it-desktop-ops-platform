import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Eye, MessageSquare,
  Monitor, Wifi, HardDrive, Printer, Cloud, Shield, FileText, Cpu,
  Sparkles, Calendar,
  ThumbsUp, Loader2, PlusCircle, Crown, Pin, Trash2
} from 'lucide-react';
import type { Case, CaseCategory, SortRule, QualityFilter, CaseStats } from '@/types';
import CaseSubmit from '@/components/CaseSubmit';
import Modal from '@/components/Modal';
import LoginRequiredToast from '@/components/LoginRequiredToast';
import AIDiagnosisAssistant from '@/components/AIDiagnosisAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { caseAPI } from '@/services/api';

const categoryIcons: Record<CaseCategory, React.ElementType> = {
  all: Cpu,
  system: Monitor,
  network: Wifi,
  hardware: HardDrive,
  software: Printer,
  application: Cloud,
  security: Shield,
  data: FileText,
  printer: Printer,
  virtual: Cloud,
  domain: FileText,
};

const categoryLabels: Record<CaseCategory, string> = {
  all: '全部',
  system: '系统',
  network: '网络',
  hardware: '硬件',
  software: '软件',
  application: '应用',
  security: '安全',
  data: '数据',
  printer: '打印',
  virtual: '虚拟化',
  domain: '域控',
};

const severityColors = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function Diagnosis() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;
  
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CaseCategory>('all');
  const [sortRule, setSortRule] = useState<SortRule>('latest');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await caseAPI.getAll({ limit: 50 });
      if (response.success && response.data?.cases) {
        setCases(response.data.cases);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await caseAPI.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadCases();
    loadStats();
  }, [loadCases, loadStats]);

  const filteredCases = useMemo(() => {
    let result = [...cases];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(c => c.category === selectedCategory);
    }

    if (qualityFilter !== 'all') {
      result = result.filter(c => c.severity === qualityFilter);
    }

    switch (sortRule) {
      case 'latest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        result.sort((a, b) => (b.likes + b.views * 0.1) - (a.likes + a.views * 0.1));
        break;
      case 'unresolved':
        result = result.filter(c => c.status !== 'resolved');
        break;
    }

    return result;
  }, [cases, searchQuery, selectedCategory, sortRule, qualityFilter]);

  const handleSubmit = async () => {
    try {
      loadCases();
      setShowSubmitModal(false);
    } catch (error) {
      console.error('Failed to refresh cases:', error);
    }
  };

  const handleLike = useCallback(async (caseId: string) => {
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
    try {
      await caseAPI.like(caseId);
      setCases(prev =>
        prev.map(c =>
          c.id === caseId
            ? { ...c, likes: c.likes + 1, isLiked: true }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to like case:', error);
    }
  }, [isAuthenticated]);

  const handleDelete = useCallback(async (caseId: string) => {
    if (!window.confirm('确定要删除这个案例吗？此操作将同时删除相关附件，且无法撤销。')) {
      return;
    }
    
    try {
      await caseAPI.delete(caseId);
      setCases(prev => prev.filter(c => c.id !== caseId));
    } catch (error) {
      console.error('Failed to delete case:', error);
    }
  }, []);

  const handleToggleEssence = useCallback(async (caseId: string) => {
    try {
      const response = await caseAPI.toggleEssence(caseId);
      setCases(prev =>
        prev.map(c =>
          c.id === caseId
            ? { ...c, isEssence: response.data.isEssence }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to toggle essence:', error);
    }
  }, []);

  const handleTogglePin = useCallback(async (caseId: string) => {
    try {
      const response = await caseAPI.togglePin(caseId);
      setCases(prev =>
        prev.map(c =>
          c.id === caseId
            ? { ...c, isPinned: response.data.isPinned }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  }, []);

  const categories: CaseCategory[] = ['all', 'system', 'network', 'hardware', 'software', 'application', 'security', 'data'];

  return (
    <div className="min-h-screen bg-theme-bg" ref={detailRef}>
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-theme-text mb-2">故障诊断中心</h1>
              <p className="text-text-muted">AI智能辅助，快速定位并解决各类IT故障</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary border border-primary/20 hover:bg-primary/5 rounded-xl font-medium transition-all"
              >
                <Sparkles className="w-5 h-5" />
                AI智能诊断
              </button>
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setShowSubmitModal(true);
                  } else {
                    setShowLoginToast(true);
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20 ${
                  isAuthenticated
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                {isAuthenticated ? '提交案例' : '登录后提交'}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="搜索故障关键词、标签或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-primary/10 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">总病例</p>
                      <p className="text-2xl font-bold text-theme-text mt-1">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">已解决</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <ThumbsUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">进行中</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">成功率</p>
                      <p className="text-2xl font-bold text-primary mt-1">{stats.resolutionRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-56 flex-shrink-0">
                <div className="bg-white rounded-xl border border-primary/10 p-4 sticky top-6">
                  <h3 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    故障分类
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const Icon = categoryIcons[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            selectedCategory === cat
                              ? 'bg-primary/10 text-primary'
                              : 'text-text-muted hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="flex-1 text-left whitespace-nowrap">{categoryLabels[cat]}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {cat === 'all' ? cases.length : cases.filter(c => c.category === cat).length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold text-theme-text mb-4">筛选条件</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-text-muted mb-2 block">排序方式</label>
                        <select
                          value={sortRule}
                          onChange={(e) => setSortRule(e.target.value as SortRule)}
                          className="w-full px-3 py-2 border border-primary/10 rounded-lg focus:border-primary/30"
                        >
                          <option value="latest">最新优先</option>
                          <option value="popular">最热优先</option>
                          <option value="unresolved">未解决优先</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-text-muted mb-2 block">严重程度</label>
                        <select
                          value={qualityFilter}
                          onChange={(e) => setQualityFilter(e.target.value as QualityFilter)}
                          className="w-full px-3 py-2 border border-primary/10 rounded-lg focus:border-primary/30"
                        >
                          <option value="all">全部</option>
                          <option value="critical">严重</option>
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : filteredCases.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                      <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>未找到匹配的故障记录</p>
                      <button
                        onClick={() => {
                          if (isAuthenticated) {
                            setShowSubmitModal(true);
                          } else {
                            setShowLoginToast(true);
                          }
                        }}
                        className={`mt-4 px-4 py-2 rounded-xl text-sm transition-colors ${
                          isAuthenticated
                            ? 'bg-primary text-white hover:bg-primary-dark'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {isAuthenticated ? '提交新案例' : '登录后提交'}
                      </button>
                    </div>
                  ) : (
                    filteredCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="bg-white rounded-xl border border-primary/10 p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/diagnosis/${caseItem.id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {(() => {
                              const Icon = categoryIcons[caseItem.category] || Cpu;
                              return <Icon className="w-6 h-6 text-primary" />;
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-theme-text truncate">{caseItem.title}</h4>
                              {caseItem.isPinned && (
                                <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 flex items-center gap-1">
                                  <Pin className="w-3 h-3" />
                                  置顶
                                </span>
                              )}
                              {caseItem.isEssence && (
                                <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                  <Crown className="w-3 h-3" />
                                  精华
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-xs border ${severityColors[caseItem.severity]}`}>
                                {caseItem.severity}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                caseItem.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {caseItem.status}
                              </span>
                            </div>
                            <p className="text-sm text-text-muted line-clamp-2 mb-3">{caseItem.description}</p>
                            <div className="flex items-center gap-4 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {caseItem.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {caseItem.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {caseItem.comments}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(caseItem.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {caseItem.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(caseItem.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                caseItem.isLiked ? 'bg-red-50 text-red-500' : 'hover:bg-gray-50'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePin(caseItem.id);
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    caseItem.isPinned ? 'bg-red-100 text-red-600' : 'hover:bg-gray-50'
                                  }`}
                                  title={caseItem.isPinned ? '取消置顶' : '置顶'}
                                >
                                  <Pin className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEssence(caseItem.id);
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    caseItem.isEssence ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-50'
                                  }`}
                                  title={caseItem.isEssence ? '取消精华' : '加精'}
                                >
                                  <Crown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(caseItem.id);
                                  }}
                                  className="p-2 rounded-lg transition-colors hover:bg-red-50 text-red-500"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {!isAdmin && caseItem.authorId === user?.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(caseItem.id);
                                }}
                                className="p-2 rounded-lg transition-colors hover:bg-red-50 text-red-500"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSubmitModal && !showLoginToast && (
        <CaseSubmit
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmit}
        />
      )}

      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowAIAssistant(true)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center bg-gradient-to-br from-primary to-primary-light"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>
      </div>

      <Modal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        title="AI智能诊断助手"
        size="xl"
      >
        <AIDiagnosisAssistant
          onCaseSelect={(caseId) => {
            const foundCase = cases.find(c => c.id === caseId);
            if (foundCase) {
              navigate(`/cases/${caseId}`);
              setShowAIAssistant(false);
            }
          }}
          onRequireLogin={() => {
            setShowAIAssistant(false);
            setShowLoginToast(true);
          }}
        />
      </Modal>

      <LoginRequiredToast
        show={showLoginToast}
        onClose={() => setShowLoginToast(false)}
      />
    </div>
  );
}
