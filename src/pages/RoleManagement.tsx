import React, { useState, useEffect } from 'react';
import { roleAPI } from '@/services/api';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Key,
  RefreshCw,
  X,
  Users,
  AlertCircle
} from 'lucide-react';

interface Permission {
  _id: string;
  name: string;
  code: string;
  description: string;
  category: string;
}

interface Role {
  _id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  permissions: Permission[];
  isActive: boolean;
  isDefault: boolean;
  userCount?: number;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getRoles();
      setRoles(response.data.data);
    } catch (error) {
      console.error('获取角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await roleAPI.getPermissions();
      setPermissions(response.data.data);
      setGroupedPermissions(response.data.grouped);
    } catch (error) {
      console.error('获取权限列表失败:', error);
    }
  };

  const handleInitDefaults = async () => {
    if (!confirm('确定要初始化默认权限和角色吗？这将创建系统必需的默认数据。')) return;
    
    setInitLoading(true);
    try {
      await roleAPI.initDefaults();
      fetchRoles();
      fetchPermissions();
      alert('初始化成功！');
    } catch (error) {
      alert((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '初始化失败');
    } finally {
      setInitLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('确定要删除此角色吗？')) return;
    try {
      await roleAPI.deleteRole(id);
      fetchRoles();
    } catch (error) {
      alert((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败');
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (!confirm('确定要删除此权限吗？')) return;
    try {
      await roleAPI.deletePermission(id);
      fetchPermissions();
    } catch (error) {
      alert((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '删除失败');
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      user: '用户管理',
      case: '工单管理',
      tool: '工具管理',
      document: '文档管理',
      system: '系统管理',
      report: '报表管理'
    };
    return names[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      user: 'bg-purple-100 text-purple-700',
      case: 'bg-blue-100 text-blue-700',
      tool: 'bg-green-100 text-green-700',
      document: 'bg-amber-100 text-amber-700',
      system: 'bg-red-100 text-red-700',
      report: 'bg-cyan-100 text-cyan-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-text">角色与权限管理</h1>
              <p className="text-text-muted">管理系统角色和访问权限</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleInitDefaults}
              disabled={initLoading}
              className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-theme-text hover:bg-gray-100 rounded-lg transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${initLoading ? 'animate-spin' : ''}`} />
              初始化默认数据
            </button>
            <button
              onClick={() => {
                setEditingRole(null);
                setShowRoleModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              添加角色
            </button>
          </div>
        </div>

        {/* Empty State */}
        {(roles?.length || 0) === 0 && !loading && (
          <div className="bg-white rounded-xl p-12 border border-primary/20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-theme-text mb-2">暂无角色数据</h3>
            <p className="text-text-muted mb-6">点击"初始化默认数据"来创建系统默认的角色和权限</p>
            <button
              onClick={handleInitDefaults}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
            >
              初始化默认数据
            </button>
          </div>
        )}

        {/* Role List */}
        {(roles?.length || 0) > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-primary/20 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-theme-text flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  角色列表
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {roles.map((role) => (
                  <div key={role._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-theme-text">{role.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                            {role.code}
                          </span>
                          {role.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              默认
                            </span>
                          )}
                          {role.isActive ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              启用
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                              停用
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted mb-3">{role.description}</p>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span>权限等级: {role.level}</span>
                          {role.userCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {role.userCount} 个用户
                            </span>
                          )}
                        </div>
                        {role.permissions && role.permissions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {role.permissions.slice(0, 6).map((perm) => (
                              <span
                                key={perm._id}
                                className={`px-2 py-1 rounded text-xs ${getCategoryColor(perm.category)}`}
                                title={perm.description}
                              >
                                {perm.name}
                              </span>
                            ))}
                            {(role.permissions?.length || 0) > 6 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{(role.permissions?.length || 0) - 6} 更多
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingRole(role);
                            setShowRoleModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!role.isDefault && (
                          <button
                            onClick={() => handleDeleteRole(role._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permission List */}
            <div className="bg-white rounded-xl border border-primary/20 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme-text flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  权限列表
                </h2>
                <button
                  onClick={() => {
                    setEditingPermission(null);
                    setShowPermissionModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  添加权限
                </button>
              </div>
              
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="p-4 border-b border-gray-100 last:border-b-0">
                  <h3 className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-3 ${getCategoryColor(category)}`}>
                    {getCategoryName(category)}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {perms.map((perm) => (
                      <div
                        key={perm._id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-theme-text truncate">
                              {perm.name}
                            </div>
                            <div className="text-xs text-text-muted font-mono">
                              {perm.code}
                            </div>
                            {perm.description && (
                              <div className="text-xs text-text-muted mt-1 truncate">
                                {perm.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingPermission(perm);
                                setShowPermissionModal(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-all"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePermission(perm._id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          permissions={permissions}
          onClose={() => setShowRoleModal(false)}
          onSave={() => {
            setShowRoleModal(false);
            fetchRoles();
          }}
        />
      )}

      {/* Permission Modal */}
      {showPermissionModal && (
        <PermissionModal
          permission={editingPermission}
          onClose={() => setShowPermissionModal(false)}
          onSave={() => {
            setShowPermissionModal(false);
            fetchPermissions();
          }}
        />
      )}
    </div>
  );
};

interface RoleModalProps {
  role: Role | null;
  permissions: Permission[];
  onClose: () => void;
  onSave: () => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ role, permissions, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    code: role?.code || '',
    description: role?.description || '',
    level: role?.level || 1,
    isDefault: role?.isDefault || false,
    isActive: role?.isActive ?? true,
    permissions: role?.permissions?.map(p => p._id) || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.code) {
      setError('请填写必填项');
      return;
    }
    
    if (formData.code && !/^[A-Z0-9_]+$/.test(formData.code)) {
      setError('角色代码只能包含大写字母、数字和下划线');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = { ...formData };
      if (role) {
        await roleAPI.updateRole(role._id, data);
      } else {
        await roleAPI.createRole(data);
      }
      onSave();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const groupedPerms = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      user: '用户管理',
      case: '工单管理',
      tool: '工具管理',
      document: '文档管理',
      system: '系统管理',
      report: '报表管理'
    };
    return names[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-theme-text">
            {role ? '编辑角色' : '添加角色'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">角色名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="如：运维人员"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">角色代码 *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-mono"
                  placeholder="如：TECHNICIAN"
                  disabled={!!role}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">描述</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                placeholder="角色描述"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">权限等级</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="flex items-end gap-4 pb-2.5">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-muted">默认角色</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-muted">启用</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">权限分配</label>
              <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {Object.entries(groupedPerms).map(([category, perms]) => (
                  <div key={category}>
                    <div className="text-xs font-medium text-text-muted mb-2 uppercase">
                      {getCategoryName(category)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <label
                          key={perm._id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                            formData.permissions.includes(perm._id)
                              ? 'bg-primary/10 border border-primary/30'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm._id)}
                            onChange={() => togglePermission(perm._id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm truncate">{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-text-muted hover:bg-gray-200 rounded-lg transition-all"
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

interface PermissionModalProps {
  permission: Permission | null;
  onClose: () => void;
  onSave: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ permission, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: permission?.name || '',
    code: permission?.code || '',
    description: permission?.description || '',
    category: permission?.category || 'system'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.code) {
      setError('请填写必填项');
      return;
    }
    
    if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      setError('权限代码只能包含大写字母、数字和下划线');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = { ...formData, code: formData.code.toUpperCase() };
      if (permission) {
        await roleAPI.updatePermission(permission._id, data);
      } else {
        await roleAPI.createPermission(data);
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
            {permission ? '编辑权限' : '添加权限'}
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
            <label className="block text-sm font-medium text-text-muted mb-1">权限名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              placeholder="如：查看用户"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">权限代码 *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-mono"
              placeholder="如：USER_VIEW"
              disabled={!!permission}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">分类</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            >
              <option value="user">用户管理</option>
              <option value="case">工单管理</option>
              <option value="tool">工具管理</option>
              <option value="document">文档管理</option>
              <option value="system">系统管理</option>
              <option value="report">报表管理</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
              placeholder="权限描述"
            />
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

export default RoleManagement;
