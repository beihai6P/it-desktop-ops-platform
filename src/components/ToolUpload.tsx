import { useState } from 'react';
import { X, Image } from 'lucide-react';
import DirectUpload from './DirectUpload';
import { apiPost } from '@/scheduler';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fileId: string, fileName: string) => {
    setStorageFileId(fileId);
    setFileUploaded(true);
    console.log('File uploaded:', fileId, fileName);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newScreenshots: ScreenshotItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newScreenshots.push({ file, preview });
    }

    setScreenshots(prev => [...prev, ...newScreenshots]);
    e.target.value = '';
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => {
      const newList = prev.filter((_, i) => i !== index);
      return newList;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storageFileId) {
      alert('请先上传工具文件');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('longDescription', formData.longDescription);
      data.append('category', formData.category);
      data.append('type', formData.type);
      data.append('version', formData.version);
      data.append('license', formData.license);
      data.append('tags', formData.tags);
      data.append('compatibility', JSON.stringify(formData.compatibility.split(',').map((t: string) => t.trim()).filter(Boolean)));
      data.append('storageFileId', storageFileId);

      screenshots.forEach((screenshot) => {  
        data.append('screenshots', screenshot.file);
      });

      const response = await apiPost('/tools', data, { skipContentType: true });

      if (!response.success) {
        const errorMessage = response.message || '创建工具失败';
        throw new Error(errorMessage);
      }

      console.log('工具创建成功:', response.data);
      alert('工具上传成功！');

      onSubmit(data);
      onClose();
    } catch (error) {
      console.error('创建工具失败:', error);
      alert('创建工具失败: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['基础工具', '系统工具', '网络工具', '云工具', '其他'];
  const licenses = ['MIT', 'GPL', 'Apache', 'BSD', '其他'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">上传工具</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工具名称 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">请选择分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="script">脚本</option>
                <option value="tool">工具</option>
                <option value="plugin">插件</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">许可证</label>
              <select
                name="license"
                value={formData.license}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {licenses.map(license => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="多个标签用逗号分隔"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">兼容性</label>
            <input
              type="text"
              name="compatibility"
              value={formData.compatibility}
              onChange={handleInputChange}
              placeholder="多个系统用逗号分隔"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简短描述 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea
              name="longDescription"
              value={formData.longDescription}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工具文件 *</label>
            <DirectUpload
              onUploadComplete={handleFileUpload}
              category="archive"
              multiple={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">截图（可选）</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleScreenshotChange}
                className="hidden"
                id="screenshots"
              />
              <label
                htmlFor="screenshots"
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Image className="w-5 h-5 inline mr-2" />
                添加截图
              </label>
            </div>
            {screenshots.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {screenshots.map((screenshot, index) => (
                  <div key={index} className="relative">
                    <img
                      src={screenshot.preview}
                      alt={'截图 ' + (index + 1)}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeScreenshot(index)}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
