import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Enhanced StatsGrid Component
 * Beautiful stat cards with colored icon backgrounds matching the screenshots
 */
const StatsGrid = ({ stats }) => {
  const getIconBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-900/200',
      green: 'bg-emerald-900/200',
      purple: 'bg-purple-900/200',
      orange: 'bg-orange-900/200',
      yellow: 'bg-yellow-900/200',
      red: 'bg-red-900/200',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      teal: 'bg-teal-500',
    };
    return colors[color] || 'bg-blue-900/200';
  };

  const getTrendColor = (trend) => {
    if (!trend) return 'text-slate-300';
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('+') || trendLower.includes('increase') || trendLower.includes('up')) {
      return 'text-green-600';
    }
    if (trendLower.includes('-') || trendLower.includes('decrease') || trendLower.includes('down')) {
      return 'text-red-600';
    }
    return 'text-slate-200';
  };

  const getTrendIcon = (trend) => {
    if (!trend) return null;
    const trendLower = trend.toLowerCase();
    if (trendLower.includes('+') || trendLower.includes('increase') || trendLower.includes('up')) {
      return <TrendingUp className="w-4 h-4" />;
    }
    if (trendLower.includes('-') || trendLower.includes('decrease') || trendLower.includes('down')) {
      return <TrendingDown className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-surface-secondary rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-border"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-300 mb-2">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-white mb-2">
                {stat.value}
              </p>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(stat.trend)}`}>
                  {getTrendIcon(stat.trend)}
                  <span className="font-medium">{stat.trend}</span>
                </div>
              )}
            </div>
            <div className={`${getIconBgColor(stat.color || 'blue')} p-3 rounded-xl flex-shrink-0 ml-4`}>
              {stat.icon && <stat.icon className="w-7 h-7 text-white" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
