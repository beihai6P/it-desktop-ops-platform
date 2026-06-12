import React, { useState, useEffect } from 'react';
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
  X
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

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, search, statusFilter, roleFilter]);

  const fetchUsers = async () => {
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
      setUsers(response.data.data);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await userAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  };

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
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      banned: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status === 'active' ? '活跃' : status === 'inactive' ? '停用' : '封禁'}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      technician: 'bg-blue-100 text-blue-700',
      user: 'bg-gray-100 text-gray-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role] || styles.user}`}>
        {role === 'admin' ? '管理员' : role === 'technician' ? '运维人员' : '用户'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-text">用户管理</h1>
              <p className="text-text-muted">管理系统用户账号和权限</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-theme-text hover:bg-gray-100 rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            {hasPermission('USER_CREATE') && (
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                添加用户
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-primary/20">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-text-muted">总用户数</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-text-muted">活跃用户</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-text-muted">停用用户</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.banned}</div>
              <div className="text-sm text-text-muted">封禁用户</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
              <div className="text-sm text-text-muted">管理员</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-primary/20 mb-6">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索用户名或邮箱..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
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
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            >
              <option value="">全部角色</option>
              <option value="admin">管理员</option>
              <option value="technician">运维人员</option>
              <option value="user">普通用户</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
            >
              搜索
            </button>
          </form>
        </div>

        {/* Batch Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6 flex items-center justify-between">
            <span className="text-blue-700">已选择 {selectedUsers.length} 个用户</span>
            <div className="flex items-center gap-3">
              {hasPermission('USER_DELETE') && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  批量删除
                </button>
              )}
              <button
                onClick={() => setSelectedUsers([])}
                className="px-4 py-2 text-text-muted hover:text-theme-text transition-all"
              >
                取消选择
              </button>
            </div>
          </div>
        )}

        {/* User Table */}
        <div className="bg-white rounded-xl border border-primary/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-muted">用户</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-muted">角色</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-muted">部门</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-muted">状态</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-muted">最后登录</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-muted">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-theme-text">{user.name}</div>
                          <div className="text-sm text-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        {user.isAdmin && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            超级管理员
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {user.department || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN')
                        : '从未登录'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('USER_EDIT') && (
                          <>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user._id, user.status)}
                              className={`p-2 rounded-lg transition-all ${
                                user.status === 'active'
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.status === 'active' ? '停用' : '启用'}
                            >
                              {user.status === 'active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                        {hasPermission('USER_DELETE') && !user.isAdmin && (
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-text-muted">
              显示 {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} 共 {total} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                .map((page, index, arr) => (
                  <React.Fragment key={page}>
                    {index > 0 && arr[index - 1] !== page - 1 && (
                      <span className="px-2 text-text-muted">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-primary text-white'
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
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
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
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-theme-text">
            {user ? '编辑用户' : '添加用户'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">用户名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              placeholder="请输入用户名"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">邮箱 *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              placeholder="请输入邮箱"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              密码 {user && '(留空则不修改)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              placeholder={user ? '输入新密码或不填' : '请输入密码'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">手机</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              placeholder="请输入手机号"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">部门</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="部门"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">职位</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="职位"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">角色</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            >
              <option value="user">普通用户</option>
              <option value="technician">运维人员</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isAdmin" className="text-sm font-medium text-text-muted">
              设为超级管理员
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-text-muted hover:bg-gray-100 rounded-lg transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
