import React from 'react';
import { Users, UserCheck, Clock, Globe, Award, TrendingUp } from 'lucide-react';
import { DonutChart } from '../common';

const GuestAnalyticsDashboard = ({ 
  newGuests = 0,
  returningGuests = 0,
  avgStayDuration = 0,
  nationalityBreakdown = [],
  vipGuests = 0,
  corporateGuests = 0,
  periodLabel = 'This Month'
}) => {
  const totalGuests = newGuests + returningGuests;
  const newGuestsPercentage = totalGuests > 0 ? ((newGuests / totalGuests) * 100).toFixed(1) : 0;
  const returningPercentage = totalGuests > 0 ? ((returningGuests / totalGuests) * 100).toFixed(1) : 0;

  const guestTypeData = [
    { label: 'New', value: newGuests, color: '#3b82f6' },
    { label: 'Returning', value: returningGuests, color: '#10b981' }
  ];

  const topNationalities = nationalityBreakdown.slice(0, 5);

  return (
    <div className="bg-surface-secondary rounded-lg shadow-md p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-luxury-gold" />
          Guest Analytics
        </h3>
        <span className="text-sm text-slate-400">{periodLabel}</span>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-900/20 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalGuests}</p>
          <p className="text-xs text-slate-300 mt-1">Total Guests</p>
        </div>

        <div className="bg-green-900/20 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{returningGuests}</p>
          <p className="text-xs text-slate-300 mt-1">Returning</p>
        </div>

        <div className="bg-purple-900/20 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-purple-800/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{vipGuests}</p>
          <p className="text-xs text-slate-300 mt-1">VIP Guests</p>
        </div>

        <div className="bg-orange-900/20 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-orange-800/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{avgStayDuration.toFixed(1)}</p>
          <p className="text-xs text-slate-300 mt-1">Avg. Stay (nights)</p>
        </div>
      </div>

      {/* Guest Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Donut Chart */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Guest Type Distribution</h4>
          {guestTypeData.some(d => d.value > 0) ? (
            <DonutChart 
              data={guestTypeData}
              size={220}
              innerRadius={60}
              outerRadius={85}
              showLegend={true}
            />
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No guest data available</p>
          )}
        </div>

        {/* Loyalty Metrics */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Loyalty Metrics</h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">New Guests</span>
                <span className="text-sm font-semibold text-blue-600">{newGuestsPercentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-blue-900/200 h-3 rounded-full transition-all"
                  style={{ width: `${newGuestsPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Returning Guests</span>
                <span className="text-sm font-semibold text-green-600">{returningPercentage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-green-900/200 h-3 rounded-full transition-all"
                  style={{ width: `${returningPercentage}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Corporate Guests</span>
                <span className="text-lg font-bold text-indigo-600">{corporateGuests}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Business travelers and corporate bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nationality Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          Top Nationalities
        </h4>
        {topNationalities.length > 0 ? (
          <div className="space-y-3">
            {topNationalities.map((nat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{nat.flag || '🌍'}</span>
                  <div>
                    <p className="font-medium text-white">{nat.country}</p>
                    <p className="text-xs text-slate-400">{nat.count} guest{nat.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-luxury-gold">
                    {((nat.count / totalGuests) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-4">No nationality data available</p>
        )}
      </div>

      {/* Insights */}
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          Guest Insights
        </h4>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-luxury-gold mt-0.5">•</span>
            <span>
              {returningPercentage > 30 
                ? `Strong loyalty with ${returningPercentage}% returning guests - excellent retention`
                : `${returningPercentage}% returning guests - opportunity to improve loyalty programs`}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-luxury-gold mt-0.5">•</span>
            <span>
              Average stay duration of {avgStayDuration.toFixed(1)} nights 
              {avgStayDuration > 3 ? ' indicates strong guest satisfaction' : ' suggests potential for extended stay promotions'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-luxury-gold mt-0.5">•</span>
            <span>
              {vipGuests > 0 
                ? `${vipGuests} VIP guests demonstrate premium service appeal`
                : 'Consider VIP guest programs to attract high-value customers'}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GuestAnalyticsDashboard;
