import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export interface TrendData {
  day: string;
  value: number;
}

export interface SevenDayTrendChartProps {
  title?: string;
  data: TrendData[];
  dataKey?: string;
  color?: string;
  showArea?: boolean;
}

export default function SevenDayTrendChart({
  title = '7天趋势',
  data,
  dataKey = 'value',
  color = '#3b82f6',
  showArea = true,
}: SevenDayTrendChartProps) {
  const [animatedData, setAnimatedData] = useState<TrendData[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // 初始化动画数据
    const initialData = data.map((item) => ({
      ...item,
      value: 0,
    }));
    setAnimatedData(initialData);

    // 逐点动画
    data.forEach((item, index) => {
      setTimeout(() => {
        setAnimatedData((prev) =>
          prev.map((prevItem, i) =>
            i === index ? { ...prevItem, value: item.value } : prevItem
          )
        );
      }, index * 150);
    });
  }, [data]);

  // 生成渐变ID
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: TrendData; value: number }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">{payload[0].payload.day}</p>
          <p className="text-lg font-semibold" style={{ color }}>
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <TrendingUp className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">最近7天数据趋势</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm text-gray-500">趋势</span>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {showArea ? (
            <AreaChart data={animatedData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickCount={5}
                padding={{ top: 10, bottom: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={{
                  fill: color,
                  stroke: '#fff',
                  strokeWidth: 2,
                  r: 6,
                }}
                activeDot={{
                  fill: color,
                  stroke: '#fff',
                  strokeWidth: 3,
                  r: 8,
                }}
              />
            </AreaChart>
          ) : (
            <LineChart data={animatedData}>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickCount={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={{
                  fill: color,
                  stroke: '#fff',
                  strokeWidth: 2,
                  r: 6,
                }}
                activeDot={{
                  fill: color,
                  stroke: '#fff',
                  strokeWidth: 3,
                  r: 8,
                }}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 数据摘要 */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">最高值</p>
          <p className="text-xl font-bold" style={{ color }}>
            {Math.max(...data.map((d) => d.value))}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">平均值</p>
          <p className="text-xl font-bold" style={{ color }}>
            {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">最低值</p>
          <p className="text-xl font-bold" style={{ color }}>
            {Math.min(...data.map((d) => d.value))}
          </p>
        </div>
      </div>
    </div>
  );
}
