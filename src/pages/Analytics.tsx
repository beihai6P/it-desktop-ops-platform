import { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { caseAPI, ticketAPI } from '@/services/api';
import type { Case, Ticket } from '@/types';

export default function Analytics() {
  const [cases, setCases] = useState<Case[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activePeriod, setActivePeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activePeriod]);

  const loadData = async () => {
    try {
      const [casesResponse, ticketsResponse] = await Promise.all([
        caseAPI.getAll(),
        ticketAPI.getAll(),
      ]);
      setCases(casesResponse.data.cases);
      setTickets(ticketsResponse.data.tickets);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const diagnosticStats = [
    { label: '总诊断数', value: cases.length, change: '+12.5%', trend: 'up' },
    { label: '平均耗时', value: '15分钟', change: '-8.3%', trend: 'down' },
    { label: '解决率', value: '94%', change: '+2.1%', trend: 'up' },
    { label: '满意度', value: '98%', change: '+1.5%', trend: 'up' },
  ];

  const monthlyData = [
    { month: '1月', count: 120 },
    { month: '2月', count: 145 },
    { month: '3月', count: 132 },
    { month: '4月', count: 168 },
    { month: '5月', count: 185 },
    { month: '6月', count: 210 },
    { month: '7月', count: 195 },
    { month: '8月', count: 220 },
    { month: '9月', count: 235 },
    { month: '10月', count: 215 },
    { month: '11月', count: 240 },
    { month: '12月', count: 265 },
  ];

  const categoryData = [
    { name: '网络问题', value: 35, color: '#3B82F6' },
    { name: '服务器故障', value: 25, color: '#EF4444' },
    { name: '软件问题', value: 20, color: '#10B981' },
    { name: '硬件故障', value: 15, color: '#F59E0B' },
    { name: '其他', value: 5, color: '#8B5CF6' },
  ];

  const statusDistribution = [
    { status: '待处理', count: 15, color: '#3B82F6' },
    { status: '处理中', count: 28, color: '#F59E0B' },
    { status: '已解决', count: 185, color: '#10B981' },
    { status: '已关闭', count: 456, color: '#9CA3AF' },
  ];

  const maxValue = Math.max(...monthlyData.map(d => d.count));

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-theme-text">数据分析</h2>
            <p className="text-sm text-text-muted mt-1">查看系统运行数据和趋势分析</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/80 border border-primary/20 rounded-xl p-1">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activePeriod === period
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-theme-text'
                  }`}
                >
                  {period === 'week' ? '本周' : period === 'month' ? '本月' : '本年'}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setLoading(true);
                loadData();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-primary/20 rounded-xl hover:bg-white transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {diagnosticStats.map((stat) => (
            <div key={stat.label} className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-muted">{stat.label}</span>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-theme-text">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-theme-text">诊断趋势</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex items-end justify-between h-64 gap-4">
                {monthlyData.map((data) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gradient-to-t from-primary/60 to-primary/20 rounded-t-lg transition-all hover:from-primary/80 hover:to-primary/30"
                      style={{ height: `${(data.count / maxValue) * 100}%` }}>
                    </div>
                    <span className="text-xs text-text-muted">{data.month}</span>
                    <span className="text-sm font-medium text-theme-text">{data.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-theme-text">问题分类</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryData.map((category) => (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-muted">{category.name}</span>
                      <span className="text-sm font-medium text-theme-text">{category.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${category.value}%`, backgroundColor: category.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-theme-text">工单状态分布</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="16"
                    />
                    {statusDistribution.map((item, index) => {
                      const startAngle = statusDistribution.slice(0, index).reduce((sum, s) => sum + (s.count / (tickets.length || 1)) * 360, 0);
                      const endAngle = startAngle + (item.count / (tickets.length || 1)) * 360;
                      return (
                        <circle
                          key={item.status}
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="16"
                          strokeDasharray={`${(endAngle - startAngle) * 1.4} 1000`}
                          strokeDashoffset={-startAngle * 1.4}
                          className="transition-all duration-500"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-theme-text">{tickets.length}</span>
                    <span className="text-xs text-text-muted">总工单</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {statusDistribution.map((item) => (
                    <div key={item.status} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-text-muted flex-1">{item.status}</span>
                      <span className="text-sm font-medium text-theme-text">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/85 backdrop-blur-sm border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-theme-text">月度对比</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: '新增诊断', current: 156, previous: 132, change: '+18.2%' },
                  { label: '已解决', current: 142, previous: 125, change: '+13.6%' },
                  { label: '平均响应时间', current: '12分钟', previous: '15分钟', change: '-20%' },
                  { label: '用户满意度', current: '96%', previous: '94%', change: '+2.1%' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                    <div>
                      <span className="text-sm text-text-muted">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-theme-text">{item.current}</span>
                      <span className={`text-sm ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change}
                      </span>
                    </div>
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