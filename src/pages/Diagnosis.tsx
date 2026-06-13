import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search, Filter, SortDesc, Clock, Eye, Star, CheckCircle, X, MessageSquare,
  Monitor, Wifi, HardDrive, Printer, Cloud, Shield, FileText, Cpu,
  Lightbulb, Sparkles, ChevronRight, BookOpen, TrendingUp, Calendar,
  Bookmark, Share2, Download, ThumbsUp, ArrowRight, Tag, Users, Zap,
  AlertCircle, CheckCircle2, Send, BarChart3, XCircle, EyeOff, Loader2
} from 'lucide-react';
import type { Case, CaseCategory, SortRule, QualityFilter, CaseStats, TrendDataPoint } from '@/types';
import CaseDetail from '@/components/CaseDetail';
import DiagnosisAssistant from '@/components/DiagnosisAssistant';
import CaseSubmit from '@/components/CaseSubmit';
import LineChart from '@/components/Charts/LineChart';
import { categoryConfig, hotTags } from '@/data/mockData';
import { caseAPI } from '@/services/api';

// 分类配置映射
const categoryIcons: Record<CaseCategory, React.ElementType> = {
  all: Cpu,
  system: Monitor,
  network: Wifi,
  hardware: HardDrive,
  printer: Printer,
  software: FileText,
  virtual: Cloud,
  domain: Shield
};

const categories: { id: CaseCategory; name: string }[] = [
  { id: 'all', name: '全部' },
  { id: 'system', name: '系统故障' },
  { id: 'network', name: '网络问题' },
  { id: 'hardware', name: '硬件外设' },
  { id: 'printer', name: '打印设备' },
  { id: 'software', name: '办公软件' },
  { id: 'virtual', name: '虚拟机虚拟化' },
  { id: 'domain', name: '域认证企业环境' }
];

const sortOptions: { id: SortRule; name: string }[] = [
  { id: 'latest', name: '最新发布' },
  { id: 'views', name: '浏览最多' },
  { id: 'likes', name: '点赞收藏最高' }
];

const qualityOptions: { id: QualityFilter; name: string }[] = [
  { id: 'all', name: '全部质量' },
  { id: 'verified', name: '仅显示带完整解决方案' }
];

const systemVersionOptions = [
  { id: 'all', name: '全部系统' },
  { id: 'win7', name: 'Win7' },
  { id: 'win10', name: 'Win10' },
  { id: 'win11', name: 'Win11' },
  { id: 'macos', name: 'MacOS' }
];

// 近7天趋势模拟数据
const weeklyTrendData: TrendDataPoint[] = [
  { date: '06-07', value: 12, label: '周一' },
  { date: '06-08', value: 18, label: '周二' },
  { date: '06-09', value: 8, label: '周三' },
  { date: '06-10', value: 25, label: '周四' },
  { date: '06-11', value: 15, label: '周五' },
  { date: '06-12', value: 30, label: '周六' },
  { date: '06-13', value: 17, label: '今日' }
];

export default function Diagnosis() {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CaseCategory>('all');
  const [sortBy, setSortBy] = useState<SortRule>('latest');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [systemVersion, setSystemVersion] = useState('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hoveredCaseId, setHoveredCaseId] = useState<string | null>(null);
  const [showTrendPopup, setShowTrendPopup] = useState(false);
  const [trendPopupType, setTrendPopupType] = useState<'total' | 'closed' | 'weekly'>('total');
  const trendPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Toast提示
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // 从后端获取案例数据
  useEffect(() => {
    const fetchCases = async () => {
      try {
        setIsLoading(true);
        const response = await caseAPI.getAll();
        
        // 统一处理各种返回格式
        let casesData: Case[] = [];
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            casesData = response.data;
          } else if (response.data.success && response.data.data) {
            casesData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          } else if (response.data.cases && Array.isArray(response.data.cases)) {
            casesData = response.data.cases;
          }
        }
        
        setCases(casesData);
      } catch (error) {
        console.error('获取案例数据失败:', error);
        showToast('error', '获取案例数据失败，请稍后重试');
        setCases([]); // 确保出错时设置为空数组
      } finally {
        setIsLoading(false);
      }
    };
    fetchCases();
  }, [showToast]);

  // 点击外部关闭趋势弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (trendPopupRef.current && !trendPopupRef.current.contains(event.target as Node)) {
        setShowTrendPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 计算统计数据
  const stats: CaseStats = useMemo(() => {
    const totalPosts = cases.length;
    const closedSolutions = cases.filter(c => c.status === 'resolved' && c.steps.length > 0).length;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyNew = cases.filter(c => new Date(c.createdAt) >= oneWeekAgo).length;
    return { totalPosts, closedSolutions, weeklyNew };
  }, [cases]);

  // 统计数据卡片点击处理
  const handleStatCardClick = useCallback((statType: 'total' | 'closed' | 'weekly') => {
    if (statType === 'total') {
      setActiveCategory('all');
      setQualityFilter('all');
      setSortBy('latest');
      setSystemVersion('all');
    } else if (statType === 'closed') {
      setQualityFilter('verified');
    } else {
      setSortBy('latest');
    }
  }, []);

  // 打开趋势弹窗
  const openTrendPopup = useCallback((type: 'total' | 'closed' | 'weekly') => {
    setTrendPopupType(type);
    setShowTrendPopup(true);
  }, []);

  // 筛选和排序案例
  const filteredCases = useMemo(() => {
    let result = cases.filter((item) => {
      // 搜索过滤
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.causeAnalysis.toLowerCase().includes(searchQuery.toLowerCase());

      // 分类过滤
      const matchesCategory = activeCategory === 'all' || getCaseCategory(item) === activeCategory;

      // 质量过滤
      const matchesQuality = qualityFilter === 'all' || item.quality === qualityFilter;

      // 系统版本过滤
      const matchesSystem = systemVersion === 'all' || 
        (systemVersion === 'win7' && item.systemVersion?.includes('7')) ||
        (systemVersion === 'win10' && item.systemVersion?.includes('10')) ||
        (systemVersion === 'win11' && item.systemVersion?.includes('11')) ||
        (systemVersion === 'macos' && item.systemVersion?.toLowerCase().includes('mac'));

      return matchesSearch && matchesCategory && matchesQuality && matchesSystem;
    });

    // 排序
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'likes':
          return (b.likes + (b.comments * 2)) - (a.likes + (a.comments * 2));
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [cases, searchQuery, activeCategory, sortBy, qualityFilter, systemVersion]);

  // 获取案例分类
  const getCaseCategory = (item: Case): CaseCategory => {
    const deviceTags = ['打印机', '打印设备'];
    const networkTags = ['网络', 'DNS', '连接', '超时', 'VPN'];
    const officeTags = ['Office', 'Word', 'Excel', '办公软件'];
    const virtualTags = ['虚拟机', 'VMware', '虚拟桌面', 'VDI'];
    const domainTags = ['域', '认证', 'AD', '登录', '凭据'];

    if (item.deviceType === '打印机' || deviceTags.some(t => item.tags.includes(t))) return 'printer';
    if (networkTags.some(t => item.tags.includes(t) || item.symptoms.some(s => s.includes(t)))) return 'network';
    if (officeTags.some(t => item.tags.includes(t) || item.symptoms.some(s => s.includes(t)))) return 'software';
    if (virtualTags.some(t => item.tags.includes(t) || item.symptoms.some(s => s.includes(t)))) return 'virtual';
    if (domainTags.some(t => item.tags.includes(t) || item.symptoms.some(s => s.includes(t)))) return 'domain';
    if (item.deviceType === '服务器') return 'hardware';
    return 'system';
  };

  // 点赞案例
  const handleLikeCase = useCallback(async (caseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await caseAPI.like(caseId);
      setCases(prev => prev.map(c =>
        c.id === caseId ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked } : c
      ));
    } catch (error) {
      console.error('点赞失败:', error);
      showToast('error', '点赞失败，请稍后重试');
    }
  }, [showToast]);

  // 收藏案例
  const handleBookmarkCase = useCallback(async (caseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const currentCase = cases.find(c => c.id === caseId);
      const willBeBookmarked = !currentCase?.isBookmarked;
      
      await caseAPI.bookmark(caseId);
      setCases(prev => prev.map(c =>
        c.id === caseId ? { ...c, isBookmarked: willBeBookmarked } : c
      ));
      showToast('success', willBeBookmarked ? '已收藏' : '已取消收藏');
    } catch (error) {
      console.error('收藏失败:', error);
      showToast('error', '收藏失败，请稍后重试');
    }
  }, [cases, showToast]);

  // 分享案例
  const handleShareCase = useCallback((caseItem: Case, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: caseItem.title,
        text: `${caseItem.title} - ${caseItem.symptoms.slice(0, 2).join(', ')}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${caseItem.title}: ${window.location.href}`);
      showToast('success', '链接已复制到剪贴板');
    }
  }, [showToast]);

  // 发布案例
  const handleCaseSubmit = useCallback(async (data: Case) => {
    try {
      const response = await caseAPI.create(data);
      const newCase = response.data.success ? response.data.data : response.data;
      setCases(prev => [newCase, ...prev]);
      showToast('success', '故障案例发布成功！');
      setShowSubmitModal(false);
    } catch (error) {
      console.error('发布案例失败:', error);
      showToast('error', '发布案例失败，请稍后重试');
    }
  }, [showToast]);

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'resolved':
        return { label: '已解决', className: 'bg-green-100 text-green-600' };
      case 'in_progress':
        return { label: '处理中', className: 'bg-yellow-100 text-yellow-600' };
      default:
        return { label: '待处理', className: 'bg-gray-100 text-gray-600' };
    }
  };

  // 获取质量显示
  const getQualityDisplay = (quality?: string) => {
    switch (quality) {
      case 'verified':
        return { label: '优质', className: 'bg-blue-100 text-blue-600', icon: CheckCircle };
      case 'standard':
        return { label: '标准', className: 'bg-green-100 text-green-600', icon: BookOpen };
      default:
        return { label: '基础', className: 'bg-gray-100 text-gray-600', icon: FileText };
    }
  };

  // 获取难度显示
  const getDifficultyDisplay = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { label: '简单', className: 'bg-green-100 text-green-600' };
      case 'medium':
        return { label: '中等', className: 'bg-yellow-100 text-yellow-600' };
      default:
        return { label: '困难', className: 'bg-red-100 text-red-600' };
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full bg-gradient-to-br from-slate-50 to-blue-50">
      {isClient && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "故障诊断库 - 运维经验分享社区",
            "description": "面向全网桌面运维工程师、IT外包、电脑办公用户的技术经验分享+AI自助排错社区"
          })}
        </script>
      )}

      {/* 页面标题区 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            故障诊断库
          </h2>
          <p className="text-sm text-text-muted mt-1">技术经验分享 + AI自助排错社区</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          <Lightbulb className="w-5 h-5" />
          分享经验
        </button>
      </div>

      {/* 区块1：顶部数据统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6" role="region" aria-label="统计数据">
        <div className="relative">
          <button
            onClick={() => handleStatCardClick('total')}
            className="w-full bg-white/90 border border-primary/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/10 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-theme-text">{stats.totalPosts}</p>
                <p className="text-sm text-text-muted">总经验帖</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-primary/70">
              <BarChart3 className="w-3 h-3" />
              <span onClick={(e) => { e.stopPropagation(); openTrendPopup('total'); }} className="cursor-pointer hover:underline">查看趋势</span>
              <ChevronRight className="w-3 h-3 ml-auto" />
            </div>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => handleStatCardClick('closed')}
            className="w-full bg-white/90 border border-green-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-green-100/50 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-theme-text">{stats.closedSolutions}</p>
                <p className="text-sm text-text-muted">完整闭环方案</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-green-600/70">
              <BarChart3 className="w-3 h-3" />
              <span onClick={(e) => { e.stopPropagation(); openTrendPopup('closed'); }} className="cursor-pointer hover:underline">查看趋势</span>
              <ChevronRight className="w-3 h-3 ml-auto" />
            </div>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => handleStatCardClick('weekly')}
            className="w-full bg-white/90 border border-blue-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-blue-100/50 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-theme-text">{stats.weeklyNew}</p>
                <p className="text-sm text-text-muted">本周新增分享</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600/70">
              <Calendar className="w-3 h-3" />
              <span>近7天新发布</span>
            </div>
          </button>
        </div>
      </div>

      {/* 趋势弹窗 */}
      {showTrendPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div ref={trendPopupRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {trendPopupType === 'total' && '总经验帖发布趋势'}
                {trendPopupType === 'closed' && '完整方案发布趋势'}
                {trendPopupType === 'weekly' && '本周新增分享趋势'}
              </h3>
              <button
                onClick={() => setShowTrendPopup(false)}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <LineChart 
              data={weeklyTrendData} 
              title={`近7天数据趋势`}
              color="#1677ff"
            />
            <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
              <span>总发布量: {weeklyTrendData.reduce((sum, d) => sum + d.value, 0)}</span>
              <span>日均发布: {Math.round(weeklyTrendData.reduce((sum, d) => sum + d.value, 0) / 7)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧主内容区 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 区块2：检索与分类筛选栏 */}
          <div className="bg-white/90 border border-primary/10 rounded-2xl p-4 shadow-sm">
            {/* 搜索框 */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索标题、故障描述、解决步骤、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-theme-bg border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                aria-label="搜索故障案例"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              )}
            </div>

            {/* 横向快速分类 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {categories.map((category) => {
                const Icon = categoryIcons[category.id];
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md'
                        : 'bg-theme-bg text-text-muted hover:bg-primary/10 hover:text-primary'
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* 复合筛选 */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <select
                  value={qualityFilter}
                  onChange={(e) => setQualityFilter(e.target.value as QualityFilter)}
                  className="px-3 py-2 bg-theme-bg border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="帖子质量"
                >
                  {qualityOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-text-muted" />
                <select
                  value={systemVersion}
                  onChange={(e) => setSystemVersion(e.target.value)}
                  className="px-3 py-2 bg-theme-bg border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="系统版本"
                >
                  {systemVersionOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <SortDesc className="w-4 h-4 text-text-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortRule)}
                  className="px-3 py-2 bg-theme-bg border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="排序方式"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 text-sm text-text-muted">
                共找到 <span className="font-semibold text-primary">{filteredCases.length}</span> 个案例
              </div>
            </div>
          </div>

          {/* 区块3：主内容区 - 卡片式案例流 */}
          {isLoading ? (
            /* 加载状态 */
            <div className="bg-white/90 border border-primary/10 rounded-2xl p-12 text-center shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-text-muted">加载中...</span>
              </div>
            </div>
          ) : filteredCases.length === 0 ? (
            /* 空页面引导 */
            <div className="bg-white/90 border border-primary/10 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-primary/60" />
              </div>
              <h3 className="text-2xl font-semibold text-theme-text mb-4">目前还没有运维小伙伴分享故障经验</h3>
              <div className="max-w-md mx-auto mb-8 text-left bg-primary/5 rounded-xl p-4">
                <p className="text-text-muted text-sm leading-relaxed">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full text-xs font-bold mr-2">1</span>
                  想解决电脑问题：使用右侧【智能诊断助手】自助查询修复方案
                </p>
                <p className="text-text-muted text-sm leading-relaxed mt-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full text-xs font-bold mr-2">2</span>
                  踩坑后想分享排错思路：点击右上角【分享经验】发布你的故障案例
                </p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => { 
                    setSearchQuery(''); 
                    setActiveCategory('all'); 
                    setQualityFilter('all'); 
                    setSystemVersion('all');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  浏览全部案例
                </button>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
                >
                  <Lightbulb className="w-4 h-4" />
                  发布故障经验
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4" role="list" aria-label="故障案例列表">
              {filteredCases.map((item) => {
                const statusDisplay = getStatusDisplay(item.status);
                const qualityDisplay = getQualityDisplay(item.quality);
                const difficultyDisplay = getDifficultyDisplay(item.difficulty);
                const QualityIcon = qualityDisplay.icon;
                const isHovered = hoveredCaseId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCase(item)}
                    onMouseEnter={() => setHoveredCaseId(item.id)}
                    onMouseLeave={() => setHoveredCaseId(null)}
                    className="bg-white/90 border border-primary/10 rounded-2xl p-5 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group relative overflow-hidden"
                    role="listitem"
                  >
                    {/* 卡片顶部标签行 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                          {statusDisplay.label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${qualityDisplay.className} flex items-center gap-1`}>
                          <QualityIcon className="w-3 h-3" />
                          {qualityDisplay.label}
                        </span>
                        {item.errorCode && item.errorCode !== '-' && (
                          <span className="px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-xs font-medium">
                            {item.errorCode}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${difficultyDisplay.className}`}>
                          {difficultyDisplay.label}
                        </span>
                      </div>
                      {item.verification && (
                        <div className="flex items-center gap-1 text-blue-500" title="已验证">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* 标题 */}
                    <h3 className="text-lg font-semibold text-theme-text mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    {/* 症状标签 */}
                    <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="症状标签">
                      {item.symptoms.slice(0, 3).map((symptom, index) => (
                        <span key={index} className="px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-xs">
                          {symptom}
                        </span>
                      ))}
                      {item.symptoms.length > 3 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">
                          +{item.symptoms.length - 3}
                        </span>
                      )}
                    </div>

                    {/* 作者信息 */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-theme-bg rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{item.author?.[0] || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-theme-text truncate">{item.author}</p>
                        <p className="text-xs text-text-muted">{item.deviceType} · {item.brand} {item.model}</p>
                      </div>
                      <div className="text-xs text-text-muted">
                        {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>

                    {/* 文字预览 */}
                    <p className="text-sm text-text-muted line-clamp-2 mb-4">
                      {item.solution}
                    </p>

                    {/* 底部互动数据栏 */}
                    <div className="flex items-center justify-between pt-3 border-t border-primary/5">
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        <div className="flex items-center gap-1" title={`${item.views}次浏览`}>
                          <Eye className="w-4 h-4" />
                          <span>{item.views}</span>
                        </div>
                        <button
                          onClick={(e) => handleLikeCase(item.id, e)}
                          className={`flex items-center gap-1 transition-colors ${item.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                          title={`点赞，当前${item.likes}个赞`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${item.isLiked ? 'fill-current' : ''}`} />
                          <span>{item.likes}</span>
                        </button>
                        <div className="flex items-center gap-1" title={`${item.comments}条评论`}>
                          <MessageSquare className="w-4 h-4" />
                          <span>{item.comments}</span>
                        </div>
                      </div>

                      {/* 悬浮操作按钮 */}
                      <div className={`flex items-center gap-2 transition-all ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                        <button
                          onClick={(e) => handleBookmarkCase(item.id, e)}
                          className={`p-2 rounded-lg transition-colors ${item.isBookmarked ? 'bg-yellow-50 text-yellow-500' : 'hover:bg-primary/10 text-text-muted hover:text-primary'}`}
                          title={item.isBookmarked ? '取消收藏' : '收藏'}
                        >
                          <Bookmark className={`w-4 h-4 ${item.isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleShareCase(item, e)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                          title="分享"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedCase(item); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
                        >
                          查看详情
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6">
          {/* 区块5：智能诊断助手 */}
          <DiagnosisAssistant onCaseSelect={setSelectedCase} />

          {/* 热门标签 */}
          <div className="bg-white/90 border border-primary/10 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              热门标签
            </h3>
            <div className="flex flex-wrap gap-2" role="list" aria-label="热门标签">
              {hotTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setSearchQuery(tag.name)}
                  className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-sm hover:bg-primary/15 hover:shadow-sm transition-all flex items-center gap-1.5"
                  role="listitem"
                >
                  {tag.name}
                  <span className="text-xs text-primary/50">{tag.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 引导卡片 */}
          <div className="bg-gradient-to-br from-primary via-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-primary/30">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              需要帮助？
            </h3>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">
              使用智能诊断助手，输入症状即可快速匹配解决方案
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-primary rounded-xl font-medium hover:bg-white/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                分享经验
              </button>
              <button
                onClick={() => document.querySelector('[aria-label="搜索故障案例"]')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
              >
                <Search className="w-4 h-4" />
                浏览全部
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      {selectedCase && (
        <CaseDetail
          case={selectedCase}
          onClose={() => setSelectedCase(null)}
          onLike={handleLikeCase}
          onBookmark={handleBookmarkCase}
          onShare={handleShareCase}
        />
      )}

      {/* 发帖表单弹窗 */}
      {showSubmitModal && (
        <CaseSubmit
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleCaseSubmit}
        />
      )}

      {/* Toast提示 */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up ${
          toastMessage.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`} role="alert" aria-live="polite">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 p-1 hover:bg-black/10 rounded-full transition-colors"
            aria-label="关闭提示"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
