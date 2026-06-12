import { useEffect, useState, useMemo } from 'react';
import type { TrendDataPoint } from '@/types';

interface LineChartProps {
  data: TrendDataPoint[];
  title?: string;
  color?: string;
  showPoints?: boolean;
  showArea?: boolean;
  height?: number;
}

export default function LineChart({ 
  data, 
  title, 
  color = '#3B82F6', 
  showPoints = true,
  showArea = true
}: LineChartProps) {
  const [animatedData, setAnimatedData] = useState<number[]>(data.map(() => 0));
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  useEffect(() => {
    data.forEach((item, index) => {
      setTimeout(() => {
        setAnimatedData(prev => {
          const newData = [...prev];
          newData[index] = item.value;
          return newData;
        });
      }, index * 100);
    });
  }, [data]);

  const points = useMemo(() => {
    return animatedData.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - minValue) / range) * 90 - 5;
      return `${x},${y}`;
    }).join(' ');
  }, [animatedData, data.length, minValue, range]);

  const areaPoints = useMemo(() => {
    if (!showArea) return '';
    const linePoints = animatedData.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - minValue) / range) * 90 - 5;
      return `${x},${y}`;
    }).join(' ');
    return `0,100 ${linePoints} 100,100`;
  }, [animatedData, data.length, minValue, range, showArea]);

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-theme-text mb-4">{title}</h4>
      )}
      <div className="relative h-[200px] w-full">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {showArea && areaPoints && (
            <polygon
              points={areaPoints}
              fill={`url(#gradient-${color.replace('#', '')})`}
              className="transition-all duration-500"
            />
          )}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
            style={{
              strokeDasharray: animatedData.every(v => v > 0) ? 'none' : '1000',
              strokeDashoffset: animatedData.every(v => v > 0) ? '0' : '1000'
            }}
          />
          {showPoints && animatedData.map((value, index) => {
            if (value === 0) return null;
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((value - minValue) / range) * 90 - 5;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="white"
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-text-muted">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}