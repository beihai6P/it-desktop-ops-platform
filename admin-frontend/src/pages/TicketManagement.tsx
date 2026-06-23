﻿import { useState, useEffect } from 'react';
import { Ticket, Search, Plus, Edit, Trash2, User, Clock, AlertTriangle, CheckCircle, ChevronRight, X, Save } from 'lucide-react';
import { ticketAPI, userAPI } from '../services/api';

interface TicketType {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  category: string;
  assignee?: { id: string; name: string };
  requester: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export default function TicketManagement() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    category: '软件问题',
    assigneeId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, usersRes] = await Promise.all([ticketAPI.getAll(), userAPI.getAll()]);
      setTickets(ticketsRes.data?.tickets || ticketsRes.tickets || []);
      setUsers(usersRes.data?.users?.map(u => ({ id: u.id, name: u.name })) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.requester.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTicket) {
        await ticketAPI.update(editingTicket.id, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          category: formData.category,
          assignee: formData.assigneeId,
        });
      } else {
        await ticketAPI.create({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          category: formData.category,
        });
      }
      loadData();
      setShowModal(false);
      setEditingTicket(null);
      setFormData({ title: '', description: '', priority: 'medium', category: '软件问题', assigneeId: '' });
    } catch (error) {
      console.error('Failed to save ticket:', error);
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      await ticketAPI.resolve(ticketId);
      loadData();
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (confirm('确定要删除这个工单吗？')) {
      try {
        await ticketAPI.delete(ticketId);
        loadData();
      } catch (error) {
        console.error('Failed to delete ticket:', error);
      }
    }
  };

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      assigneeId: ticket.assignee?.id || '',
    });
    setShowModal(true);
  };

  const handleViewDetail = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: '待处理',
      in_progress: '处理中',
      resolved: '已解决',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-600',
      in_progress: 'bg-yellow-100 text-yellow-600',
      resolved: 'bg-green-100 text-green-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-600',
      medium: 'bg-yellow-100 text-yellow-600',
      low: 'bg-green-100 text-green-600',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">工单管理</h2>
          <p className="text-sm text-text-muted mt-1">管理和处理用户提交的工单</p>
        </div>
        <button onClick={() => { setEditingTicket(null); setFormData({ title: '', description: '', priority: 'medium', category: '软件问题', assigneeId: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input type="text" placeholder="搜索工单标题或提交人..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部状态</option>
            <option value="open">待处理</option>
            <option value="in_progress">处理中</option>
            <option value="resolved">已解决</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">全部优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">待处理工单</p>
              <p className="text-2xl font-bold text-red-600">{tickets.filter(t => t.status === 'open').length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">处理中工单</p>
              <p className="text-2xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'in_progress').length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">已解决工单</p>
              <p className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">工单信息</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">提交人</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">优先级</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">分配给</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-muted">创建时间</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-muted">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 cursor-pointer" onClick={() => handleViewDetail(ticket)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-theme-text">{ticket.title}</p>
                      <p className="text-sm text-text-muted">{ticket.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-theme-text">{ticket.requester.name}</p>
                      <p className="text-xs text-text-muted">{ticket.requester.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {ticket.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="text-sm text-theme-text">{ticket.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted">未分配</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-text-muted">{ticket.createdAt}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleViewDetail(ticket)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(ticket)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    {ticket.status !== 'resolved' && (
                      <button onClick={() => handleResolve(ticket.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(ticket.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 mx-auto text-primary/20 mb-4" />
            <p className="text-text-muted">暂无工单数据</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-theme-text">{editingTicket ? '编辑工单' : '新建工单'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">标题</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">优先级</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'high' | 'medium' | 'low' })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">分类</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="软件问题">软件问题</option>
                    <option value="硬件问题">硬件问题</option>
                    <option value="网络问题">网络问题</option>
                    <option value="系统配置">系统配置</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">分配给</label>
                <select value={formData.assigneeId} onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">未分配</option>
                  {users.map(user => (<option key={user.id} value={user.id}>{user.name}</option>))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingTicket ? '保存修改' : '创建工单'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-theme-text">工单详情</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-theme-text mb-2">{selectedTicket.title}</h4>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusLabel(selectedTicket.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {getPriorityLabel(selectedTicket.priority)}
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-text-muted mb-1">提交人</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-theme-text">{selectedTicket.requester.name}</p>
                      <p className="text-sm text-text-muted">{selectedTicket.requester.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-text-muted mb-1">负责人</p>
                  {selectedTicket.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-theme-text">{selectedTicket.assignee.name}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-muted">未分配</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-text-muted mb-2">问题描述</p>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-theme-text whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-text-muted">
                <div><p>创建时间: {selectedTicket.createdAt}</p></div>
                <div><p>更新时间: {selectedTicket.updatedAt}</p></div>
              </div>

              <div className="flex gap-3 mt-6">
                {selectedTicket.status !== 'resolved' && (
                  <>
                    <button onClick={() => { handleResolve(selectedTicket.id); setShowDetailModal(false); }} className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">标记为已解决</button>
                    <button onClick={() => { handleEdit(selectedTicket); setShowDetailModal(false); }} className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors">编辑工单</button>
                  </>
                )}
                <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-text-muted rounded-xl hover:bg-gray-200 transition-colors">关闭</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
