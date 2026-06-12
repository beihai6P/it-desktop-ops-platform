import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { roleAPI } from '../services/api';
import type { Role } from '../types';

const allPermissions = [
  'view_users', 'manage_users',
  'view_roles', 'manage_roles',
  'view_documents', 'manage_documents',
  'view_posts', 'manage_posts',
  'view_analytics', 'manage_settings',
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await roleAPI.update(editingRole.id, formData);
      } else {
        await roleAPI.create(formData);
      }
      loadRoles();
      setShowModal(false);
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个角色吗？')) {
      try {
        await roleAPI.delete(id);
        loadRoles();
      } catch (error) {
        console.error('Failed to delete role:', error);
      }
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      view_users: '查看用户',
      manage_users: '管理用户',
      view_roles: '查看角色',
      manage_roles: '管理角色',
      view_documents: '查看文档',
      manage_documents: '管理文档',
      view_posts: '查看帖子',
      manage_posts: '管理帖子',
      view_analytics: '查看数据',
      manage_settings: '管理设置',
    };
    return labels[permission] || permission;
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
          <h2 className="text-2xl font-bold text-theme-text">角色权限</h2>
          <p className="text-sm text-text-muted mt-1">管理角色和权限设置</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加角色
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-theme-text">{role.name}</h3>
                <p className="text-sm text-text-muted">{role.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(role)}
                  className="p-2 text-text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-muted">权限列表</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {getPermissionLabel(permission)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 mx-auto text-primary/20 mb-4" />
          <p className="text-text-muted">暂无角色数据</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-theme-text">
                {editingRole ? '编辑角色' : '添加角色'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">角色名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-3">权限</label>
                  <div className="grid grid-cols-2 gap-2">
                    {allPermissions.map((permission) => (
                      <button
                        key={permission}
                        type="button"
                        onClick={() => togglePermission(permission)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          formData.permissions.includes(permission)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-gray-50 border-gray-200 text-text-muted hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm">{getPermissionLabel(permission)}</span>
                        {formData.permissions.includes(permission) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-text-muted rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                >
                  {editingRole ? '保存修改' : '添加角色'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
