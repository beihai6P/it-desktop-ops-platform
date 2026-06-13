import { Download, Eye, Star, Share2, ExternalLink, Check, Clock, Calendar, FileText, Shield } from 'lucide-react';
import type { Tool } from '@/types';
import CommentSection from './CommentSection';

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
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        return;
      }

      // 加时间戳防缓存
      const response = await fetch(`/api/tools/${tool.id}/download?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('下载失败:', errorText);
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
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
        // 支持 filename*=UTF-8'' 格式
        const matchUtf8 = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
        const matchIso = contentDisposition.match(/filename="([^"]+)"/);
        const matchSimple = contentDisposition.match(/filename=([^;\r\n]+)/);
        
        if (matchUtf8 && matchUtf8[1]) {
          filename = decodeURIComponent(matchUtf8[1]);
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

      console.log('=== 下载调试信息 ===');
      console.log('Content-Type:', contentType);
      console.log('Content-Disposition:', contentDisposition);
      console.log('ArrayBuffer大小:', arrayBuffer.byteLength);
      console.log('Blob大小:', blob.size);
      console.log('Blob类型:', blob.type);
      console.log('最终文件名:', filename);

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
      
      console.log('下载完成');
    } catch (error) {
      console.error('下载错误:', error);
      alert(`下载失败: ${error.message}`);
    }
  };

  return (
    <div className="w-[480px] bg-white/90 backdrop-blur-md border-l border-primary/20 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-primary/10">
        <h3 className="text-lg font-semibold text-theme-text">工具详情</h3>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          返回列表
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-theme-text">{tool.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getTypeBadge(tool.type)}
                  {tool.isVerified && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      已验证
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {tool.screenshots && tool.screenshots.length > 0 && (
          <div>
            <p className="text-sm font-medium text-theme-text mb-3">预览截图</p>
            <div className="grid gap-3">
              {tool.screenshots.map((screenshot, index) => (
                <img
                  key={index}
                  src={screenshot}
                  alt={`截图 ${index + 1}`}
                  className="w-full rounded-xl object-cover h-40 bg-gray-100"
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-theme-text mb-2">详细描述</p>
          <p className="text-sm text-text-muted bg-theme-bg/50 rounded-xl p-4 leading-relaxed">
            {tool.longDescription || tool.description}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-theme-text mb-3">标签</p>
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

        <div className="grid grid-cols-3 gap-3">
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

        <div className="bg-theme-bg/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted flex items-center gap-2">
              <Clock className="w-4 h-4" />
              版本
            </span>
            <span className="font-medium text-theme-text">{tool.version ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">文件大小</span>
            <span className="font-medium text-theme-text">{tool.fileSize ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted flex items-center gap-2">
              <Shield className="w-4 h-4" />
              许可证
            </span>
            <span className="font-medium text-theme-text">{tool.license ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              创建时间
            </span>
            <span className="font-medium text-theme-text">{tool.createdAt ? new Date(tool.createdAt).toLocaleString('zh-CN') : '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">最后更新</span>
            <span className="font-medium text-theme-text">{tool.updatedAt ? new Date(tool.updatedAt).toLocaleString('zh-CN') : '-'}</span>
          </div>
        </div>

        {(tool.compatibility ?? []).length > 0 && (
          <div>
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

        <div className="bg-primary/5 rounded-xl p-4">
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

        <div className="flex gap-3">
          <button 
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            立即下载
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
          <ExternalLink className="w-5 h-5" />
          查看完整详情
        </button>

        <div className="border-t border-primary/10 pt-6">
          <CommentSection comments={tool.comments} toolId={tool.id} />
        </div>
      </div>
    </div>
  );
}