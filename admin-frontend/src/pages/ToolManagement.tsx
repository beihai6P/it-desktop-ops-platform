import { useState, useEffect } from 'react';
import { Wrench, Search, Plus, Edit, Trash2, Download, Star, CheckCircle, X, Save } from 'lucide-react';
import { toolAPI } from '../services/api';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  downloadUrl: string;
  author: { id: string; name: string };
  status: 'pending' | 'verified' | 'featured';
  downloads: number;
  stars: number;
  createdAt: string;
}

const categories = ['系统工具', '开发工具', '运维工具', '安全工具', '办公工具', '其他'];

export default function ToolManagement() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '系统工具',
    tags: '',
    downloadUrl: '',
  });

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    try {
      const response = await toolAPI.getAll();
      setTools(response.data?.tools || response.tools || []);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      if (editingTool) {
        await toolAPI.update(editingTool.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: tagsArray,
        });
      } else {
        await toolAPI.create({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: tagsArray,
          downloadUrl: formData.downloadUrl,
        });
      }
      loadTools();
      setShowModal(false);
      setEditingTool(null);
      setFormData({ name: '', description: '', category: '系统工具', tags: '', downloadUrl: '' });
    } catch (error) {
      console.error('Failed to save tool:', error);
    }
  };

  const handleVerify = async (toolId: string) => {
    try {
      await toolAPI.verify(toolId);
      loadTools();
    } catch (error) {
      console.error('Failed to verify tool:', error);
    }
  };

  const handleFeature = async (toolId: string) => {
    try {
      await toolAPI.feature(toolId);
      loadTools();
    } catch (error) {
      console.error('Failed to feature tool:', error);
    }
  };

  const handleDelete = async (toolId: string) => {
    if (confirm('确定要删除这个工具吗？')) {
      try {
        await toolAPI.delete(toolId);
        loadTools();
      } catch (error) {
        console.error('Failed to delete tool:', error);
      }
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      tags: tool.tags.join(', '),
      downloadUrl: tool.downloadUrl,
    });
    setShowModal(true);
  };

  const handleViewDetail = (tool: Tool) => {
    setSelectedTool(tool);
    setShowDetailModal(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { pending: '待审核', verified: '已审核', featured: '推荐' };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-600',
      verified: 'bg-green-100 text-green-600',
      featured: 'bg-purple-100 text-purple-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">工具管理</h2>
          <p className="text-sm text-text-muted mt-1">管理平台工具库</p>
        </div>
        <button onClick={() => { setEditingTool(null); setFormData({ name: '', description: '', category: '系统工具', tags: '', downloadUrl: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" />
          新建工具
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input type="text" placeholder="搜索工具名称或描述..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部分类</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="verified">已审核</option>
            <option value="featured">推荐</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">工具总数</p>
              <p className="text-2xl font-bold text-theme-text">{tools.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">待审核</p>
              <p className="text-2xl font-bold text-yellow-600">{tools.filter(t => t.status === 'pending').length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Edit className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">推荐工具</p>
              <p className="text-2xl font-bold text-purple-600">{tools.filter(t => t.status === 'featured').length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-theme-text truncate">{tool.name}</h3>
                  <p className="text-sm text-text-muted">{tool.author.name}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                {getStatusLabel(tool.status)}
              </span>
            </div>

            <p className="text-sm text-text-muted mb-3 line-clamp-2">{tool.description}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {tool.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-text-muted text-xs rounded-lg">
                  {tag}
                </span>
              ))}
              {tool.tags.length > 3 && <span className="px-2 py-1 bg-gray-100 text-text-muted text-xs rounded-lg">+{tool.tags.length - 3}</span>}
            </div>

            <div className="flex items-center justify-between text-sm text-text-muted mb-4">
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {tool.downloads}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {tool.stars}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => handleViewDetail(tool)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => handleEdit(tool)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              {tool.status === 'pending' && (
                <button onClick={() => handleVerify(tool.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {tool.status !== 'featured' && (
                <button onClick={() => handleFeature(tool.id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => handleDelete(tool.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="w-16 h-16 mx-auto text-primary/20 mb-4" />
          <p className="text-text-muted">暂无工具数据</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-theme-text">{editingTool ? '编辑工具' : '新建工具'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">工具名称</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">分类</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">下载链接</label>
                <input type="url" value={formData.downloadUrl} onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">标签（逗号分隔）</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="标签1, 标签2, 标签3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingTool ? '保存修改' : '创建工具'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-theme-text">{selectedTool.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTool.status)}`}>
                    {getStatusLabel(selectedTool.status)}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {selectedTool.category}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="flex items-center justify-between mb-6 text-sm text-text-muted">
                <div className="flex items-center gap-4">
                  <span>作者: {selectedTool.author.name}</span>
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {selectedTool.downloads} 下载
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {selectedTool.stars} 收藏
                  </span>
                </div>
                <div>
                  <span>创建: {selectedTool.createdAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedTool.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-text-muted text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-sm text-text-muted mb-2">描述</p>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-theme-text">{selectedTool.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-text-muted mb-2">下载链接</p>
                <a href={selectedTool.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>{selectedTool.downloadUrl}</span>
                </a>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { handleEdit(selectedTool); setShowDetailModal(false); }} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">编辑工具</button>
                {selectedTool.status === 'pending' && (
                  <button onClick={() => { handleVerify(selectedTool.id); setShowDetailModal(false); }} className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">审核通过</button>
                )}
                {selectedTool.status !== 'featured' && (
                  <button onClick={() => { handleFeature(selectedTool.id); setShowDetailModal(false); }} className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">设为推荐</button>
                )}
                <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-text-muted rounded-xl hover:bg-gray-200 transition-colors">关闭</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
