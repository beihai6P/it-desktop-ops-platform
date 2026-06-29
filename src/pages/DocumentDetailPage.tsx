import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Eye, Heart, Share2, Bookmark, ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import type { Document } from '@/types';
import { documentAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) return;

    const docTitle = `${document.title} - ${document.category} - 萌萌的运维人知识库`;
    window.document.title = docTitle;

    const existingScripts = window.document.querySelectorAll('[data-seo-schema]');
    existingScripts.forEach((script) => script.remove());

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.mengmengyunwei.com' },
        { '@type': 'ListItem', position: 2, name: '知识库', item: 'https://www.mengmengyunwei.com/knowledge' },
        { '@type': 'ListItem', position: 3, name: document.title, item: `https://www.mengmengyunwei.com/knowledge/${document.id}` }
      ]
    };

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: document.title,
      description: document.description,
      author: { '@type': 'Person', name: document.author },
      publisher: { '@type': 'Organization', name: '萌萌的运维人', logo: { '@type': 'ImageObject', url: 'https://www.mengmengyunwei.com/favicon.svg' } },
      datePublished: document.createdAt,
      dateModified: document.updatedAt,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.mengmengyunwei.com/knowledge/${document.id}` },
      articleSection: document.category,
      keywords: document.tags.join(', ')
    };

    const createSchemaScript = (data: unknown, schemaId: string) => {
      const script = window.document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = schemaId;
      script.textContent = JSON.stringify(data);
      window.document.head.appendChild(script);
      return script;
    };

    createSchemaScript(breadcrumbSchema, 'breadcrumb');
    createSchemaScript(articleSchema, 'article');

    const existingMetaTags = window.document.querySelectorAll('[data-seo-meta]');
    existingMetaTags.forEach((tag) => tag.remove());

    const createMetaTag = (name: string, content: string) => {
      const meta = window.document.createElement('meta');
      meta.name = name;
      meta.content = content;
      meta.dataset.seoMeta = name;
      window.document.head.appendChild(meta);
      return meta;
    };

    createMetaTag('description', document.description);
    createMetaTag('keywords', document.tags.join(', '));
    createMetaTag('author', document.author);

    const existingOgTags = window.document.querySelectorAll('[data-seo-og]');
    existingOgTags.forEach((tag) => tag.remove());

    const createOgTag = (property: string, content: string) => {
      const meta = window.document.createElement('meta');
      meta.setAttribute('property', property);
      meta.content = content;
      meta.dataset.seoOg = property;
      window.document.head.appendChild(meta);
      return meta;
    };

    createOgTag('og:title', docTitle);
    createOgTag('og:description', document.description);
    createOgTag('og:type', 'article');
    createOgTag('og:url', `https://www.mengmengyunwei.com/knowledge/${document.id}`);

    return () => {
      window.document.querySelectorAll('[data-seo-schema]').forEach((script) => script.remove());
      window.document.querySelectorAll('[data-seo-meta]').forEach((tag) => tag.remove());
      window.document.querySelectorAll('[data-seo-og]').forEach((tag) => tag.remove());
      window.document.title = '萌萌的运维人 - 一站式桌面运维互动平台';
    };
  }, [document]);

  const loadDocument = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await documentAPI.getById(id);
      setDocument(response.data.document);
    } catch (err) {
      logger.error('Failed to load document:', err);
      setError('文档不存在');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !document) return;
    try {
      await documentAPI.favorite(document.id);
      setDocument((prev) =>
        prev
          ? {
              ...prev,
              isFavorite: !prev.isFavorite,
              favorites: prev.isFavorite ? prev.favorites - 1 : prev.favorites + 1,
            }
          : null
      );
    } catch (error) {
      logger.error('Failed to toggle favorite:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Tag className="w-16 h-16 text-primary/30 mb-4" />
        <p className="text-text-muted">{error || '文档不存在'}</p>
        <button
          onClick={() => navigate('/knowledge')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          返回文档列表
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      <header className="bg-white/85 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/knowledge')}
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回文档列表
            </button>
            <h1 className="text-lg font-semibold text-theme-text">文档详情</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
          <div className="p-8 border-b border-primary/10">
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
                <h1 className="text-3xl font-bold text-theme-text mb-2">{document.title}</h1>
                <p className="text-text-muted text-lg">{document.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-text-muted mb-6">
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

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium">
                <Download className="w-4 h-4" />
                下载
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-theme-text rounded-xl hover:bg-gray-200 transition-colors">
                <Share2 className="w-4 h-4" />
                分享
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors ${
                  document.isFavorite
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-theme-text hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${document.isFavorite ? 'fill-current' : ''}`} />
                {document.isFavorite ? '已收藏' : '收藏'}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-theme-text rounded-xl hover:bg-gray-200 transition-colors">
                <Bookmark className="w-4 h-4" />
                书签
              </button>
            </div>

            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-primary/10">
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

            <div className="flex flex-wrap gap-2 mt-4">
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
          </div>

          <div className="p-8">
            {renderMarkdownContent(document.content)}
          </div>
        </div>
      </main>
    </div>
  );
}