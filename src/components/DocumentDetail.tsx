import { X, Download, Eye, Calendar, User, Tag, Heart, Share2, Bookmark, ChevronLeft } from 'lucide-react';
import type { Document } from '@/types';

interface DocumentDetailProps {
  document: Document;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

export default function DocumentDetail({ document, onClose, onToggleFavorite }: DocumentDetailProps) {
  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        elements.push(<h1 key={key++} className="text-2xl font-bold text-theme-text mt-6 mb-4">{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={key++} className="text-xl font-semibold text-theme-text mt-5 mb-3">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={key++} className="text-lg font-medium text-theme-text mt-4 mb-2">{line.slice(4)}</h3>);
      } else if (line.startsWith('#### ')) {
        elements.push(<h4 key={key++} className="text-base font-medium text-theme-text mt-3 mb-2">{line.slice(5)}</h4>);
      } else if (line.startsWith('```')) {
        const codeBlock: string[] = [];
        let i = lines.indexOf(line) + 1;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeBlock.push(lines[i]);
          i++;
        }
        elements.push(
          <pre key={key++} className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono my-4">
            <code>{codeBlock.join('\n')}</code>
          </pre>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(<strong key={key++} className="font-semibold">{line.slice(2, -2)}</strong>);
      } else if (line.startsWith('- ')) {
        elements.push(<li key={key++} className="ml-4 text-text-muted">{line.slice(2)}</li>);
      } else if (line.match(/^\d+\./)) {
        elements.push(<li key={key++} className="ml-4 text-text-muted">{line}</li>);
      } else if (line.trim()) {
        elements.push(<p key={key++} className="text-text-muted mb-3 leading-relaxed">{line}</p>);
      }
    });

    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-text-muted hover:text-theme-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            返回列表
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                  {document.type}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  {document.category}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm">
                  v{document.version}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-theme-text mb-2">{document.title}</h1>
              <p className="text-text-muted">{document.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{document.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>创建于 {document.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>更新于 {document.updatedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
              <Download className="w-4 h-4" />
              下载
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-theme-text rounded-xl hover:bg-gray-200 transition-colors">
              <Share2 className="w-4 h-4" />
              分享
            </button>
            <button
              onClick={() => onToggleFavorite(document.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                document.isFavorite
                  ? 'bg-red-50 text-red-500'
                  : 'bg-gray-100 text-theme-text hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${document.isFavorite ? 'fill-current' : ''}`} />
              {document.isFavorite ? '已收藏' : '收藏'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-theme-text rounded-xl hover:bg-gray-200 transition-colors">
              <Bookmark className="w-4 h-4" />
              书签
            </button>
          </div>

          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">{document.views} 浏览</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">{document.downloads} 下载</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">{document.favorites} 收藏</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-gray max-w-none">
            {renderMarkdownContent(document.content)}
          </div>
        </div>
      </div>
    </div>
  );
}