import { useState, useEffect } from 'react';
import { FileText, MessageSquare, Check, X, Trash2, Search, AlertCircle } from 'lucide-react';
import { reviewAPI } from '../services/api';
import type { Post, Comment } from '../types';

export default function ReviewManagement() {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'post' | 'comment' } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        const response = await reviewAPI.getPosts(statusFilter === 'all' ? undefined : statusFilter);
        setPosts(response.data.posts || response.posts || []);
      } else {
        const response = await reviewAPI.getComments(statusFilter === 'all' ? undefined : statusFilter);
        setComments(response.data.comments || response.comments || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, type: 'post' | 'comment') => {
    try {
      if (type === 'post') {
        await reviewAPI.approvePost(id);
      } else {
        await reviewAPI.approveComment(id);
      }
      loadData();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectReason) return;
    try {
      if (selectedItem.type === 'post') {
        await reviewAPI.rejectPost(selectedItem.id, rejectReason);
      } else {
        await reviewAPI.rejectComment(selectedItem.id, rejectReason);
      }
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleDelete = async (id: string, type: 'post' | 'comment') => {
    if (confirm('确定要删除这个内容吗？')) {
      try {
        if (type === 'post') {
          await reviewAPI.deletePost(id);
        } else {
          await reviewAPI.deleteComment(id);
        }
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const openRejectModal = (id: string, type: 'post' | 'comment') => {
    setSelectedItem({ id, type });
    setShowRejectModal(true);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || comment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-600',
      approved: 'bg-green-100 text-green-600',
      rejected: 'bg-red-100 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">内容审核</h2>
          <p className="text-sm text-text-muted mt-1">审核社区帖子和评论内容</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'posts'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-text-muted hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          帖子审核
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'comments'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-text-muted hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          评论审核
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="搜索标题、作者或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {activeTab === 'posts' ? (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">标题</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">作者</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">分类</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">创建时间</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-muted">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-theme-text truncate max-w-xs">{post.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-muted">{post.author}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
                        {getStatusLabel(post.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-muted">{post.createdAt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(post.id, 'post')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="通过"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(post.id, 'post')}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="拒绝"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(post.id, 'post')}
                          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-primary/20 mb-4" />
                <p className="text-text-muted">暂无帖子数据</p>
              </div>
            )}
          </>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">内容</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">作者</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">创建时间</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-muted">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-theme-text truncate max-w-md">{comment.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-muted">{comment.author}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(comment.status || 'pending')}`}>
                        {getStatusLabel(comment.status || 'pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-muted">{comment.createdAt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {(comment.status || 'pending') === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(comment.id, 'comment')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="通过"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(comment.id, 'comment')}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="拒绝"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(comment.id, 'comment')}
                          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredComments.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-primary/20 mb-4" />
                <p className="text-text-muted">暂无评论数据</p>
              </div>
            )}
          </>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-theme-text">拒绝审核</h3>
                <p className="text-sm text-text-muted">请填写拒绝原因</p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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