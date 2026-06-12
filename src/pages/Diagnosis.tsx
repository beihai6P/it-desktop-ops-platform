import { useState, useEffect } from 'react';
import { Search, Cpu, Monitor, Printer, Wifi, HardDrive, Lightbulb, ArrowRight, Star, CheckCircle, Filter, SortDesc, Clock, Eye, AlertCircle, CheckCircle2, X, MessageSquare } from 'lucide-react';
import type { Case } from '@/types';
import CaseDetail from '@/components/CaseDetail';
import DiagnosisAssistant from '@/components/DiagnosisAssistant';
import CaseSubmit from '@/components/CaseSubmit';
import { mockCases } from '@/data/mockData';

const categories = [
  { id: 'all', name: '全部', icon: Cpu },
  { id: 'system', name: '系统故障', icon: Monitor },
  { id: 'network', name: '网络问题', icon: Wifi },
  { id: 'hardware', name: '硬件故障', icon: HardDrive },
  { id: 'printer', name: '打印机', icon: Printer },
];

const statusFilters = [
  { id: 'all', name: '全部状态' },
  { id: 'resolved', name: '已解决' },
  { id: 'in_progress', name: '处理中' },
  { id: 'pending', name: '待处理' },
];

const sortOptions = [
  { id: 'latest', name: '最新发布' },
  { id: 'views', name: '最多浏览' },
  { id: 'likes', name: '最多点赞' },
];

export default function Diagnosis() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCases = cases.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptoms.some((symptom) => symptom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.deviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === 'all' || 
      (activeCategory === 'system' && ['台式机', '笔记本', '虚拟桌面'].includes(item.deviceType)) ||
      (activeCategory === 'network' && item.tags.some((t) => ['网络', 'DNS', '连接', '超时'].includes(t))) ||
      (activeCategory === 'hardware' && item.deviceType === '虚拟桌面') ||
      (activeCategory === 'printer' && item.deviceType === '打印机');

    const matchesStatus = activeStatus === 'all' || item.status === activeStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.views - a.views;
      case 'likes':
        return b.likes - a.likes;
      case 'latest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-600';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return '已解决';
      case 'in_progress':
        return '处理中';
      default:
        return '待处理';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-red-100 text-red-600';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单';
      case 'medium':
        return '中等';
      default:
        return '困难';
    }
  };

  const handleCaseSubmit = (data: Case) => {
    try {
      setCases((prev) => [data, ...prev]);
      showToast('success', '故障案例发布成功！');
    } catch (error) {
      console.error('Failed to create case:', error);
      showToast('error', '发布失败，请重试');
    }
  };

  const handleLikeCase = (caseId: string) => {
    setCases((prev) => prev.map((c) => 
      c.id === caseId ? { ...c, likes: c.likes + 1 } : c
    ));
  };

  const stats = [
    { label: '案例总数', value: cases.length, icon: Cpu },
    { label: '已解决', value: cases.filter((c) => c.status === 'resolved').length, icon: CheckCircle },
    { label: '处理中', value: cases.filter((c) => c.status === 'in_progress').length, icon: Clock },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      {isClient && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "故障诊断库 - 萌萌的运维人",
            "description": "分享故障排查经验，共同解决运维难题",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": sortedCases.slice(0, 5).map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.title,
                "description": item.symptoms.join(', ')
              }))
            }
          })}
        </script>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-theme-text">故障诊断库</h2>
          <p className="text-sm text-text-muted mt-1">分享故障排查经验，共同解决运维难题</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          分享经验
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6" role="region" aria-label="统计数据">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white/85 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme-text">{stat.value}</p>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索故障案例、症状、设备..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="搜索故障案例"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-white/85 text-text-muted hover:bg-primary/10 hover:text-primary'
                    }`}
                    aria-pressed={isActive}
                    aria-label={`筛选${category.name}分类`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
                className="px-3 py-2 bg-white/85 border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="状态筛选"
              >
                {statusFilters.map((status) => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <SortDesc className="w-4 h-4 text-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white/85 border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="排序方式"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4" role="list" aria-label="故障案例列表">
            {sortedCases.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCase(item)}
                className="bg-white/85 border border-primary/20 rounded-xl p-5 hover:shadow-lg transition-all card-hover cursor-pointer"
                role="listitem"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    {item.errorCode !== '-' && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {item.errorCode}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                      {getDifficultyLabel(item.difficulty)}
                    </span>
                  </div>
                  {item.verification && (
                    <div className="flex items-center gap-1 text-green-600" role="img" aria-label="已验证">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-theme-text mb-2 line-clamp-2">{item.title}</h3>

                <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="症状标签">
                  {item.symptoms.slice(0, 3).map((symptom, index) => (
                    <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs" role="listitem">
                      {symptom}
                    </span>
                  ))}
                  {item.symptoms.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">
                      +{item.symptoms.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-theme-text">{item.deviceType}</p>
                      <p className="text-xs text-text-muted">{item.brand} {item.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <div className="flex items-center gap-1" role="img" aria-label={`${item.views}次浏览`}>
                      <Eye className="w-4 h-4" />
                      <span>{item.views}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeCase(item.id);
                      }}
                      className="flex items-center gap-1 text-primary hover:underline"
                      aria-label={`点赞，当前${item.likes}个赞`}
                    >
                      <Star className="w-4 h-4" />
                      <span>{item.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-primary hover:underline">
                      查看详情
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedCases.length === 0 && (
            <div className="text-center py-12">
              <Cpu className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <p className="text-text-muted">未找到匹配的故障案例</p>
              <p className="text-sm text-text-muted mt-1">请尝试调整搜索条件或选择其他分类</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <DiagnosisAssistant onCaseSelect={setSelectedCase} />

          <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold text-theme-text mb-4">热门标签</h3>
            <div className="flex flex-wrap gap-2" role="list" aria-label="热门标签">
              {['Windows', 'Office', '打印机', '网络', 'DNS', '虚拟桌面', '深信服', '更新', '故障', '性能'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                  role="listitem"
                  aria-label={`搜索${tag}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-light rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-2">需要帮助？</h3>
            <p className="text-sm text-white/80 mb-4">
              使用智能诊断助手，输入症状即可快速匹配解决方案
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              提交新案例
            </button>
          </div>
        </div>
      </div>

      {selectedCase && <CaseDetail case={selectedCase} onClose={() => setSelectedCase(null)} />}

      {showSubmitModal && (
        <CaseSubmit onClose={() => setShowSubmitModal(false)} onSubmit={handleCaseSubmit} />
      )}

      {toastMessage && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg z-50 ${
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
    </div>
  );
}