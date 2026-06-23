import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/services/api';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserX,
  UserCheck,
  X,
  Save,
  UserCog,
  Mail,
  Building,
  Calendar
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles: Array<{ _id: string; name: string; code: string }>;
  status: string;
  isAdmin: boolean;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  banned: number;
  admins: number;
}

const UserManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const limit = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined
      };
      const response = await userAPI.getAll(params);
      const data = response.data || {};
      setUsers(data.data || data.users || []);
      const pagination = data.pagination || {};
      setTotal(pagination.total || 0);
      setTotalPages(pagination.pages || 1);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, roleFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await userAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此用户吗？')) return;
    try {
      await userAPI.delete(id);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedUsers.length} 个用户吗？`)) return;
    try {
      await userAPI.deleteMultiple(selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '批量删除失败');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await userAPI.toggleStatus(id, newStatus);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '状态更新失败');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(u => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
      inactive: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
      banned: 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]} shadow-sm`}>
        {status === 'active' ? '活跃' : status === 'inactive' ? '停用' : '封禁'}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white',
      technician: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
      user: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[role] || styles.user} shadow-sm`}>
        {role === 'admin' ? '管理员' : role === 'technician' ? '运维人员' : '普通用户'}
      </span>
    );
  };

  const statCards = [
    { label: '总用户数', value: stats?.total || 0, color: 'from-blue-500 to-indigo-600', icon: Users },
    { label: '活跃用户', value: stats?.active || 0, color: 'from-green-500 to-emerald-600', icon: UserCheck },
    { label: '停用用户', value: stats?.inactive || 0, color: 'from-gray-500 to-gray-600', icon: UserX },
    { label: '封禁用户', value: stats?.banned || 0, color: 'from-red-500 to-rose-600', icon: Trash2 },
    { label: '管理员', value: stats?.admins || 0, color: 'from-purple-500 to-violet-600', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
              <p className="text-gray-500 mt-1">管理系统用户账号和权限</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">刷新</span>
            </button>
            {hasPermission('USER_CREATE') && (
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">添加用户</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索用户名或邮箱..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
              <option value="banned">封禁</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">全部角色</option>
              <option value="admin">管理员</option>
              <option value="technician">运维人员</option>
              <option value="user">普通用户</option>
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 font-medium"
            >
              搜索
            </button>
          </form>
        </div>

        {/* Batch Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">已选择 {selectedUsers.length} 个用户</p>
                <p className="text-blue-100 text-sm">批量操作</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasPermission('USER_DELETE') && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  批量删除
                </button>
              )}
              <button
                onClick={() => setSelectedUsers([])}
                className="px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium"
              >
                取消选择
              </button>
            </div>
          </div>
        )}

        {/* User Table */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800">用户列表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === (users?.length || 0) && (users?.length || 0) > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/50"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">用户信息</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">角色</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">部门</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">最后登录</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : (users?.length || 0) === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">暂无用户数据</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/50"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{user.name}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                          {user.isAdmin && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm">
                              超级管理员
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="w-4 h-4 text-gray-400" />
                          {user.department || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN')
                            : '从未登录'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission('USER_EDIT') && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowModal(true);
                                }}
                                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                title="编辑"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user._id, user.status)}
                                className={`p-2.5 rounded-xl transition-all ${
                                  user.status === 'active'
                                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}
                                title={user.status === 'active' ? '停用' : '启用'}
                              >
                                {user.status === 'active' ? (
                                  <UserX className="w-5 h-5" />
                                ) : (
                                  <UserCheck className="w-5 h-5" />
                                )}
                              </button>
                            </>
                          )}
                          {hasPermission('USER_DELETE') && !user.isAdmin && (
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                              title="删除"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                显示 {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} 共 {total.toLocaleString()} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                  .map((page, index, arr) => (
                    <React.Fragment key={page}>
                      {index > 0 && arr[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchUsers();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || '',
    isAdmin: user?.isAdmin || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email) {
      setError('请填写必填项');
      return;
    }
    
    if (!user && !formData.password) {
      setError('请输入密码');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = { ...formData };
      if (!data.password) delete data.password;
      
      if (user) {
        await userAPI.update(user._id, data);
      } else {
        await userAPI.create(data);
      }
      onSave();
    } catch (error) {
      setError((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{user ? '编辑用户' : '添加用户'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱 *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              placeholder="请输入邮箱"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码 {user ? '(留空则不修改)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              placeholder="请输入密码"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
              >
                <option value="user">普通用户</option>
                <option value="technician">运维人员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">部门</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                placeholder="请输入部门"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">职位</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                placeholder="请输入职位"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                placeholder="请输入电话"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/50"
            />
            <label className="text-sm font-medium text-gray-700">设为超级管理员</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
