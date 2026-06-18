import { Download, Eye, Star, Share2, Check, Clock, Calendar, FileText, Shield } from 'lucide-react';
import type { Tool } from '@/types';
import CommentSection from './CommentSection';
import { apiDownloadPost } from '@/scheduler';

interface ToolDetailProps {
  tool: Tool;
  onClose: () => void;
}

export default function ToolDetail({ tool, onClose }: ToolDetailProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'script':
        return <span className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">脚本</span>;
      case 'tool':
        return <span className="px-3 py-1.5 bg-green-100 text-green-600 rounded-full text-sm font-medium">工具</span>;
      case 'plugin':
        return <span className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">插件</span>;
      default:
        return null;
    }
  };

  const handleDownload = async () => {
    try {
      const result = await apiDownloadPost('/tools/' + tool.id + '/download?_t=' + Date.now());

      if (!result) {
        throw new Error('下载失败');
      }

      const { blob, filename } = result;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || tool.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败: ' + (error as Error).message);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatVersion = (version: string) => {
    if (!version.startsWith('v')) {
      return 'v' + version;
    }
    return version;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{tool.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-6 mb-6">
            <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-24 h-24 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {getTypeBadge(tool.type)}
                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{tool.category}</span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{formatVersion(tool.version)}</span>
              </div>
              <p className="text-gray-600 mb-4">{tool.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(tool.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  更新于 {formatDate(tool.updatedAt)}
                </span>
                {tool.license && (
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {tool.license}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{String((tool as unknown as Record<string, unknown>).downloadCount || 0)}</p>
              <p className="text-sm text-gray-500">下载次数</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{String((tool as unknown as Record<string, unknown>).starCount || 0)}</p>
              <p className="text-sm text-gray-500">收藏数</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{String((tool as unknown as Record<string, unknown>).commentCount || 0)}</p>
              <p className="text-sm text-gray-500">评论数</p>
            </div>
          </div>

          {tool.longDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">详细介绍</h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">{tool.longDescription}</p>
              </div>
            </div>
          )}

          {tool.tags && tool.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">标签</h3>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tool.compatibility && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">兼容性</h3>
              <div className="flex flex-wrap gap-2">
                {tool.compatibility.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tool.screenshots && tool.screenshots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">截图</h3>
              <div className="grid grid-cols-2 gap-4">
                {tool.screenshots.map((screenshot, index) => (
                  <img
                    key={index}
                    src={screenshot}
                    alt={`截图 ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          <CommentSection toolId={tool.id} comments={[]} />
        </div>

        <div className="p-6 border-t flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Star className="w-5 h-5" />
              收藏
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="w-5 h-5" />
              预览
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              下载
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
