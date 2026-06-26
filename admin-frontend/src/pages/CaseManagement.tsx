﻿﻿﻿import { useState, useEffect } from 'react';
import { FileWarning, Search, Plus, Edit, Trash2, AlertTriangle, Clock, CheckCircle, X, Save } from 'lucide-react';
import { caseAPI } from '../services/api';

interface Case {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  status: 'pending' | 'verified' | 'resolved';
  author: { id: string; name: string };
  createdAt: string;
}

const categories = ['系统故障', '网络问题', '软件错误', '硬件故障', '安全事件', '其他'];

export default function CaseManagement() {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '系统故障',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    symptoms: '',
  });

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const response = await caseAPI.getAll();
      setCases(response.data?.cases || response.cases || []);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const symptomsArray = formData.symptoms.split(',').map(t => t.trim()).filter(t => t);
      if (editingCase) {
        await caseAPI.update(editingCase.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          severity: formData.severity,
        });
      } else {
        await caseAPI.create({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          severity: formData.severity,
          symptoms: symptomsArray,
        });
      }
      loadCases();
      setShowModal(false);
      setEditingCase(null);
      setFormData({ title: '', description: '', category: '系统故障', severity: 'medium', symptoms: '' });
    } catch (error) {
      console.error('Failed to save case:', error);
    }
  };

  const handleVerify = async (caseId: string) => {
    try {
      await caseAPI.verify(caseId);
      loadCases();
    } catch (error) {
      console.error('Failed to verify case:', error);
    }
  };

  const handleDelete = async (caseId: string) => {
    if (confirm('确定要删除这个案例吗？')) {
      try {
        await caseAPI.delete(caseId);
        loadCases();
      } catch (error) {
        console.error('Failed to delete case:', error);
      }
    }
  };

  const handleEdit = (c: Case) => {
    setEditingCase(c);
    setFormData({
      title: c.title,
      description: c.description,
      category: c.category,
      severity: c.severity,
      symptoms: c.symptoms.join(', '),
    });
    setShowModal(true);
  };

  const handleViewDetail = (c: Case) => {
    setSelectedCase(c);
    setShowDetailModal(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { pending: '待审核', verified: '已审核', resolved: '已解决' };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-600',
      verified: 'bg-blue-100 text-blue-600',
      resolved: 'bg-green-100 text-green-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
    return labels[severity] || severity;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-600',
      medium: 'bg-yellow-100 text-yellow-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600',
    };
    return colors[severity] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">案例管理</h2>
          <p className="text-sm text-text-muted mt-1">管理故障案例库</p>
        </div>
        <button onClick={() => { setEditingCase(null); setFormData({ title: '', description: '', category: '系统故障', severity: 'medium', symptoms: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" />
          新建案例
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input type="text" placeholder="搜索案例标题或描述..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部分类</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部严重程度</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">严重</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">案例总数</p>
              <p className="text-2xl font-bold text-theme-text">{cases.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileWarning className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">待审核</p>
              <p className="text-2xl font-bold text-yellow-600">{cases.filter(c => c.status === 'pending').length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">已解决</p>
              <p className="text-2xl font-bold text-green-600">{cases.filter(c => c.status === 'resolved').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">案例信息</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">分类</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">严重程度</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">提交人</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">创建时间</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-muted">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCases.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 cursor-pointer" onClick={() => handleViewDetail(c)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-theme-text">{c.title}</p>
                      <p className="text-sm text-text-muted line-clamp-1">{c.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {c.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {getSeverityLabel(c.severity)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {getStatusLabel(c.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-text-muted">{c.author.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-text-muted">{c.createdAt}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleViewDetail(c)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(c)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    {c.status === 'pending' && (
                      <button onClick={() => handleVerify(c.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <FileWarning className="w-16 h-16 mx-auto text-primary/20 mb-4" />
            <p className="text-text-muted">暂无案例数据</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-theme-text">{editingCase ? '编辑案例' : '新建案例'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">标题</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">分类</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">严重程度</label>
                  <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="critical">严重</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">症状描述（逗号分隔）</label>
                <input type="text" value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="症状1, 症状2, 症状3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">详细描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingCase ? '保存修改' : '创建案例'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-theme-text">{selectedCase.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {getStatusLabel(selectedCase.status)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {getSeverityLabel(selectedCase.severity)}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {selectedCase.category}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="flex items-center justify-between mb-6 text-sm text-text-muted">
                <div>
                  <span>作者: {selectedCase.author.name}</span>
                </div>
                <div>
                  <span>创建: {selectedCase.createdAt}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-text-muted mb-2">症状表现</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.symptoms.map(symptom => (
                    <span key={symptom} className="px-3 py-1 bg-gray-100 text-text-muted text-sm rounded-full">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-text-muted mb-2">详细描述</p>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-theme-text whitespace-pre-wrap">{selectedCase.description}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { handleEdit(selectedCase); setShowDetailModal(false); }} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">编辑案例</button>
                {selectedCase.status === 'pending' && (
                  <button onClick={() => { handleVerify(selectedCase.id); setShowDetailModal(false); }} className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">审核通过</button>
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
