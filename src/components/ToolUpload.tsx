import { useState, useCallback } from 'react';
import { X, Check, Image, X as XIcon } from 'lucide-react';
import DirectUpload from './DirectUpload';
import { toolAPI } from '@/services/api';

interface ToolUploadProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

interface ScreenshotItem {
  file: File;
  preview: string;
}

export default function ToolUpload({ onClose, onSubmit }: ToolUploadProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    longDescription: '',
    category: '',
    type: 'script' as 'script' | 'tool' | 'plugin',
    version: 'v1.0.0',
    license: 'MIT',
    tags: '',
    compatibility: '',
  });
  const [storageFileId, setStorageFileId] = useState<string>('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScreenshotChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setScreenshots((prev) => [...prev, ...newFiles]);
    }
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  const removeScreenshot = useCallback((index: number) => {
    const screenshot = screenshots[index];
    if (screenshot) {
      URL.revokeObjectURL(screenshot.preview);
    }
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    setScreenshots(newScreenshots);
  }, [screenshots]);

  const handleFileUploadComplete = (fileId: string) => {
    setStorageFileId(fileId);
    setFileUploaded(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storageFileId) {
      return;
    }

    const typeValue = formData.type;
    
    // 使用 FormData 格式上传，包含截图文件
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('longDescription', formData.longDescription);
    data.append('category', formData.category);
    data.append('type', (typeValue === 'script' || typeValue === 'plugin' ? typeValue : 'tool'));
    data.append('tags', JSON.stringify(formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)));
    data.append('version', formData.version);
    data.append('license', formData.license);
    data.append('compatibility', JSON.stringify(formData.compatibility.split(',').map((t: string) => t.trim()).filter(Boolean)));
    data.append('storageFileId', storageFileId);

    // 添加截图文件（multer.array 需要相同字段名）
    screenshots.forEach((screenshot) => {
      data.append('screenshots', screenshot.file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error || '创建工具失败';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('工具创建成功:', result);
      alert('工具上传成功！');
      
      onSubmit(data);
      onClose();
    } catch (error) {
      console.error('创建工具失败:', error);
      alert(`创建工具失败: ${error.message}`);
    }
  };

  const categories = ['脚本工具', '系统工具', '硬件工具', '网络工具', '其他'];
  const licenses = ['MIT', 'GPL', 'Apache', 'BSD', '其他'];
  const compatibilities = ['Windows 10', 'Windows 11', 'Windows Server 2019', 'Windows Server 2022'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <h3 className="text-xl font-semibold text-theme-text">上传工具</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">工具名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="输入工具名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">版本号</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
                className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="v1.0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">分类 *</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                required
                className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="script">脚本</option>
                <option value="tool">工具</option>
                <option value="plugin">插件</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">简短描述 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              rows={2}
              className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="简要描述工具的功能"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">详细描述</label>
            <textarea
              value={formData.longDescription}
              onChange={(e) => handleChange('longDescription', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="详细描述工具的功能特性、使用方法等"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">许可证</label>
              <select
                value={formData.license}
                onChange={(e) => handleChange('license', e.target.value)}
                className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {licenses.map((license) => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-2">标签 <span className="text-text-muted font-normal">(逗号分隔)</span></label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="标签1, 标签2, 标签3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">兼容性</label>
            <div className="flex flex-wrap gap-2">
              {compatibilities.map((comp) => (
                <label
                  key={comp}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    formData.compatibility.includes(comp)
                      ? 'bg-primary text-white'
                      : 'bg-theme-bg/50 text-text-muted hover:bg-primary/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.compatibility.includes(comp)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleChange('compatibility', formData.compatibility + ',' + comp);
                      } else {
                        handleChange('compatibility', formData.compatibility.replace(',' + comp, ''));
                      }
                    }}
                    className="sr-only"
                  />
                  {comp}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">上传文件 *</label>
            <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-theme-bg/30">
              <DirectUpload 
                onUploadComplete={handleFileUploadComplete} 
                category="archive" 
                accessLevel="public"
              />
            </div>
            {fileUploaded && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                文件上传成功！文件ID: {storageFileId.slice(0, 8)}...
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">预览截图（可选）</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <div className="flex flex-col items-center justify-center py-2">
                <Image className="w-8 h-8 text-primary/50 mb-1" />
                <p className="text-sm text-text-muted">点击上传截图</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleScreenshotChange}
                className="hidden"
              />
            </label>
            {screenshots.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {screenshots.map((item, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={item.preview}
                      alt={`截图 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeScreenshot(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-primary/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
              disabled={!fileUploaded}
            >
              {fileUploaded ? '上传工具' : '请先上传工具文件'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}