// Simple sparkline component without external dependencies
import React from 'react';

export const Sparkline = ({ data, width = 100, height = 30, color = '#D4AF37' }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

export const TrendIndicator = ({ value, previousValue, showPercentage = true }) => {
  if (previousValue === 0 || !previousValue) return null;
  
  const change = ((value - previousValue) / previousValue) * 100;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.1;

  if (isNeutral) {
    return (
      <div className="flex items-center text-text-tertiary text-sm">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
        {showPercentage && <span>0%</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {showPercentage && <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>}
    </div>
  );
};

export const MiniGauge = ({ value, max = 100, color = '#D4AF37', size = 80 }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-lg font-bold text-text-primary">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};
