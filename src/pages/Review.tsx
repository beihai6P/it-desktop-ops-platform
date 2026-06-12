import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, AlertCircle, RefreshCw, FileText, Clock, CheckCircle, XCircle, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { Post, ReviewStats } from '@/types';
import { reviewAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const statusConfig = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  review: { label: '需人工审核', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

export default function Review() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [actionPostId, setActionPostId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadPosts();
    loadStats();
  }, [filterStatus]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : undefined;
      const response = await reviewAPI.getAllPosts(params);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const loadStats = useCallback(async () => {
    try {
      const response = await reviewAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const handleApprove = useCallback(async (postId: string) => {
    try {
      await reviewAPI.reviewPost(postId, 'approve');
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, reviewStatus: 'approved' } : post
      ));
      loadStats();
    } catch (error) {
      console.error('Failed to approve post:', error);
    }
  }, [loadStats]);

  const handleReject = useCallback((postId: string) => {
    setActionPostId(postId);
    setActionType('reject');
    setShowReasonModal(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!actionPostId) return;
    const reason = reviewReason;
    try {
      await reviewAPI.reviewPost(actionPostId, 'reject', reason);
      setPosts(prev => prev.map(post => 
        post.id === actionPostId ? { ...post, reviewStatus: 'rejected', reviewReason: reason } : post
      ));
      loadStats();
    } catch (error) {
      console.error('Failed to reject post:', error);
    } finally {
      setShowReasonModal(false);
      setReviewReason('');
      setActionPostId(null);
    }
  }, [actionPostId, reviewReason, loadStats]);

  const handleBatchApprove = useCallback(async () => {
    try {
      await reviewAPI.batchReview(selectedPosts, 'approve');
      setPosts(prev => prev.filter(post => !selectedPosts.includes(post.id)));
      setSelectedPosts([]);
      loadStats();
    } catch (error) {
      console.error('Failed to batch approve:', error);
    }
  }, [selectedPosts, loadStats]);

  const handleBatchReject = useCallback(() => {
    setActionType('reject');
    setShowReasonModal(true);
  }, []);

  const confirmBatchReject = useCallback(async () => {
    const selected = [...selectedPosts];
    const reason = reviewReason;
    try {
      await reviewAPI.batchReview(selected, 'reject', reason);
      setPosts(prev => prev.filter(post => !selected.includes(post.id)));
      setSelectedPosts([]);
      loadStats();
    } catch (error) {
      console.error('Failed to batch reject:', error);
    } finally {
      setShowReasonModal(false);
      setReviewReason('');
    }
  }, [selectedPosts, reviewReason, loadStats]);

  const toggleSelectPost = useCallback((postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  }, []);

  const filteredPosts = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery) ||
      post.author.toLowerCase().includes(lowerQuery)
    );
  }, [posts, searchQuery]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-primary/20 mb-4" />
          <h3 className="text-lg font-semibold text-theme-text">权限不足</h3>
          <p className="text-text-muted mt-2">只有管理员可以访问审核页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-theme-text">内容审核</h2>
          <p className="text-sm text-text-muted mt-1">管理社区帖子审核流程</p>
        </div>
        <button
          onClick={() => { loadPosts(); loadStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats && (
          <>
            <div className="bg-white/85 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme-text">{stats.pending}</p>
                  <p className="text-sm text-text-muted">待审核</p>
                </div>
              </div>
            </div>
            <div className="bg-white/85 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme-text">{stats.review}</p>
                  <p className="text-sm text-text-muted">需人工审核</p>
                </div>
              </div>
            </div>
            <div className="bg-white/85 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme-text">{stats.approved}</p>
                  <p className="text-sm text-text-muted">已通过</p>
                </div>
              </div>
            </div>
            <div className="bg-white/85 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-theme-text">{stats.rejected}</p>
                  <p className="text-sm text-text-muted">已拒绝</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white/85 border border-primary/20 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="搜索帖子标题、内容或作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="review">需人工审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        {selectedPosts.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-primary/20">
            <span className="text-sm text-text-muted">
              已选择 <span className="font-semibold text-theme-text">{selectedPosts.length}</span> 个帖子
            </span>
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              批量通过
            </button>
            <button
              onClick={handleBatchReject}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              批量拒绝
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const config = statusConfig[post.reviewStatus] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <div
                key={post.id}
                className="bg-white/85 border border-primary/20 rounded-xl overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={() => toggleSelectPost(post.id)}
                    className="w-5 h-5 rounded border-primary/30 text-primary focus:ring-primary/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-theme-text truncate">{post.title}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span>{post.author}</span>
                      <span>{post.category}</span>
                      <span>{new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                      className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      {expandedPostId === post.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    {post.reviewStatus !== 'approved' && post.reviewStatus !== 'rejected' && (
                      <>
                        <button
                          onClick={() => handleApprove(post.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          通过
                        </button>
                        <button
                          onClick={() => handleReject(post.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          拒绝
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {expandedPostId === post.id && (
                  <div className="px-4 pb-4 border-t border-primary/10">
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-text-muted mb-2">内容预览</h4>
                      <p className="text-theme-text whitespace-pre-wrap">{post.content}</p>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {post.reviewReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">审核原因</span>
                          </div>
                          <p className="text-sm text-red-600 mt-1">{post.reviewReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-primary/20 mb-4" />
            <p className="text-text-muted">暂无符合条件的帖子</p>
          </div>
        )}
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-theme-text mb-2">
              {actionType === 'reject' ? '拒绝原因' : '批量拒绝原因'}
            </h3>
            <p className="text-sm text-text-muted mb-4">
              请输入拒绝该帖子的原因（可选）
            </p>
            <textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="w-full h-24 px-4 py-3 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowReasonModal(false); setReviewReason(''); setActionPostId(null); }}
                className="px-4 py-2 text-text-muted hover:bg-gray-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={actionPostId ? confirmReject : confirmBatchReject}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}