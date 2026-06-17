import { useState, useEffect, useCallback } from 'react';
import {
  X, ThumbsUp, MessageSquare, Eye, Calendar, CheckCircle, AlertCircle,
  Bookmark, Share2, Download, Copy, Send,
  User, FileText,
  BookOpen, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Case, CaseComment, CaseReply } from '@/types';
import { mockComments } from '@/data/mockData';

interface CaseDetailProps {
  case: Case;
  onClose: () => void;
  onLike?: (caseId: string, e?: React.MouseEvent) => void;
  onBookmark?: (caseId: string, e?: React.MouseEvent) => void;
  onShare?: (caseItem: Case, e?: React.MouseEvent) => void;
}

export default function CaseDetail({ case: currentCase, onClose, onLike, onBookmark, onShare }: CaseDetailProps) {
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  useEffect(() => {
    // 加载评论
    const caseComments = mockComments.filter(c => c.caseId === currentCase.id);
    setComments(caseComments);
  }, [currentCase.id]);

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'resolved':
        return { label: '已解决', className: 'bg-green-100 text-green-600' };
      case 'in_progress':
        return { label: '处理中', className: 'bg-yellow-100 text-yellow-600' };
      default:
        return { label: '待处理', className: 'bg-gray-100 text-gray-600' };
    }
  };

  // 获取质量显示
  const getQualityDisplay = (quality?: string) => {
    switch (quality) {
      case 'verified':
        return { label: '优质方案', className: 'bg-blue-100 text-blue-600', icon: CheckCircle };
      case 'standard':
        return { label: '标准方案', className: 'bg-green-100 text-green-600', icon: BookOpen };
      default:
        return { label: '基础方案', className: 'bg-gray-100 text-gray-600', icon: FileText };
    }
  };

  // 获取难度显示
  const getDifficultyDisplay = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { label: '简单', className: 'bg-green-100 text-green-600' };
      case 'medium':
        return { label: '中等', className: 'bg-yellow-100 text-yellow-600' };
      default:
        return { label: '困难', className: 'bg-red-100 text-red-600' };
    }
  };

  // 处理评论提交
  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;

    const comment: CaseComment = {
      id: `comment-${Date.now()}`,
      caseId: currentCase.id,
      author: '当前用户',
      authorId: 'current-user',
      content: newComment,
      likes: 0,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  // 处理回复提交
  const handleReplySubmit = (commentId: string) => {
    if (!replyContent.trim()) return;

    const reply: CaseReply = {
      id: `reply-${Date.now()}`,
      commentId,
      author: '当前用户',
      authorId: 'current-user',
      content: replyContent,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, replies: [...c.replies, reply] };
      }
      return c;
    }));

    setReplyingTo(null);
    setReplyContent('');
  };

  // 复制内容
  const handleCopy = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'step') {
      setCopiedStep(Number(text));
      setTimeout(() => setCopiedStep(null), 2000);
    }
  }, []);

  // 导出PDF（模拟）
  const handleExportPDF = useCallback(() => {
    // 实际项目中可以使用jsPDF或html2pdf等库
    const content = `
故障案例：${currentCase.title}
=====================================
状态：${getStatusDisplay(currentCase.status).label}
质量：${getQualityDisplay(currentCase.quality).label}
难度：${getDifficultyDisplay(currentCase.difficulty).label}

设备信息
--------
类型：${currentCase.deviceType}
品牌：${currentCase.brand}
型号：${currentCase.model}
系统：${currentCase.systemVersion || '未指定'}

故障现象
--------
${currentCase.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}

原因分析
--------
${currentCase.causeAnalysis}

解决方案
--------
${currentCase.solution}

排查步骤
--------
${currentCase.steps.map(s => `${s.step}. ${s.title}\n   ${s.description}\n   ${s.commands?.join('\n   ') || ''}`).join('\n\n')}

标签：${currentCase.tags.join(', ')}
作者：${currentCase.author}
发布时间：${currentCase.createdAt}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `故障案例_${currentCase.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentCase]);

  const statusDisplay = getStatusDisplay(currentCase.status);
  const qualityDisplay = getQualityDisplay(currentCase.quality);
  const difficultyDisplay = getDifficultyDisplay(currentCase.difficulty);
  const QualityIcon = qualityDisplay.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusDisplay.className}`}>
                {statusDisplay.label}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${qualityDisplay.className} flex items-center gap-1`}>
                <QualityIcon className="w-4 h-4" />
                {qualityDisplay.label}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${difficultyDisplay.className}`}>
                {difficultyDisplay.label}
              </span>
              {currentCase.errorCode && currentCase.errorCode !== '-' && (
                <span className="px-3 py-1.5 bg-red-50 text-red-500 rounded-full text-sm font-medium">
                  {currentCase.errorCode}
                </span>
              )}
            </div>
            {currentCase.verification && (
              <div className="flex items-center gap-1 text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">已验证</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-text-muted" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 标题区 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-theme-text mb-4">{currentCase.title}</h1>

            {/* 统计信息 */}
            <div className="flex items-center gap-6 text-sm text-text-muted mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{currentCase.views} 浏览</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                <span>{currentCase.likes} 点赞</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>{currentCase.comments + comments.reduce((acc, c) => acc + c.replies.length, 0)} 评论</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(currentCase.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {currentCase.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* 作者信息卡片 */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-primary/5 to-blue-50/50 rounded-2xl">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{currentCase.author?.[0] || '?'}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-theme-text">{currentCase.author}</p>
              <p className="text-sm text-text-muted">运维工程师</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-theme-text">{currentCase.deviceType}</p>
                <p className="text-xs text-text-muted">设备类型</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-theme-text">{currentCase.brand} {currentCase.model}</p>
                <p className="text-xs text-text-muted">设备型号</p>
              </div>
              {currentCase.systemVersion && (
                <div className="text-center">
                  <p className="font-semibold text-theme-text">{currentCase.systemVersion}</p>
                  <p className="text-xs text-text-muted">系统版本</p>
                </div>
              )}
            </div>
          </div>

          {/* 故障现象 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              故障现象
            </h3>
            <div className="flex flex-wrap gap-2 p-4 bg-red-50/50 rounded-xl border border-red-100">
              {currentCase.symptoms.map((symptom, index) => (
                <span key={index} className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm shadow-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </div>

          {/* 原因分析 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
              原因分析
            </h3>
            <p className="text-text-muted leading-relaxed p-4 bg-yellow-50/50 rounded-xl border border-yellow-100">
              {currentCase.causeAnalysis}
            </p>
          </div>

          {/* 解决方案 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              解决方案
            </h3>
            <p className="text-text-muted leading-relaxed p-4 bg-green-50/50 rounded-xl border border-green-100">
              {currentCase.solution}
            </p>
          </div>

          {/* 排查步骤 */}
          {currentCase.steps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">N</span>
                </div>
                排查步骤 ({currentCase.steps.length}步)
              </h3>
              <div className="space-y-4">
                {currentCase.steps.map((step, index) => (
                  <div key={index} className="bg-gradient-to-r from-theme-bg to-blue-50/30 rounded-xl p-5 border border-primary/10 hover:border-primary/20 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-theme-text mb-2 text-lg">{step.title}</h4>
                        <p className="text-sm text-text-muted mb-3 leading-relaxed">{step.description}</p>

                        {step.commands && step.commands.length > 0 && (
                          <div className="relative mb-3">
                            <div className="bg-black/95 rounded-lg p-4 overflow-x-auto">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">命令</span>
                                <button
                                  onClick={() => handleCopy(step.commands?.join('\n') || '', 'step')}
                                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
                                >
                                  {copiedStep === index ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      已复制
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      复制
                                    </>
                                  )}
                                </button>
                              </div>
                              {step.commands.map((cmd, cmdIndex) => (
                                <p key={cmdIndex} className="text-green-400 text-sm font-mono">
                                  {cmd}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {step.expectedResult && (
                          <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-100">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span><strong>预期结果：</strong>{step.expectedResult}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 评论区 */}
          <div className="mb-6">
            <button
              onClick={() => setShowComments(!showComments)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold text-theme-text">
                  评论 ({comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)})
                </span>
              </div>
              {showComments ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
            </button>

            {showComments && (
              <div className="mt-4 space-y-4">
                {/* 评论输入框 */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="写下你的评论..."
                      className="w-full px-4 py-3 bg-theme-bg border border-primary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        发布评论
                      </button>
                    </div>
                  </div>
                </div>

                {/* 评论列表 */}
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-primary/30" />
                    <p>暂无评论，来发表第一条评论吧</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-3">
                        {/* 主评论 */}
                        <div className="flex gap-3 p-4 bg-theme-bg rounded-xl">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">{comment.author?.[0] || '?'}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-theme-text">{comment.author}</span>
                              <span className="text-xs text-text-muted">
                                {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-text-muted text-sm leading-relaxed">{comment.content}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                                <ThumbsUp className="w-3 h-3" />
                                <span>{comment.likes}</span>
                              </button>
                              <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-text-muted hover:text-primary transition-colors"
                              >
                                回复
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 回复列表 */}
                        {comment.replies.length > 0 && (
                          <div className="ml-12 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3 p-3 bg-white rounded-xl border border-primary/5">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-primary">{reply.author?.[0] || '?'}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-theme-text text-sm">{reply.author}</span>
                                    <span className="text-xs text-text-muted">
                                      {new Date(reply.createdAt).toLocaleDateString('zh-CN')}
                                    </span>
                                  </div>
                                  <p className="text-text-muted text-sm">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 回复输入框 */}
                        {replyingTo === comment.id && (
                          <div className="ml-12 flex gap-3">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="写下你的回复..."
                              className="flex-1 px-3 py-2 bg-theme-bg border border-primary/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm"
                              rows={2}
                            />
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={!replyContent.trim()}
                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                              >
                                回复
                              </button>
                              <button
                                onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                className="px-3 py-1.5 bg-gray-100 text-text-muted rounded-lg text-sm hover:bg-gray-200 transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t border-primary/10 bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-4">
          <button
            onClick={(e) => onLike?.(currentCase.id, e)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              currentCase.isLiked
                ? 'bg-red-50 text-red-500 border border-red-100'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${currentCase.isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{currentCase.likes}</span>
          </button>

          <button
            onClick={(e) => onBookmark?.(currentCase.id, e)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              currentCase.isBookmarked
                ? 'bg-yellow-50 text-yellow-500 border border-yellow-100'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${currentCase.isBookmarked ? 'fill-current' : ''}`} />
            <span className="font-medium">收藏</span>
          </button>

          <button
            onClick={(e) => onShare?.(currentCase, e)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">分享</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">导出</span>
          </button>

          <button
            onClick={() => handleCopy(`${currentCase.title}\n\n故障现象：\n${currentCase.symptoms.join('\n')}\n\n解决方案：\n${currentCase.solution}`, 'content')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
          >
            <Copy className="w-5 h-5" />
            <span className="font-medium">复制</span>
          </button>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
