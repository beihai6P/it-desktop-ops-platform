import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  Shield,
  FileText,
  Wrench,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Award,
  Calendar,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  Search,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { postAPI, ticketAPI, toolAPI, documentAPI, userAPI } from '@/services/api';
import type { Post, Ticket, Tool, Document, User } from '@/types';

interface UserStats {
  postsCount: number;
  ticketsCount: number;
  toolsCount: number;
  documentsCount: number;
  totalLikes: number;
  totalViews: number;
  followersCount: number;
}

interface Activity {
  id: string;
  type: 'post' | 'ticket' | 'tool' | 'document' | 'comment';
  title: string;
  description: string;
  createdAt: string;
  icon: React.ElementType;
}

type TabType = 'profile' | 'content' | 'stats' | 'security' | 'permissions';

export default function Profile() {
  const { user, updateUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 用户数据
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    bio: '',
  });

  // 内容数据
  const [posts, setPosts] = useState<Post[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentFilter, setContentFilter] = useState<'all' | 'posts' | 'tickets' | 'tools' | 'documents'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 统计数据
  const [stats, setStats] = useState<UserStats>({
    postsCount: 0,
    ticketsCount: 0,
    toolsCount: 0,
    documentsCount: 0,
    totalLikes: 0,
    totalViews: 0,
    followersCount: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);

  // 安全设置
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        bio: (user as User & { bio?: string }).bio || '',
      });
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadContent(),
        loadStats(),
        loadActivities(),
      ]);
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    if (!user) return;
    setContentLoading(true);
    try {
      const [postsRes, ticketsRes, toolsRes, docsRes] = await Promise.all([
        postAPI.getAll({ authorId: user.id, limit: 100 }).catch(() => ({ data: { posts: [] } })),
        ticketAPI.getAll({ creatorId: user.id, limit: 100 }).catch(() => ({ data: { tickets: [] } })),
        toolAPI.getAll({ authorId: user.id, limit: 100 }).catch(() => ({ data: { tools: [] } })),
        documentAPI.getAll({ authorId: user.id, limit: 100 }).catch(() => ({ data: { documents: [] } })),
      ]);

      setPosts(postsRes.data.posts || []);
      setTickets(ticketsRes.data.tickets || []);
      setTools(toolsRes.data.tools || []);
      setDocuments(docsRes.data.documents || []);
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    try {
      const statsRes = await userAPI.getStats().catch(() => ({ data: { data: null } }));
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      } else {
        // 使用本地计算的数据
        setStats({
          postsCount: posts.length,
          ticketsCount: tickets.length,
          toolsCount: tools.length,
          documentsCount: documents.length,
          totalLikes: posts.reduce((sum, p) => sum + p.likes, 0) + tools.reduce((sum, t) => sum + t.stars, 0),
          totalViews: posts.reduce((sum, p) => sum + p.views, 0) + tools.reduce((sum, t) => sum + t.views, 0) + documents.reduce((sum, d) => sum + d.views, 0),
          followersCount: user.followers || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadActivities = async () => {
    if (!user) return;
    const allActivities: Activity[] = [];

    // 添加帖子活动
    posts.slice(0, 5).forEach(post => {
      allActivities.push({
        id: `post-${post.id}`,
        type: 'post',
        title: post.title,
        description: `发布了新帖子`,
        createdAt: post.createdAt,
        icon: MessageSquare,
      });
    });

    // 添加工单活动
    tickets.slice(0, 5).forEach(ticket => {
      allActivities.push({
        id: `ticket-${ticket.id}`,
        type: 'ticket',
        title: ticket.title,
        description: `创建了工单`,
        createdAt: ticket.createdAt,
        icon: FileText,
      });
    });

    // 添加工具活动
    tools.slice(0, 5).forEach(tool => {
      allActivities.push({
        id: `tool-${tool.id}`,
        type: 'tool',
        title: tool.name,
        description: `分享了工具`,
        createdAt: tool.createdAt,
        icon: Wrench,
      });
    });

    // 添加文档活动
    documents.slice(0, 5).forEach(doc => {
      allActivities.push({
        id: `doc-${doc.id}`,
        type: 'document',
        title: doc.title,
        description: `贡献了文档`,
        createdAt: doc.createdAt,
        icon: BookOpen,
      });
    });

    // 按时间排序
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setActivities(allActivities.slice(0, 10));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUser(formData);
      setSuccess('个人资料更新成功');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || '更新失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 创建 FormData 上传文件
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      // 这里假设后端有上传头像的接口
      // 实际项目中需要根据后端 API 调整
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // 使用 base64 更新头像
          await updateUser({ avatar: reader.result as string });
          setSuccess('头像更新成功');
          setTimeout(() => setSuccess(null), 3000);
        } catch {
          setError('头像上传失败');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError('头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('请填写所有密码字段');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('密码长度至少为 6 位');
      return;
    }

    try {
      // 调用修改密码 API
      await userAPI.resetPassword(user?.id || '', passwordData.newPassword);
      setSuccess('密码修改成功');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || '密码修改失败');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'manager':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'engineer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPermissionLevel = (code: string) => {
    if (code.includes('admin') || code.includes('manage')) return '管理';
    if (code.includes('edit') || code.includes('update')) return '编辑';
    if (code.includes('create') || code.includes('add')) return '创建';
    if (code.includes('delete') || code.includes('remove')) return '删除';
    if (code.includes('view') || code.includes('read')) return '查看';
    return '其他';
  };

  const getPermissionColor = (level: string) => {
    switch (level) {
      case '管理':
        return 'bg-red-50 text-red-600';
      case '编辑':
        return 'bg-orange-50 text-orange-600';
      case '创建':
        return 'bg-blue-50 text-blue-600';
      case '删除':
        return 'bg-purple-50 text-purple-600';
      case '查看':
        return 'bg-green-50 text-green-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  interface ContentItem {
    id: string;
    title?: string;
    name?: string;
    createdAt?: string;
    likes?: number;
    views?: number;
    status?: string;
  }

  const filteredContent = (): ContentItem[] => {
    let items: ContentItem[] = [];
    switch (contentFilter) {
      case 'posts':
        items = posts.map(p => ({ ...p, title: p.title }));
        break;
      case 'tickets':
        items = tickets.map(t => ({ ...t, title: t.title }));
        break;
      case 'tools':
        items = tools.map(t => ({ ...t, name: t.name }));
        break;
      case 'documents':
        items = documents.map(d => ({ ...d, title: d.title }));
        break;
      default:
        items = [
          ...posts.map(p => ({ ...p, title: p.title })),
          ...tickets.map(t => ({ ...t, title: t.title })),
          ...tools.map(t => ({ ...t, name: t.name })),
          ...documents.map(d => ({ ...d, title: d.title })),
        ];
    }

    if (searchQuery) {
      items = items.filter(item =>
        (item.title || item.name)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  };

  const tabs = [
    { id: 'profile' as const, label: '个人资料', icon: UserIcon },
    { id: 'content' as const, label: '内容管理', icon: FileText },
    { id: 'stats' as const, label: '活动统计', icon: BarChart3 },
    { id: 'security' as const, label: '账号安全', icon: Lock },
    { id: 'permissions' as const, label: '权限信息', icon: Shield },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <UserIcon className="w-16 h-16 mx-auto text-primary/20 mb-4" />
          <p className="text-text-muted">请先登录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-theme-text">个人中心</h2>
              <p className="text-sm text-text-muted mt-1">管理您的个人信息和账号设置</p>
            </div>
          </div>
          <button
            onClick={loadUserData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-primary/20 rounded-xl hover:bg-white transition-all"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>

        {/* 提示消息 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4 text-green-500" />
            </button>
          </div>
        )}

        {/* 用户信息卡片 */}
        <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-white" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-theme-text">{user.name}</h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  isAuthenticated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isAuthenticated ? '在线' : '离线'}
                </span>
              </div>
              <p className="text-text-muted mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                {user.department && (
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    <span>{user.department}</span>
                  </div>
                )}
                {user.position && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{user.position}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 统计数据 */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.postsCount}</p>
                <p className="text-xs text-text-muted">帖子</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.totalLikes}</p>
                <p className="text-xs text-text-muted">获赞</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{stats.followersCount}</p>
                <p className="text-xs text-text-muted">关注者</p>
              </div>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl overflow-hidden">
          {/* 标签导航 */}
          <div className="flex border-b border-primary/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-text-muted hover:text-theme-text hover:bg-primary/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 标签内容 */}
          <div className="p-6">
            {/* 个人资料 */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-theme-text">基本信息</h4>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      编辑资料
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            department: user.department || '',
                            position: user.position || '',
                            bio: (user as User & { bio?: string }).bio || '',
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        保存
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* 姓名 */}
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      <UserIcon className="w-4 h-4 inline mr-2" />
                      姓名
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="请输入姓名"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50/50 rounded-xl text-theme-text">{user.name || '未设置'}</p>
                    )}
                  </div>

                  {/* 邮箱 */}
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      邮箱
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="请输入邮箱"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50/50 rounded-xl text-theme-text">{user.email || '未设置'}</p>
                    )}
                  </div>

                  {/* 手机 */}
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      手机
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="请输入手机号"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50/50 rounded-xl text-theme-text">{user.phone || '未设置'}</p>
                    )}
                  </div>

                  {/* 部门 */}
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      部门
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="请输入部门"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50/50 rounded-xl text-theme-text">{user.department || '未设置'}</p>
                    )}
                  </div>

                  {/* 职位 */}
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      职位
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="请输入职位"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50/50 rounded-xl text-theme-text">{user.position || '未设置'}</p>
                    )}
                  </div>

                  {/* 个人简介 */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      <Edit2 className="w-4 h-4 inline mr-2" />
                      个人简介
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-4 py-3 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px]"
                        placeholder="介绍一下自己吧..."
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50/50 rounded-xl text-theme-text min-h-[100px]">
                        {(user as User & { bio?: string }).bio || '这个人很懒，什么都没留下...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 内容管理 */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                {/* 筛选和搜索 */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="搜索内容..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/85 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  </div>
                  <div className="flex gap-2">
                    {['all', 'posts', 'tickets', 'tools', 'documents'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setContentFilter(filter as 'all' | 'posts' | 'tickets' | 'tools' | 'documents')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          contentFilter === filter
                            ? 'bg-primary text-white'
                            : 'bg-primary/5 text-text-muted hover:bg-primary/10'
                        }`}
                      >
                        {filter === 'all' ? '全部' : filter === 'posts' ? '帖子' : filter === 'tickets' ? '工单' : filter === 'tools' ? '工具' : '文档'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 内容列表 */}
                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filteredContent().length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-primary/20 mb-3" />
                    <p className="text-text-muted">暂无内容</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredContent().map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          {item.title ? (
                            <MessageSquare className="w-5 h-5 text-primary" />
                          ) : item.name ? (
                            <Wrench className="w-5 h-5 text-primary" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-theme-text truncate">{item.title || item.name}</p>
                          <p className="text-sm text-text-muted">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-text-muted">
                          {item.likes !== undefined && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {item.likes}
                            </span>
                          )}
                          {item.views !== undefined && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {item.views}
                            </span>
                          )}
                          {item.status && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'open' ? 'bg-blue-100 text-blue-700' :
                              item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                              item.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              item.status === 'hot' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 活动统计 */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <MessageSquare className="w-8 h-8 text-blue-500" />
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">帖子</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{stats.postsCount}</p>
                    <p className="text-sm text-blue-600 mt-1">发布数量</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <FileText className="w-8 h-8 text-green-500" />
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">工单</span>
                    </div>
                    <p className="text-3xl font-bold text-green-700">{stats.ticketsCount}</p>
                    <p className="text-sm text-green-600 mt-1">处理数量</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Wrench className="w-8 h-8 text-purple-500" />
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">工具</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-700">{stats.toolsCount}</p>
                    <p className="text-sm text-purple-600 mt-1">分享数量</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <BookOpen className="w-8 h-8 text-orange-500" />
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">文档</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-700">{stats.documentsCount}</p>
                    <p className="text-sm text-orange-600 mt-1">贡献数量</p>
                  </div>
                </div>

                {/* 其他统计 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">总获赞数</p>
                        <p className="text-2xl font-bold text-theme-text">{stats.totalLikes}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">总浏览量</p>
                        <p className="text-2xl font-bold text-theme-text">{stats.totalViews}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Award className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">关注者</p>
                        <p className="text-2xl font-bold text-theme-text">{stats.followersCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 最近活动 */}
                <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                  <h4 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    最近活动
                  </h4>
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto text-primary/20 mb-3" />
                      <p className="text-text-muted">暂无活动记录</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-xl">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-theme-text truncate">{activity.title}</p>
                              <p className="text-xs text-text-muted">{activity.description}</p>
                            </div>
                            <p className="text-xs text-text-muted">
                              {new Date(activity.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 账号安全 */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* 账号状态 */}
                <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                  <h4 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    账号状态
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl">
                      <div className={`w-3 h-3 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="text-sm text-text-muted">账号状态</p>
                        <p className="font-medium text-theme-text">{user.status === 'active' ? '正常' : '异常'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-text-muted">邮箱验证</p>
                        <p className="font-medium text-theme-text">已验证</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-text-muted">注册时间</p>
                        <p className="font-medium text-theme-text">
                          {(user as User & { createdAt?: string }).createdAt ? new Date((user as User & { createdAt?: string }).createdAt).toLocaleDateString('zh-CN') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-text-muted">最近登录</p>
                        <p className="font-medium text-theme-text">
                          {(user as User & { lastLogin?: string }).lastLogin ? new Date((user as User & { lastLogin?: string }).lastLogin).toLocaleString('zh-CN') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 安全设置 */}
                <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                  <h4 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    安全设置
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-text-muted" />
                        <div>
                          <p className="font-medium text-theme-text">登录密码</p>
                          <p className="text-sm text-text-muted">定期修改密码可以提高账号安全性</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                      >
                        修改密码
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-text-muted" />
                        <div>
                          <p className="font-medium text-theme-text">两步验证</p>
                          <p className="text-sm text-text-muted">增强账号安全性</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">未开启</span>
                    </div>
                  </div>
                </div>

                {/* 退出登录 */}
                <div className="bg-white/85 border border-red-200 rounded-xl p-5">
                  <h4 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-red-500" />
                    退出登录
                  </h4>
                  <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-theme-text">退出当前账号</p>
                        <p className="text-sm text-text-muted">退出后需要重新登录才能访问系统</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 权限信息 */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                {/* 角色信息 */}
                <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                  <h4 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    角色信息
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getRoleBadgeColor(user.role)}`}>
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-theme-text">
                          {user.role === 'admin' ? '管理员' : user.role === 'super_admin' ? '超级管理员' : user.role}
                        </p>
                        <p className="text-sm text-text-muted">主角色</p>
                      </div>
                    </div>

                    {user.roles && user.roles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-text-muted">其他角色</p>
                        {user.roles.map((role) => (
                          <div key={role._id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRoleBadgeColor(role.code)}`}>
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-theme-text">{role.name}</p>
                              <p className="text-xs text-text-muted">{role.code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 权限列表 */}
                <div className="bg-white/85 border border-primary/20 rounded-xl p-5">
                  <h4 className="font-semibold text-theme-text mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    权限列表
                  </h4>
                  {user.permissions && user.permissions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {user.permissions.map((permission) => {
                        const level = getPermissionLevel(permission.code);
                        return (
                          <div key={permission._id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPermissionColor(level)}`}>
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-theme-text truncate">{permission.name}</p>
                              <p className="text-xs text-text-muted">{permission.code}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${getPermissionColor(level)}`}>
                              {level}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto text-primary/20 mb-3" />
                      <p className="text-text-muted">暂无特殊权限</p>
                    </div>
                  )}
                </div>

                {/* 权限等级说明 */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-primary/20 rounded-xl p-5">
                  <h4 className="font-semibold text-theme-text mb-4">权限等级说明</h4>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-white/80 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-2 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-sm font-medium text-theme-text">管理</p>
                      <p className="text-xs text-text-muted">完全控制</p>
                    </div>
                    <div className="text-center p-3 bg-white/80 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-2 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Edit2 className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-sm font-medium text-theme-text">编辑</p>
                      <p className="text-xs text-text-muted">修改内容</p>
                    </div>
                    <div className="text-center p-3 bg-white/80 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-theme-text">创建</p>
                      <p className="text-xs text-text-muted">新建内容</p>
                    </div>
                    <div className="text-center p-3 bg-white/80 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 rounded-lg flex items-center justify-center">
                        <X className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-theme-text">删除</p>
                      <p className="text-xs text-text-muted">移除内容</p>
                    </div>
                    <div className="text-center p-3 bg-white/80 rounded-xl">
                      <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                        <Eye className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-theme-text">查看</p>
                      <p className="text-xs text-text-muted">只读访问</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-theme-text">修改密码</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">当前密码</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                    placeholder="请输入当前密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-text-muted" />
                    ) : (
                      <Eye className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">新密码</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                    placeholder="请输入新密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-text-muted" />
                    ) : (
                      <Eye className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">确认新密码</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}