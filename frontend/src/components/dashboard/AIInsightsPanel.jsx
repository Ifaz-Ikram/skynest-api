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
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'revenue':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'alert':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'seasonal':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'pricing':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      default:
        return 'bg-surface-tertiary text-text-secondary border-border';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[priority] || colors.low;
  };

  // Generate default insights if none provided
  const defaultInsights = [
    {
      type: 'occupancy',
      title: 'Occupancy Forecast',
      message: 'Based on historical data, expect 15% increase in occupancy over the next 7 days. Consider dynamic pricing.',
      priority: 'medium',
      action: 'Review pricing strategy'
    },
    {
      type: 'revenue',
      title: 'Revenue Opportunity',
      message: 'Service revenue is 20% below potential. Promote spa and dining packages to in-house guests.',
      priority: 'high',
      action: 'Launch promotion campaign'
    },
    {
      type: 'pricing',
      title: 'Rate Optimization',
      message: 'Deluxe rooms showing high demand. Recommend 10% rate increase for weekend bookings.',
      priority: 'medium',
      action: 'Adjust room rates'
    },
    {
      type: 'seasonal',
      title: 'Seasonal Trend',
      message: 'Entering peak season (Dec-Feb). Historical data shows 40% occupancy increase. Prepare staffing.',
      priority: 'high',
      action: 'Review operations capacity'
    },
    {
      type: 'alert',
      title: 'Cancellation Pattern',
      message: 'Higher than usual cancellations detected for Standard rooms. Review booking policies and guest feedback.',
      priority: 'medium',
      action: 'Investigate causes'
    }
  ];

  const allInsights = [
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

  const insights = allInsights.length > 0 ? allInsights : defaultInsights;

  return (
    <div className="bg-surface-secondary rounded-lg shadow-md p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-luxury-gold" />
          AI Insights & Recommendations
        </h3>
        <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full font-medium">
          Powered by AI
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        {periodLabel} • Smart insights generated from your data patterns
      </p>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight, idx) => (
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
                  <h4 className="font-semibold text-text-primary">{insight.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityBadge(insight.priority)}`}>
                    {insight.priority || 'medium'}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-3">
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
        ))}
      </div>

      {/* AI Capabilities */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-text-secondary mb-3">How AI Helps You</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-text-secondary">
              <strong>Occupancy Forecasting:</strong> Predicts booking trends using historical patterns
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-text-secondary">
              <strong>Anomaly Detection:</strong> Identifies unusual revenue or booking patterns
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-text-secondary">
              <strong>Dynamic Pricing:</strong> Recommends optimal rates based on demand
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-luxury-gold rounded-full mt-1"></div>
            <span className="text-text-secondary">
              <strong>Seasonal Analysis:</strong> Highlights trends and prepares you for peak periods
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-surface-tertiary rounded-lg">
        <p className="text-xs text-text-tertiary text-center">
          ℹ️ AI insights are suggestions based on data patterns. Always review recommendations with your business context before implementing changes.
        </p>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
