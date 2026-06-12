import { useEffect, useState } from 'react';
import type { PieChartData } from '@/types';

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  size?: number;
  showLabels?: boolean;
}

export default function PieChart({ 
  data, 
  title, 
  size = 200,
  showLabels = true 
}: PieChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  let currentAngle = 0;
  const paths = data.map((item, index) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle - 90;
    const endAngle = startAngle + angle;
    currentAngle += angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return { ...item, d, index };
  });

  return (
    <div className="w-full flex flex-col items-center">
      {title && (
        <h4 className="text-sm font-medium text-theme-text mb-4">{title}</h4>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          className="w-full h-full" 
          viewBox="0 0 100 100"
          style={{ transform: animated ? 'scale(1)' : 'scale(0)', transition: 'transform 0.5s ease-out' }}
        >
          {paths.map((item) => (
            <path
              key={item.index}
              d={item.d}
              fill={item.color}
              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
              style={{ 
                transitionDelay: `${item.index * 100}ms`,
                opacity: animated ? 1 : 0
              }}
            />
          ))}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-xl font-bold text-theme-text">
              {data.reduce((sum, item) => sum + item.value, 0)}%
            </span>
            <p className="text-xs text-text-muted">总计</p>
          </div>
        </div>
      </div>
      {showLabels && (
        <div className="mt-4 w-full space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-text-muted">{item.label}</span>
              </div>
              <span className="font-medium text-theme-text">{item.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}