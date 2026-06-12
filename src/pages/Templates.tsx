import { useState, useEffect } from 'react';
import { Search, Plus, Edit3, Trash2, Copy, Check, FileText, FolderOpen } from 'lucide-react';
import type { Template } from '@/types';
import { templateAPI } from '@/services/api';

type FilterType = 'all' | 'active' | 'draft';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await templateAPI.getAll();
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'active' && template.status === 'verified') ||
      (activeFilter === 'draft' && template.status === 'draft');
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = async (data: { name: string; description: string; category: string; content: string }) => {
    const templateData = {
      title: data.name,
      category: data.category,
      type: 'diagnosis',
      author: 'admin',
      status: 'draft' as const,
      tags: [],
    };
    try {
      if (isEditing && selectedTemplate) {
        await templateAPI.update(selectedTemplate.id, templateData);
      } else {
        await templateAPI.create(templateData);
      }
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
    }
    setShowModal(false);
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await templateAPI.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleCopy = async (id: string) => {
    try {
      const template = templates.find(t => t.id === id);
      if (template) {
        const copyData = {
          title: `${template.title} (复制)`,
          category: template.category,
          type: template.type,
          author: 'admin',
          status: 'draft' as const,
          tags: template.tags,
        };
        await templateAPI.create(copyData);
      }
      setCopiedId(id);
      loadTemplates();
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy template:', error);
    }
  };

  const categories = ['全部', '诊断模板', '回复模板', '工单模板', '报告模板'];

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? '已发布' : '草稿';
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-theme-text">诊断模板</h2>
            <p className="text-sm text-text-muted mt-1">管理和使用诊断模板，提高工作效率</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
          >
            <Plus className="w-5 h-5" />
            新建模板
          </button>
        </div>

        <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索模板名称、描述或分类..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'active', 'draft'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeFilter === filter
                      ? 'bg-primary text-white'
                      : 'bg-theme-bg/50 text-text-muted hover:bg-gray-100'
                  }`}
                >
                  {filter === 'all' ? '全部' : filter === 'active' ? '已发布' : '草稿'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="col-span-2 text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-text-muted">没有找到匹配的模板</p>
              <p className="text-sm text-text-muted mt-1">尝试使用其他关键词搜索</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-5 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsEditing(true);
                  setShowModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-theme-text">{template.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(template.status)}`}>
                        {getStatusText(template.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-text-muted mb-4 line-clamp-2">{template.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-muted">{template.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(template.id);
                      }}
                      className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="复制模板"
                    >
                      {copiedId === template.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="删除模板"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  {isEditing ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-theme-text">
                    {isEditing ? '编辑模板' : '新建模板'}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {isEditing ? '修改现有模板内容' : '创建一个新的诊断模板'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setSelectedTemplate(null);
                }}
                className="p-2 text-text-muted hover:text-theme-text hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSubmit({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as string,
                  content: formData.get('content') as string,
                });
              }}
              className="p-6 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">模板名称</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedTemplate?.title || ''}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="输入模板名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">模板分类</label>
                <select
                  name="category"
                  defaultValue={selectedTemplate?.category || '诊断模板'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                >
                  {categories.filter((c) => c !== '全部').map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">模板描述</label>
                <textarea
                  name="description"
                  defaultValue={selectedTemplate?.title || ''}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                  placeholder="简要描述这个模板的用途"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">模板内容</label>
                <textarea
                  name="content"
                  defaultValue={''}
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none font-mono text-sm"
                  placeholder="输入诊断模板的详细内容..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-5 py-2.5 text-text-muted hover:text-theme-text hover:bg-gray-100 rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                >
                  {isEditing ? '保存修改' : '创建模板'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}