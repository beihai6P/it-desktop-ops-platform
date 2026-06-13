import { useState, useEffect } from 'react';
import { Activity, Users, FileText, Clock, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Server, Database, Zap, Shield, LayoutDashboard, Home as HomeIcon } from 'lucide-react';
import { caseAPI, ticketAPI, userAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Case, Ticket, User } from '@/types';

export default function Home() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [casesResponse, ticketsResponse, usersResponse] = await Promise.all([
        caseAPI.getAll({ limit: 5 }),
        ticketAPI.getAll({ limit: 5 }),
        userAPI.getAll({ limit: 5 }),
      ]);
      setCases(casesResponse.data.cases);
      setTickets(ticketsResponse.data.tickets);
      setUsers(usersResponse.data.users || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: '今日活跃诊断',
      value: 47,
      icon: Activity,
      trend: '+12%',
      trendType: 'up' as const,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: '在线用户',
      value: 128,
      icon: Users,
      trend: '+8%',
      trendType: 'up' as const,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: '待处理工单',
      value: 15,
      icon: FileText,
      trend: '-5%',
      trendType: 'down' as const,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: '平均响应时间',
      value: '3.2min',
      icon: Clock,
      trend: '-15%',
      trendType: 'down' as const,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  const systemStatus = [
    { name: '服务器', status: 'online', count: 24, icon: Server },
    { name: '数据库', status: 'online', count: 6, icon: Database },
    { name: 'API服务', status: 'online', count: 12, icon: Zap },
    { name: '安全服务', status: 'online', count: 4, icon: Shield },
  ];

  const recentCases = cases.slice(0, 5);
  const recentTickets = tickets.slice(0, 5);
  const recentUsers = users.slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
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
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-600';
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
      case 'closed':
        return '已关闭';
      default:
        return status;
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  {isAdmin ? <LayoutDashboard className="w-5 h-5 text-primary" /> : <HomeIcon className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-theme-text">{isAdmin ? '管理后台' : '首页'}</h2>
                  <p className="text-sm text-text-muted mt-1">{isAdmin ? '欢迎回来，查看系统概览' : '欢迎回来，查看您的工作台'}</p>
                </div>
              </div>
            </div>
          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-primary/20 rounded-xl hover:bg-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.trendType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trendType === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div className="text-3xl font-bold text-theme-text mb-1">{stat.value}</div>
                <div className="text-sm text-text-muted">{stat.title}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme-text">最近诊断记录</h3>
              <span className="text-sm text-text-muted">查看全部</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-text-muted text-sm">暂无诊断记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCases.map((caseItem) => (
                  <div key={caseItem.id} className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-theme-text truncate">
                        {caseItem.title || '未命名诊断'}
                      </div>
                      <div className="text-sm text-text-muted">
                        {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString('zh-CN') : '-'}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(caseItem.status)}`}>
                      {getStatusText(caseItem.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme-text">待处理工单</h3>
              <span className="text-sm text-text-muted">查看全部</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-text-muted text-sm">暂无待处理工单</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 ${getPriorityColor(ticket.priority).split(' ')[0]} rounded-xl flex items-center justify-center`}>
                      <TrendingUp className={`w-5 h-5 ${getPriorityColor(ticket.priority).split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-theme-text truncate">
                        {ticket.title || '未命名工单'}
                      </div>
                      <div className="text-sm text-text-muted">
                        优先级: {getPriorityText(ticket.priority)}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold text-theme-text mb-4">系统运行状态</h3>
            <div className="grid grid-cols-4 gap-4">
              {systemStatus.map((service) => {
                const Icon = service.icon;
                return (
                  <div key={service.name} className="text-center p-4 bg-gray-50/50 rounded-xl">
                    <div className={`inline-flex items-center justify-center w-3 h-3 rounded-full mb-3 ${service.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-theme-text">{service.count}</div>
                    <div className="text-sm text-text-muted">{service.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold text-theme-text mb-4">最近注册用户</h3>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-text-muted text-sm">暂无用户</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-theme-text truncate">
                        {user.name || user.email}
                      </div>
                      <div className="text-sm text-text-muted">
                        {user.email}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${user.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {user.status === 'online' ? '在线' : user.status === 'away' ? '离开' : '离线'}
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