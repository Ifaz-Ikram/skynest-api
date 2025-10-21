import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPIComparisonCard = ({ 
  title, 
  icon: Icon, 
  currentValue, 
  previousValue, 
  format = 'number',
  color = 'blue'
}) => {
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return { percentage: 0, trend: 'neutral' };
    
    const change = ((currentValue - previousValue) / previousValue) * 100;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    
    return { percentage: Math.abs(change).toFixed(1), trend };
  };

  const formatValue = (value) => {
    if (!value && value !== 0) return '-';
    
    switch (format) {
      case 'currency':
        return `Rs ${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const { percentage, trend } = calculateChange();

  const colorClasses = {
    blue: 'bg-blue-800/30 text-blue-600',
    green: 'bg-green-800/30 text-green-600',
    purple: 'bg-purple-800/30 text-purple-600',
    orange: 'bg-orange-800/30 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-600 bg-green-900/20';
    if (trend === 'down') return 'text-red-600 bg-red-900/20';
    return 'text-slate-200 bg-slate-900';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="bg-surface-secondary rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getTrendColor(trend)}`}>
          {getTrendIcon(trend)}
          <span>{percentage}%</span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-slate-300 mb-2">{title}</h3>

      <div className="space-y-3">
        {/* Current Period */}
        <div>
          <p className="text-xs text-slate-400 mb-1">Current Period</p>
          <p className="text-2xl font-bold text-white">{formatValue(currentValue)}</p>
        </div>

        {/* Previous Period */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-slate-400 mb-1">Previous Period</p>
          <p className="text-lg font-semibold text-slate-300">{formatValue(previousValue)}</p>
        </div>
      </div>

      {/* Comparison Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Comparison</span>
          <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-200'}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{formatValue(Math.abs(currentValue - previousValue))}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              trend === 'up' ? 'bg-green-900/200' : trend === 'down' ? 'bg-red-900/200' : 'bg-slate-500'
            }`}
            style={{ width: `${Math.min(Math.abs(percentage), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default KPIComparisonCard;
