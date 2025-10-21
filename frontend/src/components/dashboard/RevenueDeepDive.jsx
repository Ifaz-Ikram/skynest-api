import React from 'react';
import { DollarSign, TrendingUp, Bed, Coffee, PieChart } from 'lucide-react';
import { LineChart } from '../common';

const RevenueDeepDive = ({ 
  roomRevenue = 0,
  serviceRevenue = 0,
  adrData = [],
  revparData = [],
  periodLabel = 'This Month'
}) => {
  const totalRevenue = roomRevenue + serviceRevenue;
  const roomPercentage = totalRevenue > 0 ? ((roomRevenue / totalRevenue) * 100).toFixed(1) : 0;
  const servicePercentage = totalRevenue > 0 ? ((serviceRevenue / totalRevenue) * 100).toFixed(1) : 0;

  const avgADR = adrData.length > 0 
    ? (adrData.reduce((sum, item) => sum + item.value, 0) / adrData.length).toFixed(0)
    : 0;

  const avgRevPAR = revparData.length > 0
    ? (revparData.reduce((sum, item) => sum + item.value, 0) / revparData.length).toFixed(0)
    : 0;

  return (
    <div className="bg-surface-secondary rounded-lg shadow-md p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <PieChart className="w-5 h-5 text-luxury-gold" />
          Revenue Deep Dive
        </h3>
        <span className="text-sm text-text-tertiary">{periodLabel}</span>
      </div>

      {/* Revenue Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Room Revenue */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bed className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Room Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                Rs {roomRevenue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span>Share of Total</span>
              <span className="font-semibold">{roomPercentage}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${roomPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Service Revenue */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Coffee className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Service Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                Rs {serviceRevenue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span>Share of Total</span>
              <span className="font-semibold">{servicePercentage}%</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${servicePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <p className="text-sm text-text-secondary mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700">
            Rs {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
          <p className="text-sm text-text-secondary mb-1">Avg. ADR</p>
          <p className="text-2xl font-bold text-orange-700">
            Rs {avgADR}
          </p>
          <p className="text-xs text-text-tertiary mt-1">Average Daily Rate</p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
          <p className="text-sm text-text-secondary mb-1">Avg. RevPAR</p>
          <p className="text-2xl font-bold text-indigo-700">
            Rs {avgRevPAR}
          </p>
          <p className="text-xs text-text-tertiary mt-1">Revenue Per Available Room</p>
        </div>
      </div>

      {/* ADR Trend */}
      {adrData.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-text-secondary mb-3">ADR Trend (Last 7 Days)</h4>
          <LineChart 
            data={adrData}
            dataKey="value"
            xKey="date"
            color="#f59e0b"
            height={180}
            showGrid={true}
          />
        </div>
      )}

      {/* RevPAR Trend */}
      {revparData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-3">RevPAR Trend (Last 7 Days)</h4>
          <LineChart 
            data={revparData}
            dataKey="value"
            xKey="date"
            color="#6366f1"
            height={180}
            showGrid={true}
          />
        </div>
      )}

      {/* Insights */}
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-text-secondary mb-2">Key Insights</h4>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-luxury-gold mt-0.5">•</span>
            <span>
              Room revenue accounts for {roomPercentage}% of total revenue, 
              {parseFloat(roomPercentage) > 70 ? ' showing strong occupancy' : ' with opportunity to increase service revenue'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-luxury-gold mt-0.5">•</span>
            <span>
              Average Daily Rate (ADR) is Rs {avgADR}, 
              {parseFloat(avgADR) > 5000 ? ' indicating premium positioning' : ' with potential for rate optimization'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-luxury-gold mt-0.5">•</span>
            <span>
              RevPAR of Rs {avgRevPAR} reflects overall property performance combining occupancy and rate
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RevenueDeepDive;
