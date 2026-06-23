import { useState, useEffect } from 'react';
import { 
  Activity, Users, FileText, Clock, AlertTriangle, TrendingUp, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Server, Database, Zap, Shield, LayoutDashboard, 
  Home as HomeIcon, ArrowRight, UserCog, CheckSquare, BarChart3, Settings,
  ChevronRight, Calendar, MessageSquare, BookOpen, Wrench
} from 'lucide-react';
import { caseAPI, ticketAPI, userAPI, postAPI, documentAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Case, Ticket, User } from '@/types';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState([
    { title: '今日活跃诊断', value: 0, icon: Activity, trend: '+0%', trendType: 'up' as const, gradient: 'from-blue-500 to-blue-600', bgGradient: 'from-blue-50 to-blue-100' },
    { title: '在线用户', value: 0, icon: Users, trend: '+0%', trendType: 'up' as const, gradient: 'from-emerald-500 to-green-600', bgGradient: 'from-emerald-50 to-green-100' },
    { title: '待处理工单', value: 0, icon: FileText, trend: '+0%', trendType: 'down' as const, gradient: 'from-orange-500 to-amber-600', bgGradient: 'from-orange-50 to-amber-100' },
    { title: '知识库文档', value: 0, icon: BookOpen, trend: '+0%', trendType: 'up' as const, gradient: 'from-purple-500 to-violet-600', bgGradient: 'from-purple-50 to-violet-100' },
  ]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesResponse, ticketsResponse, usersResponse, postStats, documentStats] = await Promise.all([
        caseAPI.getAll({ limit: 5 }),
        ticketAPI.getAll({ limit: 5 }),
        userAPI.getAll({ limit: 5 }),
        postAPI.getStats(),
        documentAPI.getStats(),
      ]);
      
      setCases(casesResponse.data.cases || casesResponse.data || []);
      setTickets(ticketsResponse.data.tickets || ticketsResponse.data || []);
      setUsers(usersResponse.data.users || usersResponse.data || []);

      setStats([
        { title: '今日活跃诊断', value: (casesResponse.data.cases?.length || 0), icon: Activity, trend: '+12%', trendType: 'up' as const, gradient: 'from-blue-500 to-blue-600', bgGradient: 'from-blue-50 to-blue-100' },
        { title: '在线用户', value: (usersResponse.data.users?.length || 0), icon: Users, trend: '+8%', trendType: 'up' as const, gradient: 'from-emerald-500 to-green-600', bgGradient: 'from-emerald-50 to-green-100' },
        { title: '待处理工单', value: (ticketsResponse.data.tickets?.filter((t: Ticket) => t.status === 'open').length || 0), icon: FileText, trend: '-5%', trendType: 'down' as const, gradient: 'from-orange-500 to-amber-600', bgGradient: 'from-orange-50 to-amber-100' },
        { title: '知识库文档', value: (documentStats.data?.total || 0), icon: BookOpen, trend: '+15%', trendType: 'up' as const, gradient: 'from-purple-500 to-violet-600', bgGradient: 'from-purple-50 to-violet-100' },
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const systemStatus = [
    { name: '服务器', status: 'online', count: 24, icon: Server },
    { name: '数据库', status: 'online', count: 6, icon: Database },
    { name: 'API服务', status: 'online', count: 12, icon: Zap },
    { name: '安全服务', status: 'online', count: 4, icon: Shield },
  ];

  const quickNavItems = [
    { title: '用户管理', description: '管理平台用户', icon: UserCog, color: 'from-blue-500 to-indigo-600', onClick: () => navigate('/admin/users') },
    { title: '角色权限', description: '管理角色权限', icon: Shield, color: 'from-purple-500 to-violet-600', onClick: () => navigate('/admin/roles') },
    { title: '内容审核', description: '审核帖子评论', icon: CheckSquare, color: 'from-orange-500 to-amber-600', onClick: () => navigate('/admin/review') },
    { title: '数据洞察', description: '查看数据分析', icon: BarChart3, color: 'from-emerald-500 to-green-600', onClick: () => navigate('/analytics') },
    { title: '工单管理', description: '处理用户工单', icon: MessageSquare, color: 'from-cyan-500 to-teal-600', onClick: () => navigate('/tickets') },
    { title: '系统设置', description: '系统配置管理', icon: Settings, color: 'from-gray-500 to-gray-600', onClick: () => navigate('/settings') },
  ];

  const recentCases = cases.slice(0, 5);
  const recentTickets = tickets.slice(0, 5);
  const recentUsers = users.slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'low':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-600';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-600';
      case 'resolved':
        return 'bg-green-100 text-green-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'approved':
        return 'bg-green-100 text-green-600';
      case 'rejected':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return '待处理';
      case 'in_progress':
        return '处理中';
      case 'resolved':
        return '已解决';
      case 'pending':
        return '待审核';
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">管理后台</h1>
            <p className="text-gray-500 mt-1">欢迎回来，{user?.name || '管理员'}！今日数据概览</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-gray-700">刷新数据</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-green-700">系统运行中</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative overflow-hidden bg-white rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} opacity-50 rounded-bl-full`}></div>
                <div className="relative p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                    <div className="flex items-end justify-between mt-1">
                      <span className="text-3xl font-bold text-gray-800">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </span>
                      <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.trendType === 'up' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {stat.trend}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">快速导航</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickNavItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">最近诊断记录</h2>
              <button
                onClick={() => navigate('/diagnosis')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">暂无诊断记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    onClick={() => navigate(`/diagnosis/${caseItem.id}`)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                          {caseItem.title || '未命名诊断'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {getStatusText(caseItem.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString('zh-CN') : '-'}
                        </span>
                        {caseItem.author && <span>作者: {caseItem.author}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">待处理工单</h2>
              <button
                onClick={() => navigate('/tickets')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">暂无待处理工单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${getPriorityColor(ticket.priority).split(' ')[0]}`}>
                      <AlertTriangle className={`w-5 h-5 ${getPriorityColor(ticket.priority).split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {ticket.title || '未命名工单'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}优先级
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">系统运行状态</h2>
            <div className="grid grid-cols-2 gap-4">
              {systemStatus.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-green-600">运行中</span>
                        <span className="text-sm text-gray-400 ml-auto">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">最近注册用户</h2>
              <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">暂无新用户</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((userItem, index) => (
                  <div
                    key={`user-${userItem.id}-${index}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {userItem.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{userItem.name}</p>
                      <p className="text-sm text-gray-500">{userItem.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${userItem.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {userItem.status === 'online' ? '在线' : '离线'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
