import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'case' | 'document' | 'user';
  title: string;
  content: string;
  author: string;
  createdAt: string;
  tags: string[];
  likes: number;
  views: number;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'case',
    title: 'Win11更新后蓝屏0x0000007B故障解决',
    content: '通过修改注册表和更新驱动成功解决...',
    author: '运维工程师A',
    createdAt: '2026-06-20',
    tags: ['Win11', '蓝屏', '驱动'],
    likes: 45,
    views: 1230
  },
  {
    id: '2',
    type: 'document',
    title: '打印机脱机问题全面排查指南',
    content: '包含网络打印、USB打印、共享打印等多种场景...',
    author: '技术达人B',
    createdAt: '2026-06-19',
    tags: ['打印机', '排查指南'],
    likes: 89,
    views: 3456
  },
  {
    id: '3',
    type: 'case',
    title: 'DNS缓存污染导致网页无法访问',
    content: '刷新DNS缓存、更换DNS服务器后解决...',
    author: '网络专家C',
    createdAt: '2026-06-18',
    tags: ['DNS', '网络'],
    likes: 32,
    views: 876
  }
];

const typeLabels = {
  case: '故障案例',
  document: '知识文档',
  user: '用户'
};

export default function CommunitySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const filtered = mockResults.filter(r => 
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setResults(filtered);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(r => r.type === selectedType);

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">社区搜索</h1>
          <p className="text-gray-600">搜索故障案例、知识文档和用户</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索故障案例、知识文档..."
                className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button 
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              筛选
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                {['all', 'case', 'document', 'user'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === type 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'all' ? '全部' : typeLabels[type as keyof typeof typeLabels]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isSearching && (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              搜索中...
            </div>
          )}

          {!isSearching && searchQuery && filteredResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600 mb-2">未找到相关结果</p>
              <p className="text-sm">尝试更换关键词或筛选条件</p>
            </div>
          )}

          {!isSearching && filteredResults.map((result) => (
            <div 
              key={result.id} 
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.type === 'case' 
                      ? 'bg-orange-100 text-orange-700' 
                      : result.type === 'document'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {typeLabels[result.type]}
                  </span>
                  <span className="text-sm text-gray-500">{result.author}</span>
                  <span className="text-sm text-gray-400">·</span>
                  <span className="text-sm text-gray-500">{result.createdAt}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{result.content}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {result.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>👁 {result.views}</span>
                  <span>❤️ {result.likes}</span>
                </div>
              </div>
            </div>
          ))}

          {!searchQuery && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600 mb-2">输入关键词搜索</p>
              <p className="text-sm">输入故障关键词、错误代码或解决方案来搜索社区内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
