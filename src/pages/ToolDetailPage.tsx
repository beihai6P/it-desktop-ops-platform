import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Eye, Star, Share2, Check, Clock, Calendar, FileText, Shield, ArrowLeft, Heart } from 'lucide-react';
import type { Tool } from '@/types';
import { toolAPI } from '@/services/api';
import CommentSection from '@/components/CommentSection';

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    loadTool();
  }, [id]);

  const loadTool = async () => {
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
  };

  const handleDownload = async () => {
    if (!tool?.id) return;
    try {
      const token = localStorage.getItem('token') || '';
      
      // 加时间戳防缓存
      const response = await fetch(`http://localhost:5000/api/tools/${tool.id}/download?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('下载失败');
      }

      // 获取后端返回的实际Content-Type
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      
      // 强制接收二进制，不解析成文本
      const arrayBuffer = await response.arrayBuffer();
      
      // 动态声明文件类型，使用后端返回的Content-Type
      const blob = new Blob([arrayBuffer], { type: contentType });
      
      // 优先使用后端返回的Content-Disposition中的文件名，否则根据Content-Type生成
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${tool.name}`;
      
      if (contentDisposition) {
        const utf8Regex = /filename\*=UTF-8''([^;]+)/i;
        const matchUtf8 = contentDisposition.match(utf8Regex);
        
        const matchIso = contentDisposition.match(/filename="([^"]+)"/);
        const matchSimple = contentDisposition.match(/filename=([^;\r\n "]+)/);
        
        if (matchUtf8 && matchUtf8[1]) {
          try {
            const decoded = decodeURIComponent(matchUtf8[1]);
            filename = decoded;
          } catch {
          }
        } else if (matchIso && matchIso[1]) {
          filename = matchIso[1];
        } else if (matchSimple && matchSimple[1]) {
          filename = matchSimple[1].trim();
        }
      } else {
        // 如果后端没有返回Content-Disposition，根据Content-Type生成扩展名
        const extensionMap: Record<string, string> = {
          'application/zip': '.zip',
          'application/x-zip-compressed': '.zip',
          'application/x-rar-compressed': '.rar',
          'application/x-7z-compressed': '.7z',
          'application/gzip': '.gz',
          'application/x-tar': '.tar',
          'application/octet-stream': '.exe', // 默认exe
          'application/exe': '.exe',
          'application/x-msdownload': '.exe',
          'application/pdf': '.pdf',
          'image/png': '.png',
          'image/jpeg': '.jpg',
          'image/gif': '.gif',
        };
        
        const ext = extensionMap[contentType] || '.exe';
        filename = `${tool.name}${ext}`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // 延长清理时间，确保下载完成
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

      setTool(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);
    } catch (err) {
      console.error('下载失败:', err);
      alert('下载失败，请重试');
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    setTool(prev => prev ? { ...prev, stars: isFavorited ? (prev.stars || 0) - 1 : (prev.stars || 0) + 1 } : null);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/tools/${tool?.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: tool?.name || '工具分享',
          text: tool?.description || '',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (err) {
      console.error('分享失败:', err);
      await navigator.clipboard.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="w-16 h-16 text-primary/30 mb-4" />
        <p className="text-text-muted">{error || '工具不存在'}</p>
        <button
          onClick={() => navigate('/tools')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          返回工具列表
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg relative">
      {showShareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-theme-text text-white px-6 py-3 rounded-xl shadow-lg z-[100]">
          链接已复制到剪贴板
        </div>
      )}
      <header className="bg-white/85 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/tools')}
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回工具列表
            </button>
            <h1 className="text-lg font-semibold text-theme-text">工具详情</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-theme-text">{tool.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      {getTypeBadge(tool.type)}
                      {tool.isVerified && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <Check className="w-4 h-4" />
                          已验证
                        </span>
                      )}
                      {tool.isFeatured && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                          精选工具
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-text-muted">{tool.description}</p>
            </div>

            {tool.screenshots && tool.screenshots.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-primary/20">
                <h3 className="text-lg font-semibold text-theme-text mb-4">预览截图</h3>
                <div className="grid gap-4">
                  {tool.screenshots.map((screenshot, index) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`截图 ${index + 1}`}
                      className="w-full rounded-xl object-cover h-64 bg-gray-100"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-theme-text mb-4">详细描述</h3>
              <p className="text-text-muted leading-relaxed whitespace-pre-line">
                {tool.longDescription || tool.description}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-theme-text mb-4">标签</h3>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-theme-text mb-4">用户评论</h3>
              <CommentSection comments={tool.comments} toolId={tool.id} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-primary/20 sticky top-24">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-blue-600">{(tool.downloads ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1">
                    <Download className="w-3 h-3" />
                    下载次数
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-green-600">{(tool.views ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" />
                    浏览次数
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-yellow-600">{tool.stars ?? 0}</p>
                  <p className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3" />
                    收藏数
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <span className="text-sm text-text-muted flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    版本
                  </span>
                  <span className="font-medium text-theme-text">{tool.version ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <span className="text-sm text-text-muted">文件大小</span>
                  <span className="font-medium text-theme-text">{tool.fileSize ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <span className="text-sm text-text-muted flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    许可证
                  </span>
                  <span className="font-medium text-theme-text">{tool.license ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <span className="text-sm text-text-muted flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    创建时间
                  </span>
                  <span className="font-medium text-theme-text">{tool.createdAt ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-text-muted">最后更新</span>
                  <span className="font-medium text-theme-text">{tool.updatedAt ?? '-'}</span>
                </div>
              </div>

              {(tool.compatibility ?? []).length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-theme-text mb-3">兼容性</p>
                  <div className="flex flex-wrap gap-2">
                    {(tool.compatibility ?? []).map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-primary/5 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold">
                    {(tool.author ?? '?').charAt(0)}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-theme-text">{tool.author ?? '未知作者'}</p>
                    <p className="text-xs text-text-muted">发布者</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <button 
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  立即下载
                </button>
                <button 
                  onClick={handleFavorite}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                    isFavorited 
                      ? 'bg-red-100 text-red-500' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500' : ''}`} />
                </button>
              </div>

              <button 
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                分享工具
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}