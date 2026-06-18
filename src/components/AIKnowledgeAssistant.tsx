
import { useState } from 'react';
import { MessageCircle, Search, BookOpen, ExternalLink, ChevronRight, History, Sparkles, FileText } from 'lucide-react';
import type { QAResult, KnowledgeSearchResult } from '@/types';
import { aiAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredToast from './LoginRequiredToast';

interface AIKnowledgeAssistantProps {
  onDocumentSelect?: (documentId: string) => void;
}

export default function AIKnowledgeAssistant({ onDocumentSelect }: AIKnowledgeAssistantProps) {
  const { isAuthenticated } = useAuth();
  const [question, setQuestion] = useState('');
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [searchResult, setSearchResult] = useState<KnowledgeSearchResult | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<'qa' | 'search'>('qa');
  const [history, setHistory] = useState<string[]>([]);
  const [showLoginToast, setShowLoginToast] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setShowLoginToast(true);
      return;
    }
    if (!question.trim()) return;

    setIsThinking(true);
    setQaResult(null);
    setSearchResult(null);

    try {
      if (mode === 'qa') {
        const response = await aiAPI.qa({ question: question.trim(), topK: 3 });
        setQaResult(response.data.data);
      } else {
        const response = await aiAPI.searchDocuments({ query: question.trim(), topK: 5 });
        setSearchResult(response.data.data);
      }

      setHistory((prev) => [question.trim(), ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('AI request failed:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleHistoryClick = (item: string) => {
    setQuestion(item);
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.85) return 'text-green-600 bg-green-100';
    if (relevance >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white/85 border border-primary/20 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-theme-text">知识库AI助手</h3>
          <p className="text-sm text-text-muted">智能文档检索和问答</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('qa')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'qa'
              ? 'bg-primary text-white'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            智能问答
          </span>
        </button>
        <button
          onClick={() => setMode('search')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'search'
              ? 'bg-primary text-white'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            文档检索
          </span>
        </button>
      </div>

      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={mode === 'qa' ? '输入您的问题，AI将从知识库中查找答案...' : '搜索文档标题、描述或标签...'}
          rows={3}
          className="w-full px-4 py-3 bg-theme-bg/50 border border-primary/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleSubmit}
          disabled={!question.trim() || isThinking}
          className={`absolute right-2 bottom-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !question.trim() || isThinking
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {isThinking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              思考中...
            </>
          ) : (
            <>
              {mode === 'qa' ? <Sparkles className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              {mode === 'qa' ? '提问' : '搜索'}
            </>
          )}
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">历史记录</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                className="px-3 py-1 bg-theme-bg text-text-muted rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors truncate max-w-[200px]"
                title={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {qaResult && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-theme-text">AI回答</h4>
            <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">
              置信度 {(qaResult.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <p className="text-sm text-theme-text leading-relaxed">{qaResult.answer}</p>
          </div>

          {qaResult.sources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-theme-text">参考文档 ({qaResult.sources.length})</span>
              </div>
              <div className="space-y-2">
                {qaResult.sources.map((source) => (
                  <div
                    key={source.documentId}
                    onClick={() => onDocumentSelect?.(source.documentId)}
                    className="flex items-start gap-3 p-3 bg-theme-bg rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-text truncate">{source.title}</p>
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{source.snippet}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-text-muted">{source.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getRelevanceColor(source.relevance)}`}>
                          相关度 {(source.relevance * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {searchResult && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-theme-text">搜索结果</h4>
            </div>
            <span className="text-sm text-text-muted">共 {searchResult.results.length} 个文档</span>
          </div>

          <div className="space-y-3">
            {searchResult.results.map((result) => (
              <div
                key={result.documentId}
                onClick={() => onDocumentSelect?.(result.documentId)}
                className="p-4 bg-theme-bg rounded-xl border border-primary/10 hover:border-primary/30 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-medium text-theme-text">{result.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                        {result.category}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs">
                        {result.type}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getRelevanceColor(result.relevance)}`}>
                    {(result.relevance * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-text-muted line-clamp-2 mb-3">{result.summary}</p>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-4">
                    <span>{result.views} 浏览</span>
                    <span>{result.downloads} 下载</span>
                  </div>
                  <button className="flex items-center gap-1 text-primary hover:underline">
                    查看详情
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {searchResult.relatedQueries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-muted">相关搜索</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchResult.relatedQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuestion(query);
                      setMode('search');
                    }}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <LoginRequiredToast
        show={showLoginToast}
        onClose={() => setShowLoginToast(false)}
      />
    </div>
  );
}
