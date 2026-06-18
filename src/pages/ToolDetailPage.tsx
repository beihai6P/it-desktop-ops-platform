import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, Check, Clock, Calendar, FileText, Shield, ArrowLeft, Heart } from 'lucide-react';
import type { Tool } from '@/types';
import { toolAPI } from '@/services/api';
import CommentSection from '@/components/CommentSection';
import { apiDownloadPost } from '@/scheduler';

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const loadTool = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await toolAPI.getById(id);
      setTool(response.data.tool);
    } catch (err) {
      console.error('Failed to load tool:', err);
      setError('获取工具详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTool();
  }, [loadTool]);

  const handleDownload = async () => {
    if (!tool?.id) return;

    const confirmed = window.confirm('下载确认\n\n工具名称: ' + tool.name + '\n\n⚠️ 提示:\n本包含Windows工具程序(.exe或压缩包),\n下载后请根据这里管理器要求进行解压使用。\n\n安全提醒:\n- 本应用只提供简单的系统工具\n- 使用前请确认你了解此工具的功能\n- 如有任何疑问,请不要下载\n\n确定要下载吗?');

    if (!confirmed) return;

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

    } catch (err) {
      console.error('Download failed:', err);
      alert('下载失败: ' + (err as Error).message);
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleShare = async () => {
    if (!tool) return;
    
    try {
      const shareData = {
        title: tool.name,
        text: tool.description,
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">{error || '工具不存在'}</p>
        <button
          onClick={() => navigate('/tools')}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          返回工具列表
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tools')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <h1 className="text-xl font-bold text-gray-900">{tool.name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex gap-6">
                  <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-20 h-20 text-blue-400" />
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
              </div>

              <div className="grid grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{String((tool as unknown as Record<string, unknown>).downloadCount || 0)}</p>
                  <p className="text-sm text-gray-500">下载次数</p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{String((tool as unknown as Record<string, unknown>).starCount || 0)}</p>
                  <p className="text-sm text-gray-500">收藏数</p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{String((tool as unknown as Record<string, unknown>).viewCount || 0)}</p>
                  <p className="text-sm text-gray-500">浏览数</p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{String((tool as unknown as Record<string, unknown>).commentCount || 0)}</p>
                  <p className="text-sm text-gray-500">评论数</p>
                </div>
              </div>
            </div>

            {tool.longDescription && (
              <div className="bg-white rounded-xl shadow-sm border mt-6 p-6">
                <h2 className="text-lg font-semibold mb-4">详细介绍</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{tool.longDescription}</p>
                </div>
              </div>
            )}

            {tool.tags && tool.tags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border mt-6 p-6">
                <h2 className="text-lg font-semibold mb-4">标签</h2>
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
              <div className="bg-white rounded-xl shadow-sm border mt-6 p-6">
                <h2 className="text-lg font-semibold mb-4">兼容性</h2>
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
              <div className="bg-white rounded-xl shadow-sm border mt-6 p-6">
                <h2 className="text-lg font-semibold mb-4">截图</h2>
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

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  立即下载
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleFavorite}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-xl transition-colors ${isFavorited ? 'border-red-300 text-red-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Heart className="w-5 h-5" />
                    {isFavorited ? '已收藏' : '收藏'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    分享
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold mb-4">开发者信息</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">{tool.author.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{tool.author}</p>
                  <p className="text-sm text-gray-500">上传者</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShareToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg">
          链接已复制到剪贴板
        </div>
      )}
    </div>
  );
}
