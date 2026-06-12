import { useState } from 'react';
import { X, FileText, Upload, Tag, Save, Eye } from 'lucide-react';

interface DocumentUploadProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

const categories = ['操作系统', '脚本工具', '办公软件', '硬件设备', '安全合规', '网络管理', '系统维护'];
const types = ['指南', '手册', '脚本', '规范', '流程', '教程'];

export default function DocumentUpload({ onClose, onSubmit }: DocumentUploadProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    type: '',
    description: '',
    content: '',
    tags: '',
    version: 'v1.0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('type', formData.type);
    data.append('description', formData.description);
    data.append('content', formData.content);
    data.append('tags', formData.tags);
    data.append('version', formData.version);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSubmit(data);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      type: '',
      description: '',
      content: '',
      tags: '',
      version: 'v1.0',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-text">上传文档</h2>
              <p className="text-sm text-text-muted">分享您的专业知识</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {!showPreview ? (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">文档标题 *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="请输入文档标题"
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-2">分类 *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">请选择分类</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-text mb-2">类型 *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">请选择类型</option>
                      {types.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">版本号</label>
                  <input
                    type="text"
                    name="version"
                    value={formData.version}
                    onChange={handleChange}
                    placeholder="v1.0"
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">简介描述</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="简要描述文档内容..."
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    标签
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="多个标签用逗号分隔"
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">文档内容 *</label>
                  <div className="relative">
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      required
                      rows={16}
                      placeholder="支持 Markdown 格式...&#10;&#10;# 标题&#10;## 子标题&#10;&#10;**粗体** *斜体*&#10;&#10;- 列表项1&#10;- 列表项2&#10;&#10;```代码块```"
                      className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-5 py-2.5 border border-primary/20 text-primary rounded-xl hover:bg-primary/5 transition-colors"
              >
                <Eye className="w-4 h-4" />
                预览
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-theme-text rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存草稿
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {isSubmitting ? '上传中...' : '立即发布'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 text-text-muted hover:text-theme-text transition-colors"
              >
                返回编辑
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                  {formData.type || '未选择'}
                </span>
                <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm">
                  {formData.category || '未选择'}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm">
                  {formData.version}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-theme-text mb-2">{formData.title || '文档标题'}</h1>
              <p className="text-text-muted mb-6">{formData.description || '文档描述'}</p>

              {formData.tags && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {formData.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose prose-gray max-w-none">
                {formData.content ? (
                  <pre className="whitespace-pre-wrap text-text-muted font-sans">{formData.content}</pre>
                ) : (
                  <p className="text-text-muted italic">文档内容预览区域</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 mt-6">
              <button
                onClick={() => setShowPreview(false)}
                className="px-5 py-2.5 border border-primary/20 text-primary rounded-xl hover:bg-primary/5 transition-colors"
              >
                返回编辑
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isSubmitting ? '上传中...' : '确认发布'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}