import { useState, useEffect } from 'react';
import { FileText, Search, Plus, Edit, Trash2, BookOpen, Eye, Clock, CheckCircle, X, Save } from 'lucide-react';
import { documentAPI } from '../services/api';

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: { id: string; name: string };
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  views: number;
}

const categories = ['操作系统', '脚本工具', '办公软件', '硬件设备', '安全合规', '网络管理', '其他'];

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '操作系统',
    tags: '',
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getAll();
      setDocuments(response.data?.documents || response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      if (editingDoc) {
        await documentAPI.update(editingDoc.id, {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: tagsArray,
        });
      } else {
        await documentAPI.create({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: tagsArray,
        });
      }
      loadDocuments();
      setShowModal(false);
      setEditingDoc(null);
      setFormData({ title: '', content: '', category: '操作系统', tags: '' });
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const handlePublish = async (docId: string) => {
    try {
      await documentAPI.publish(docId);
      loadDocuments();
    } catch (error) {
      console.error('Failed to publish document:', error);
    }
  };

  const handleUnpublish = async (docId: string) => {
    try {
      await documentAPI.unpublish(docId);
      loadDocuments();
    } catch (error) {
      console.error('Failed to unpublish document:', error);
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('确定要删除这个文档吗？')) {
      try {
        await documentAPI.delete(docId);
        loadDocuments();
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      tags: doc.tags.join(', '),
    });
    setShowModal(true);
  };

  const handleViewDetail = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDetailModal(true);
  };

  const getStatusLabel = (status: string) => status === 'published' ? '已发布' : '草稿';
  const getStatusColor = (status: string) => status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600';

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">文档管理</h2>
          <p className="text-sm text-text-muted mt-1">管理知识库文档</p>
        </div>
        <button onClick={() => { setEditingDoc(null); setFormData({ title: '', content: '', category: '操作系统', tags: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" />
          新建文档
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input type="text" placeholder="搜索文档标题或作者..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部分类</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">总文档数</p>
              <p className="text-2xl font-bold text-theme-text">{documents.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">已发布文档</p>
              <p className="text-2xl font-bold text-green-600">{documents.filter(d => d.status === 'published').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-theme-text truncate">{doc.title}</h3>
                  <p className="text-sm text-text-muted">{doc.author.name}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                {getStatusLabel(doc.status)}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {doc.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-text-muted text-xs rounded-lg">
                  {tag}
                </span>
              ))}
              {doc.tags.length > 3 && <span className="px-2 py-1 bg-gray-100 text-text-muted text-xs rounded-lg">+{doc.tags.length - 3}</span>}
            </div>

            <div className="flex items-center justify-between text-sm text-text-muted mb-4">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {doc.views}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {doc.createdAt}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => handleViewDetail(doc)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => handleEdit(doc)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              {doc.status === 'published' ? (
                <button onClick={() => handleUnpublish(doc.id)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                  <Clock className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => handlePublish(doc.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => handleDelete(doc.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-primary/20 mb-4" />
          <p className="text-text-muted">暂无文档数据</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-theme-text">{editingDoc ? '编辑文档' : '新建文档'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">标题</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">分类</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">标签（逗号分隔）</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="标签1, 标签2, 标签3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">内容</label>
                  <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" required />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingDoc ? '保存修改' : '创建文档'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-theme-text">{selectedDoc.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDoc.status)}`}>
                    {getStatusLabel(selectedDoc.status)}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {selectedDoc.category}
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
                  <span>作者: {selectedDoc.author.name}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedDoc.views} 阅读
                  </span>
                </div>
                <div>
                  <span>创建: {selectedDoc.createdAt}</span>
                  <span className="ml-4">更新: {selectedDoc.updatedAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedDoc.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-text-muted text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-theme-text whitespace-pre-wrap">{selectedDoc.content}</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { handleEdit(selectedDoc); setShowDetailModal(false); }} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">编辑文档</button>
                {selectedDoc.status === 'published' ? (
                  <button onClick={() => { handleUnpublish(selectedDoc.id); setShowDetailModal(false); }} className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors">下架文档</button>
                ) : (
                  <button onClick={() => { handlePublish(selectedDoc.id); setShowDetailModal(false); }} className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">发布文档</button>
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
