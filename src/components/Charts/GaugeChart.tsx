import { useEffect, useState } from 'react';
import type { GaugeData } from '@/types';

interface GaugeChartProps {
  data: GaugeData;
  size?: number;
}

export default function GaugeChart({ data, size = 180 }: GaugeChartProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = data.value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= data.value) {
        setAnimatedValue(data.value);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data.value]);

  const percentage = ((animatedValue - data.min) / (data.max - data.min)) * 100;
  const angle = -135 + (percentage * 270) / 100;
  const radians = (angle * Math.PI) / 180;
  
  const centerX = 50;
  const centerY = 65;
  const radius = 35;
  
  const needleX = centerX + radius * Math.cos(radians);
  const needleY = centerY + radius * Math.sin(radians);

  const getStatusColor = () => {
    switch (data.status) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <path
            d="M 15 65 A 35 35 0 0 1 85 65"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 15 65 A 35 35 0 0 1 85 65"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(percentage * 2 * Math.PI * 35 * 0.75) / 100} 1000`}
            className="transition-all duration-1000"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={getStatusColor()}
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <circle cx={centerX} cy={centerY} r="6" fill="white" stroke={getStatusColor()} strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
          <span className="text-2xl font-bold text-theme-text">
            {animatedValue.toFixed(data.unit === '%' ? 1 : 0)}
          </span>
          <span className="text-sm text-text-muted">{data.unit}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-text-muted mt-2">{data.label}</p>
    </div>
  );
}