import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save, ChevronRight, Tag, Folder, Hash, BookOpen, Newspaper, Zap, HelpCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
  createdAt: string;
}

const iconOptions = [
  { value: 'tag', label: '标签', icon: Tag },
  { value: 'folder', label: '文件夹', icon: Folder },
  { value: 'hash', label: '哈希', icon: Hash },
  { value: 'book', label: '书籍', icon: BookOpen },
  { value: 'news', label: '新闻', icon: Newspaper },
  { value: 'zap', label: '闪电', icon: Zap },
  { value: 'help', label: '帮助', icon: HelpCircle },
];

const mockCategories: Category[] = [
  { id: '1', name: '技术讨论', description: '讨论各种IT技术问题和解决方案', icon: 'zap', postCount: 128, createdAt: '2024-01-15' },
  { id: '2', name: '故障求助', description: '发布故障问题，寻求帮助', icon: 'help', postCount: 89, createdAt: '2024-01-16' },
  { id: '3', name: '经验分享', description: '分享运维经验和技巧', icon: 'book', postCount: 156, createdAt: '2024-01-17' },
  { id: '4', name: '工具推荐', description: '推荐实用的运维工具', icon: 'tag', postCount: 67, createdAt: '2024-01-18' },
  { id: '5', name: '行业资讯', description: '分享IT行业最新资讯', icon: 'news', postCount: 45, createdAt: '2024-01-19' },
];

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'tag',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        setCategories(mockCategories);
      }
    } catch (error) {
      logger.error('Failed to load categories:', error);
      setCategories(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) return;
    
    const category: Category = {
      id: `cat-${Date.now()}`,
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      icon: newCategory.icon,
      postCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setCategories([category, ...categories]);
    setShowCreateModal(false);
    setNewCategory({ name: '', description: '', icon: 'tag' });
  };

  const handleEditCategory = () => {
    if (!editingCategory || !newCategory.name.trim()) return;
    
    setCategories(categories.map((cat) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: newCategory.name.trim(),
            description: newCategory.description.trim(),
            icon: newCategory.icon,
          }
        : cat
    ));
    setShowEditModal(false);
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', icon: 'tag' });
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm('确定要删除这个分类吗？该分类下的帖子将被移动到默认分类。')) return;
    
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description,
      icon: category.icon,
    });
    setShowEditModal(true);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName);
    return iconOption?.icon || Tag;
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-theme-text">分类管理</h2>
            <p className="text-sm text-text-muted mt-1">管理社区帖子分类</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加分类
          </button>
        </div>

        <div className="bg-white/85 border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="搜索分类名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <div
                  key={category.id}
                  className="bg-white/85 border border-primary/20 rounded-xl p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-theme-text">{category.name}</h3>
                        <p className="text-sm text-text-muted">{category.postCount} 篇帖子</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(category)}
                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">{category.description}</p>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>创建于 {category.createdAt}</span>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      查看帖子 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/85 border border-primary/20 rounded-xl p-12 text-center">
            <Folder className="w-16 h-16 mx-auto text-primary/20 mb-4" />
            <p className="text-text-muted">暂无分类</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
            >
              创建第一个分类
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-primary/10">
              <h2 className="text-xl font-bold text-theme-text">添加分类</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">分类名称 *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="输入分类名称..."
                  className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">分类描述</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="输入分类描述..."
                  rows={3}
                  className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">图标</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((option) => {
                    const IconComp = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setNewCategory({ ...newCategory, icon: option.value })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                          newCategory.icon === option.value
                            ? 'bg-primary text-white'
                            : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-primary/10 bg-white">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-primary/5 text-text-muted rounded-xl hover:bg-primary/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-primary/10">
              <h2 className="text-xl font-bold text-theme-text">编辑分类</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">分类名称 *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="输入分类名称..."
                  className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">分类描述</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="输入分类描述..."
                  rows={3}
                  className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text mb-2">图标</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((option) => {
                    const IconComp = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setNewCategory({ ...newCategory, icon: option.value })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                          newCategory.icon === option.value
                            ? 'bg-primary text-white'
                            : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-primary/10 bg-white">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-primary/5 text-text-muted rounded-xl hover:bg-primary/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleEditCategory}
                  disabled={!newCategory.name.trim()}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}