import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FileText, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../services/api';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalDocuments: 0,
    totalTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    averageResponseTime: 0,
    userGrowth: [] as { date: string; count: number }[],
    postActivity: [] as { date: string; count: number }[],
    documentStats: [] as { category: string; count: number }[],
    ticketStats: [] as { status: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      const data = response.data || response;
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const userGrowthData = stats.userGrowth.length > 0 
    ? stats.userGrowth.map(item => ({ month: item.date, users: item.count }))
    : [
        { month: '1月', users: 120 },
        { month: '2月', users: 180 },
        { month: '3月', users: 240 },
        { month: '4月', users: 320 },
        { month: '5月', users: 450 },
        { month: '6月', users: 580 },
      ];

  const postActivityData = stats.postActivity.length > 0
    ? stats.postActivity.map(item => ({ day: item.date, posts: item.count }))
    : [
        { day: '周一', posts: 28 },
        { day: '周二', posts: 35 },
        { day: '周三', posts: 42 },
        { day: '周四', posts: 38 },
        { day: '周五', posts: 55 },
        { day: '周六', posts: 72 },
        { day: '周日', posts: 65 },
      ];

  const documentCategoryData = stats.documentStats.length > 0
    ? stats.documentStats.map(item => ({ name: item.category, value: item.count }))
    : [
        { name: '操作系统', value: 35 },
        { name: '脚本工具', value: 28 },
        { name: '办公软件', value: 42 },
        { name: '硬件设备', value: 18 },
        { name: '安全合规', value: 25 },
        { name: '网络管理', value: 32 },
      ];

  const ticketStatusData = stats.ticketStats.length > 0
    ? stats.ticketStats.map(item => ({ name: item.status === 'pending' ? '待处理' : item.status === 'processing' ? '处理中' : '已解决', value: item.count }))
    : [
        { name: '待处理', value: stats.pendingTickets || 15 },
        { name: '处理中', value: Math.floor(stats.totalTickets / 3) || 8 },
        { name: '已解决', value: stats.resolvedTickets || 47 },
      ];

  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  const resolvedRate = stats.totalTickets > 0 
    ? ((stats.resolvedTickets / stats.totalTickets) * 100).toFixed(1) 
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-theme-text">数据洞察</h2>
        <p className="text-sm text-text-muted mt-1">分析平台数据和用户行为</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">总用户数</p>
              <p className="text-3xl font-bold text-theme-text">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">活跃用户</p>
              <p className="text-3xl font-bold text-theme-text">{stats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">工单总数</p>
              <p className="text-3xl font-bold text-theme-text">{stats.totalTickets.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">平均响应时间</p>
              <p className="text-3xl font-bold text-theme-text">{stats.averageResponseTime}分钟</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-theme-text">用户增长趋势</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-theme-text">本周发帖统计</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={postActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="posts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-theme-text">工单状态分布</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {ticketStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-theme-text">文档分类分布</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={documentCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#94a3b8' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-theme-text">工单统计概览</h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">工单解决率</span>
                <span className="text-sm font-semibold text-theme-text">{resolvedRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${resolvedRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{stats.pendingTickets}</p>
                <p className="text-xs text-text-muted mt-1">待处理</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <p className="text-2xl font-bold text-yellow-600">{stats.totalTickets - stats.pendingTickets - stats.resolvedTickets}</p>
                <p className="text-xs text-text-muted mt-1">处理中</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
                <p className="text-xs text-text-muted mt-1">已解决</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
