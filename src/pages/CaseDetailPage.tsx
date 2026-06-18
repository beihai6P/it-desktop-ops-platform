import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ThumbsUp, MessageSquare, Eye, Calendar, CheckCircle, AlertCircle,
  Bookmark, Share2, Download, Copy, Send, Check,
  User, FileText, Crown, Pin, Trash2,
  BookOpen, Lightbulb, ChevronDown, ChevronUp, Image, FileArchive, File
} from 'lucide-react';
import type { Case, CaseComment, CaseReply } from '@/types';
import { caseAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      const response = await caseAPI.getComments(id);
      setComments(response.data.comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  }, [id]);

  useEffect(() => {
    loadCase();
    loadComments();
  }, [id, loadCase, loadComments]);

  const loadCase = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await caseAPI.getById(id);
      setCurrentCase(response.data.case);
    } catch (err) {
      console.error('Failed to load case:', err);
      setError('获取案例详情失败');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCommentSubmit = () => {
    if (!newComment.trim() || !currentCase) return;

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

  const handleCopy = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'step') {
      setCopiedStep(Number(text));
      setTimeout(() => setCopiedStep(null), 2000);
    }
  }, []);

  const handleExportPDF = useCallback(() => {
    if (!currentCase) return;
    
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

  const handleLike = async () => {
    if (!currentCase) return;
    try {
      await caseAPI.like(currentCase.id);
      setCurrentCase(prev => prev ? { ...prev, likes: prev.likes + 1, isLiked: true } : null);
    } catch (error) {
      console.error('Failed to like case:', error);
    }
  };

  const handleBookmark = async () => {
    if (!currentCase) return;
    try {
      await caseAPI.bookmark(currentCase.id);
      setCurrentCase(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    } catch (error) {
      console.error('Failed to bookmark case:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentCase) return;
    if (!window.confirm('确定要删除这个案例吗？此操作将同时删除相关附件，且无法撤销。')) {
      return;
    }
    try {
      await caseAPI.delete(currentCase.id);
      navigate('/diagnosis');
    } catch (error) {
      console.error('Failed to delete case:', error);
    }
  };

  const handleToggleEssence = async () => {
    if (!currentCase) return;
    try {
      const response = await caseAPI.toggleEssence(currentCase.id);
      setCurrentCase(prev => prev ? { ...prev, isEssence: response.data.isEssence } : null);
    } catch (error) {
      console.error('Failed to toggle essence:', error);
    }
  };

  const handleTogglePin = async () => {
    if (!currentCase) return;
    try {
      const response = await caseAPI.togglePin(currentCase.id);
      setCurrentCase(prev => prev ? { ...prev, isPinned: response.data.isPinned } : null);
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const isImage = (mimeType?: string, name?: string) => {
    if (mimeType?.startsWith('image/')) return true;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const ext = name?.toLowerCase().substring(name.lastIndexOf('.'));
    return imageExtensions.includes(ext || '');
  };

  const isDocument = (mimeType?: string) => {
    return mimeType?.startsWith('application/') || 
           mimeType?.startsWith('text/') ||
           ['application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType || '');
  };

  const getFileIcon = (mimeType?: string, name?: string) => {
    if (isImage(mimeType)) return Image;
    if (name?.endsWith('.zip') || name?.endsWith('.rar') || name?.endsWith('.7z')) return FileArchive;
    return File;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !currentCase) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-text-muted text-lg">{error || '案例不存在'}</p>
          <button
            onClick={() => navigate('/diagnosis')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        {loading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-muted">加载中...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-text-muted mb-4">{error || '案例不存在'}</p>
            <button
              onClick={() => navigate('/diagnosis')}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              返回列表
            </button>
          </div>
        )}
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(currentCase.status);
  const qualityDisplay = getQualityDisplay(currentCase.quality);
  const difficultyDisplay = getDifficultyDisplay(currentCase.difficulty);
  const QualityIcon = qualityDisplay.icon;

  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="max-w-5xl mx-auto">
        <div className="sticky top-0 z-10 bg-theme-bg/95 backdrop-blur-sm border-b border-primary/10">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/diagnosis')}
              className="flex items-center gap-2 text-text-muted hover:text-theme-text transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回案例列表
            </button>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <button
                    onClick={handleTogglePin}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentCase.isPinned ? 'bg-red-100 text-red-600' : 'bg-white hover:bg-gray-50 text-text-muted'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                    {currentCase.isPinned ? '取消置顶' : '置顶'}
                  </button>
                  <button
                    onClick={handleToggleEssence}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentCase.isEssence ? 'bg-yellow-100 text-yellow-600' : 'bg-white hover:bg-gray-50 text-text-muted'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    {currentCase.isEssence ? '取消精华' : '加精'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </>
              )}
              {!isAdmin && currentCase.authorId === user?.id && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {currentCase.isPinned && (
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm flex items-center gap-1">
                      <Pin className="w-4 h-4" />
                      置顶
                    </span>
                  )}
                  {currentCase.isEssence && (
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      精华
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm ${statusDisplay.className}`}>
                    {statusDisplay.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${difficultyDisplay.className}`}>
                    {difficultyDisplay.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${qualityDisplay.className} flex items-center gap-1`}>
                    <QualityIcon className="w-4 h-4" />
                    {qualityDisplay.label}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-theme-text mb-4">{currentCase.title}</h1>

              {currentCase.errorCode && (
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">错误码: <strong>{currentCase.errorCode}</strong></span>
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-text-muted mb-6">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {currentCase.author}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(currentCase.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {currentCase.views} 浏览
                </span>
                <span className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  {currentCase.likes} 点赞
                </span>
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {currentCase.comments} 评论
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                    currentCase.isLiked
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                      : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  {currentCase.isLiked ? '已点赞' : '点赞'}
                </button>
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                    currentCase.isBookmarked
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                  {currentCase.isBookmarked ? '已收藏' : '收藏'}
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-white border border-gray-200 text-text-muted hover:bg-gray-50 transition-all"
                >
                  <Download className="w-5 h-5" />
                  导出
                </button>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-white border border-gray-200 text-text-muted hover:bg-gray-50 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  分享
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">设备类型</p>
                  <p className="font-semibold text-theme-text">{currentCase.deviceType}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">品牌</p>
                  <p className="font-semibold text-theme-text">{currentCase.brand}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-text-muted mb-1">型号</p>
                  <p className="font-semibold text-theme-text">{currentCase.model}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-theme-text">故障现象</h2>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  {(currentCase.symptoms || []).map((symptom, index) => (
                    <div key={index} className="flex items-start gap-3 mb-2 last:mb-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-text-muted">{symptom}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-theme-text">排查过程</h2>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-text-muted leading-relaxed">{currentCase.troubleshooting || '暂无排查过程记录'}</p>
                </div>
                {currentCase.troubleshootingImages && currentCase.troubleshootingImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCase.troubleshootingImages.map((img, index) => (
                      <div key={index} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={img.url.replace('https://wzsj001.tos-cn-shanghai.volces.com/', '/api/presigned/image/')}
                            alt={img.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-theme-text">原因分析</h2>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-text-muted leading-relaxed">{currentCase.causeAnalysis}</p>
                </div>
                {currentCase.causeAnalysisImages && currentCase.causeAnalysisImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCase.causeAnalysisImages.map((img, index) => (
                      <div key={index} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={img.url.replace('https://wzsj001.tos-cn-shanghai.volces.com/', '/api/presigned/image/')}
                            alt={img.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-theme-text">解决方案</h2>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-text-muted leading-relaxed">{currentCase.solution}</p>
                </div>
                {currentCase.solutionImages && currentCase.solutionImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCase.solutionImages.map((img, index) => (
                      <div key={index} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={img.url.replace('https://wzsj001.tos-cn-shanghai.volces.com/', '/api/presigned/image/')}
                            alt={img.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {((currentCase.steps || []).length > 0) && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-theme-text">排查步骤 ({(currentCase.steps || []).length}步)</h2>
                  </div>
                  <div className="space-y-4">
                    {(currentCase.steps || []).map((step) => (
                      <div key={step.step} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                              {step.step}
                            </span>
                            <h3 className="font-semibold text-theme-text">{step.title}</h3>
                          </div>
                          <button
                            onClick={() => handleCopy(step.step.toString(), 'step')}
                            className="flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors"
                          >
                            {copiedStep === step.step ? (
                              <>
                                <Check className="w-4 h-4" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                复制步骤
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-text-muted mb-3 ml-11">{step.description}</p>
                        {step.commands && step.commands.length > 0 && (
                          <div className="ml-11 bg-black rounded-lg p-3 overflow-x-auto">
                            <pre className="text-sm text-green-400 whitespace-pre-wrap">{step.commands.join('\n')}</pre>
                          </div>
                        )}
                        {step.expectedResult && (
                          <div className="ml-11 mt-3 flex items-center gap-2 text-sm text-text-muted">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>预期结果：{step.expectedResult}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentCase.attachments && currentCase.attachments.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-theme-text">案例附件</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCase.attachments.map((attachment, index) => {
                      const attachmentData = attachment as unknown as Record<string, unknown>;
                      const FileIcon = getFileIcon(attachmentData.mimeType as string | undefined, attachment.name);
                      const isImg = isImage(attachmentData.mimeType as string | undefined, attachment.name);
                      
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
                          {isImg && attachment.url && (
                            <div className="aspect-video bg-white flex items-center justify-center overflow-hidden">
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <FileIcon className={`w-5 h-5 ${isImg ? 'text-green-500' : isDocument(attachmentData.mimeType as string | undefined) ? 'text-blue-500' : 'text-gray-500'}`} />
                              <span className="font-medium text-theme-text truncate">{attachment.name}</span>
                            </div>
                            {attachment.size && (
                              <p className="text-xs text-text-muted mb-3">{(attachment.size / 1024).toFixed(1)} KB</p>
                            )}
                            {attachment.url && (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
                              >
                                {isImg ? '查看图片' : '下载附件'}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentCase.tags && currentCase.tags.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-text-muted">标签：</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentCase.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-8">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowComments(!showComments)}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-theme-text">评论 ({comments.length})</h2>
                  </div>
                  {showComments ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </div>

                {showComments && (
                  <div className="mt-6">
                    <div className="flex gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="发表评论..."
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleCommentSubmit}
                            disabled={!newComment.trim()}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            发表评论
                          </button>
                        </div>
                      </div>
                    </div>

                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-text-muted">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>暂无评论，快来发表第一条评论吧！</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-theme-text">{comment.author}</span>
                                  <span className="text-xs text-text-muted">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-text-muted mb-3">{comment.content}</p>
                                <div className="flex items-center gap-4">
                                  <button className="flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors">
                                    <ThumbsUp className="w-4 h-4" />
                                    {comment.likes}
                                  </button>
                                  <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors"
                                  >
                                    <Send className="w-4 h-4" />
                                    回复
                                  </button>
                                </div>

                                {replyingTo === comment.id && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="flex-1">
                                        <input
                                          type="text"
                                          value={replyContent}
                                          onChange={(e) => setReplyContent(e.target.value)}
                                          placeholder="回复评论..."
                                          className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              handleReplySubmit(comment.id);
                                            }
                                          }}
                                        />
                                        <div className="flex justify-end mt-2">
                                          <button
                                            onClick={() => handleReplySubmit(comment.id)}
                                            disabled={!replyContent.trim()}
                                            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            回复
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="mt-4 pl-11 space-y-3">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="bg-white rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <User className="w-3.5 h-3.5 text-primary" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium text-theme-text text-sm">{reply.author}</span>
                                              <span className="text-xs text-text-muted">
                                                {new Date(reply.createdAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="text-text-muted text-sm">{reply.content}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}