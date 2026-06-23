import { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, Activity, Ticket, Wrench, ArrowRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import SevenDayTrendChart from '../components/SevenDayTrendChart';
import { analyticsAPI, postAPI, userAPI } from '../services/api';
import type { AnalyticsData, Post, User } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalDocuments: 0,
    totalTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    averageResponseTime: 0,
    userGrowth: [],
    postActivity: [],
    documentStats: [],
    ticketStats: [],
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, postsRes, usersRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        postAPI.getAll(),
        userAPI.getAll(),
      ]);
      
      setStats(analyticsRes.data);
      setRecentPosts(postsRes.data.posts.slice(0, 5));
      setRecentUsers(usersRes.data.users.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-theme-text">仪表台</h2>
        <p className="text-sm text-text-muted mt-1">概览系统数据和关键指标</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="总用户数"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
          trend={{ value: 12, label: '较上周', isUp: true }}
        />
        <StatCard
          title="活跃用户"
          value={stats.activeUsers.toLocaleString()}
          icon={<Activity className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
          trend={{ value: 8, label: '较上周', isUp: true }}
        />
        <StatCard
          title="社区帖子"
          value={stats.totalPosts.toLocaleString()}
          icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
          trend={{ value: 5, label: '较上周', isUp: true }}
        />
        <StatCard
          title="知识库文档"
          value={stats.totalDocuments.toLocaleString()}
          icon={<FileText className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
          trend={{ value: 15, label: '较上周', isUp: true }}
        />
      </div>

      {/* 快速导航 */}
      <div className="mb-6">
        <h3 className="font-semibold text-theme-text mb-4">快速导航</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/tickets')}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-theme-text">工单管理</p>
                <p className="text-sm text-text-muted">{stats.pendingTickets} 待处理</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-theme-text">文档管理</p>
                <p className="text-sm text-text-muted">{stats.totalDocuments} 篇文档</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
          <button
            onClick={() => navigate('/tools')}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-theme-text">工具管理</p>
                <p className="text-sm text-text-muted">管理工具库</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
          <button
            onClick={() => navigate('/review')}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-theme-text">内容审核</p>
                <p className="text-sm text-text-muted">审核帖子评论</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* 7天趋势图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SevenDayTrendChart
          title="用户访问趋势"
          data={[
            { day: '周一', value: 120 },
            { day: '周二', value: 180 },
            { day: '周三', value: 150 },
            { day: '周四', value: 220 },
            { day: '周五', value: 280 },
            { day: '周六', value: 350 },
            { day: '周日', value: 320 },
          ]}
          color="#3b82f6"
        />
        <SevenDayTrendChart
          title="工单处理趋势"
          data={[
            { day: '周一', value: 45 },
            { day: '周二', value: 52 },
            { day: '周三', value: 38 },
            { day: '周四', value: 65 },
            { day: '周五', value: 58 },
            { day: '周六', value: 25 },
            { day: '周日', value: 18 },
          ]}
          color="#10b981"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-theme-text mb-4">最新帖子</h3>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-theme-text truncate">{post.title}</p>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span>{post.author}</span>
                    <span>{post.category}</span>
                    <span>{post.createdAt}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">{post.views} 阅读</p>
                  <p className="text-sm text-text-muted">{post.comments} 评论</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-theme-text mb-4">系统状态</h3>
            <div className="space-y-4">
              {[
                { name: '服务器', status: 'online', color: 'bg-green-500' },
                { name: '数据库', status: 'online', color: 'bg-green-500' },
                { name: 'API服务', status: 'online', color: 'bg-green-500' },
                { name: '安全服务', status: 'online', color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${item.color} rounded-full animate-pulse`}></span>
                    <span className="text-sm text-green-600">运行中</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-theme-text mb-4">最新用户</h3>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-text truncate">{user.name}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${user.status === 'online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {user.status === 'online' ? '在线' : '离线'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
