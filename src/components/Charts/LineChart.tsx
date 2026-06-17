import { useEffect, useState, useMemo } from 'react';
import type { TrendDataPoint } from '@/types';

interface LineChartProps {
  data: TrendDataPoint[];
  title?: string;
  color?: string;
  showPoints?: boolean;
  showArea?: boolean;
}

export default function LineChart({ 
  data, 
  title, 
  color = '#3B82F6', 
  showPoints = true,
  showArea = true
}: LineChartProps) {
  const [animatedData, setAnimatedData] = useState<number[]>(data.map(() => 0));
  
  const maxValue = useMemo(() => {
    const values = data.map(d => d.value);
    return values.length > 0 ? Math.max(...values, 1) : 1;
  }, [data]);

  const minValue = useMemo(() => {
    const values = data.map(d => d.value);
    return values.length > 0 ? Math.min(...values, 0) : 0;
  }, [data]);

  const range = maxValue - minValue || 1;

  useEffect(() => {
    setAnimatedData(data.map(() => 0));
    
    data.forEach((item, index) => {
      setTimeout(() => {
        setAnimatedData(prev => {
          const newData = [...prev];
          newData[index] = item.value;
          return newData;
        });
      }, index * 120);
    });
  }, [data]);

  const points = useMemo(() => {
    if (data.length === 0) return '';
    return animatedData.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const normalizedValue = (value - minValue) / range;
      const y = 100 - normalizedValue * 80 - 10;
      return `${x},${y}`;
    }).join(' ');
  }, [animatedData, data.length, minValue, range]);

  const areaPoints = useMemo(() => {
    if (!showArea || data.length === 0) return '';
    const linePoints = animatedData.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const normalizedValue = (value - minValue) / range;
      const y = 100 - normalizedValue * 80 - 10;
      return `${x},${y}`;
    }).join(' ');
    return `5,90 ${linePoints} 95,90`;
  }, [animatedData, data.length, minValue, range, showArea]);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (i * 80) / 4;
      lines.push(
        <line
          key={i}
          x1="5"
          y1={y}
          x2="95"
          y2={y}
          stroke="#E5E7EB"
          strokeWidth="0.5"
          strokeDasharray="3,3"
        />
      );
    }
    return lines;
  }, []);

  const yLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (i * 80) / 4;
      const value = Math.round(maxValue - (i * maxValue) / 4);
      labels.push(
        <text
          key={i}
          x="3"
          y={y}
          fontSize="10"
          fill="#9CA3AF"
          textAnchor="end"
          dominantBaseline="middle"
        >
          {value}
        </text>
      );
    }
    return labels;
  }, [maxValue]);

  const xLabels = useMemo(() => {
    return data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      return (
        <text
          key={index}
          x={x}
          y="98"
          fontSize="10"
          fill="#9CA3AF"
          textAnchor="middle"
        >
          {item.label}
        </text>
      );
    });
  }, [data]);

  const dataPointLabels = useMemo(() => {
    if (!showPoints) return [];
    return animatedData.map((value, index) => {
      if (value === 0) return null;
      const x = (index / (data.length - 1)) * 100;
      const normalizedValue = (value - minValue) / range;
      const y = 100 - normalizedValue * 80 - 10;
      return (
        <text
          key={index}
          x={x}
          y={y - 8}
          fontSize="11"
          fontWeight="600"
          fill={color}
          textAnchor="middle"
          className="transition-all duration-500"
        >
          {value}
        </text>
      );
    });
  }, [animatedData, data.length, minValue, range, showPoints, color]);

  return (
    <div className="w-full h-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`lineChartGradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id={`lineChartShadow-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor={color} floodOpacity="0.15" />
          </filter>
        </defs>

        {gridLines}
        
        {yLabels}

        {showArea && areaPoints && (
          <polygon
            points={areaPoints}
            fill={`url(#lineChartGradient-${color.replace('#', '')})`}
            className="transition-all duration-700 ease-out"
          />
        )}

        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700 ease-out"
          filter={`url(#lineChartShadow-${color.replace('#', '')})`}
        />

        {showPoints && animatedData.map((value, index) => {
          const x = (index / (data.length - 1)) * 100;
          const normalizedValue = (value - minValue) / range;
          const y = 100 - normalizedValue * 80 - 10;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={value === 0 ? "1.5" : "4"}
              fill={value === 0 ? color : "white"}
              stroke={color}
              strokeWidth={value === 0 ? "1" : "2.5"}
              className="transition-all duration-500 ease-out"
            />
          );
        })}

        {dataPointLabels}
        
        {xLabels}
      </svg>
    </div>
  );
}
