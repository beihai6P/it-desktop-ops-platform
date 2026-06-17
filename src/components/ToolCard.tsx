import { Download, Eye, Star, Share2, Tag, Check, Flame, Pin, Trash2 } from 'lucide-react';
import type { Tool } from '@/types';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
  isAdmin?: boolean;
  onPin?: (id: string) => void;
  onFeature?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ToolCard({ tool, onClick, isAdmin, onPin, onFeature, onDelete }: ToolCardProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'script':
        return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">脚本</span>;
      case 'tool':
        return <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">工具</span>;
      case 'plugin':
        return <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">插件</span>;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-5 hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      {tool.isPinned && (
        <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-3 py-1 rounded-br-lg flex items-center gap-1">
          <Pin className="w-3 h-3" />
          置顶
        </div>
      )}
      {tool.isFeatured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <Flame className="w-3 h-3" />
          精选
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {getTypeBadge(tool.type)}
          {tool.isVerified && (
            <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs flex items-center gap-1">
              <Check className="w-3 h-3" />
              已验证
            </span>
          )}
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            {tool.category}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); }}>
            <Share2 className="w-4 h-4 text-text-muted" />
          </button>
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); }}>
            <Download className="w-4 h-4 text-text-muted" />
          </button>
          {isAdmin && (
            <>
              <button 
                className={`p-2 rounded-lg transition-colors ${tool.isPinned ? 'bg-blue-100 text-blue-600' : 'hover:bg-blue-100 text-text-muted hover:text-blue-600'}`} 
                onClick={(e) => { e.stopPropagation(); onPin?.(tool.id); }}
                title={tool.isPinned ? '取消置顶' : '置顶'}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-lg transition-colors ${tool.isFeatured ? 'bg-orange-100 text-orange-600' : 'hover:bg-orange-100 text-text-muted hover:text-orange-600'}`} 
                onClick={(e) => { e.stopPropagation(); onFeature?.(tool.id); }}
                title={tool.isFeatured ? '取消精选' : '加精'}
              >
                <Flame className="w-4 h-4" />
              </button>
              <button 
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-text-muted hover:text-red-600" 
                onClick={(e) => { e.stopPropagation(); onDelete?.(tool.id); }}
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-theme-text mb-2 group-hover:text-primary transition-colors line-clamp-1">
        {tool.name}
      </h3>
      <p className="text-sm text-text-muted mb-4 line-clamp-2">{tool.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tool.tags.slice(0, 4).map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs"
          >
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
        {tool.tags.length > 4 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
            +{tool.tags.length - 4}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-primary/10">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {(tool.downloads ?? 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {(tool.views ?? 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            {tool.stars ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">{tool.version ?? '-'}</span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted">{tool.fileSize ?? '-'}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
        <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
          {(tool.author ?? '?').charAt(0)}
        </span>
        <span>{tool.author ?? '未知作者'}</span>
        <span>·</span>
        <span>更新于 {tool.updatedAt ?? '-'}</span>
      </div>
    </div>
  );
}