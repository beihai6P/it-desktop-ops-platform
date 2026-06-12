import { useEffect, useState } from 'react';
import type { ChartData } from '@/types';

interface BarChartProps {
  data: ChartData[];
  title?: string;
  color?: string;
  showValues?: boolean;
  height?: number;
}

export default function BarChart({ 
  data, 
  title, 
  color = '#3B82F6', 
  showValues = true
}: BarChartProps) {
  const [animatedHeights, setAnimatedHeights] = useState<number[]>(data.map(() => 0));
  const maxValue = Math.max(...data.map(d => d.value));

  useEffect(() => {
    data.forEach((item, index) => {
      setTimeout(() => {
        setAnimatedHeights(prev => {
          const newHeights = [...prev];
          newHeights[index] = (item.value / maxValue) * 100;
          return newHeights;
        });
      }, index * 100);
    });
  }, [data, maxValue]);

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-theme-text mb-4">{title}</h4>
      )}
      <div className="flex items-end justify-between h-[200px] gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            {showValues && (
              <span className="text-xs font-semibold text-theme-text mb-1">
                {item.value}
              </span>
            )}
            <div 
              className="w-full bg-primary/10 rounded-t-lg transition-all duration-500 ease-out"
              style={{ height: `${animatedHeights[index]}%` }}
            >
              <div 
                className="w-full h-full rounded-t-lg transition-all duration-500"
                style={{ 
                  backgroundColor: color,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`
                }}
              />
            </div>
            <span className="text-xs text-text-muted mt-2 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}