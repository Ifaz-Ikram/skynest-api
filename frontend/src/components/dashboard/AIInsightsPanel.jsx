import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, DollarSign, Calendar, Lightbulb } from 'lucide-react';

const AIInsightsPanel = ({ 
  occupancyTrend = null,
  revenueAnomalies = [],
  pricingRecommendations = [],
  seasonalInsights = [],
  periodLabel = 'Current Analysis'
}) => {
  const getInsightIcon = (type) => {
    switch (type) {
      case 'occupancy':
        return <TrendingUp className="w-5 h-5" />;
      case 'revenue':
        return <DollarSign className="w-5 h-5" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'seasonal':
        return <Calendar className="w-5 h-5" />;
      case 'pricing':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'occupancy':
        return 'bg-blue-900/20 text-blue-600 border-blue-700';
      case 'revenue':
        return 'bg-green-900/20 text-green-600 border-green-700';
      case 'alert':
        return 'bg-red-900/20 text-red-600 border-red-700';
      case 'seasonal':
        return 'bg-purple-900/20 text-purple-600 border-purple-700';
      case 'pricing':
        return 'bg-orange-900/20 text-orange-600 border-orange-700';
      default:
        return 'bg-surface-tertiary text-slate-300 border-border';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-800/30 text-red-200 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-800/30 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-800/30 text-green-200 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[priority] || colors.low;
  };

  const insights = [
    ...(occupancyTrend && Array.isArray(occupancyTrend) && occupancyTrend.length > 0 ? [{
      type: 'occupancy',
      title: 'Occupancy Prediction',
      message: `Forecasted occupancy: ${occupancyTrend.map(t => `${t.date}: ${t.forecast}%`).join(', ')}`,
      priority: 'medium'
    }] : []),
    ...revenueAnomalies.map(a => ({
      type: 'revenue',
      title: 'Revenue Anomaly Detected',
      message: `On ${a.date}: Expected Rs ${a.expected?.toLocaleString()}, Actual Rs ${a.actual?.toLocaleString()} (${a.variance}% variance)`,
      priority: 'high'
    })),
    ...pricingRecommendations.map(p => ({
      type: 'pricing',
      title: 'Dynamic Pricing Suggestion',
      message: `${p.roomType}: Current Rs ${p.currentRate}, Suggested Rs ${p.suggestedRate} - ${p.reason}`,
      priority: 'medium',
      action: 'Adjust pricing'
    })),
    ...seasonalInsights.map(s => ({
      type: 'seasonal',
      title: 'Seasonal Forecast',
      message: `${s.period}: ${s.prediction} (${s.confidence}% confidence)`,
      priority: 'low'
    }))
  ];

  return (
    <div className="bg-surface-secondary rounded-lg shadow-md p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-luxury-gold" />
          AI Insights & Recommendations
        </h3>
        <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-300 px-3 py-1 rounded-full font-medium">
          Powered by AI
        </span>
      </div>

      <p className="text-sm text-slate-300 mb-6">
        {periodLabel} • Smart insights generated from your data patterns
      </p>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.length > 0 ? insights.map((insight, idx) => (
          <div 
            key={idx}
            className={`border-l-4 rounded-lg p-4 ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{insight.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityBadge(insight.priority)}`}>
                    {insight.priority || 'medium'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  {insight.message}
                </p>
                {insight.action && (
                  <button className="text-xs font-medium text-luxury-gold hover:text-yellow-700 flex items-center gap-1 transition-colors">
                    <Lightbulb className="w-3 h-3" />
                    {insight.action} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">
              No insights available at the moment. AI analysis will appear here as data becomes available.
            </p>
          </div>
        )}
      </div>

      {/* AI Capabilities */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">How AI Helps You</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-slate-300">
              <strong>Occupancy Forecasting:</strong> Predicts booking trends using historical patterns
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-slate-300">
              <strong>Anomaly Detection:</strong> Identifies unusual revenue or booking patterns
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-slate-300">
              <strong>Dynamic Pricing:</strong> Recommends optimal rates based on demand
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-slate-300">
              <strong>Seasonal Analysis:</strong> Highlights trends and prepares you for peak periods
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-surface-tertiary rounded-lg">
        <p className="text-xs text-slate-400 text-center">
          ℹ️ AI insights are suggestions based on data patterns. Always review recommendations with your business context before implementing changes.
        </p>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
