import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ManagerForecasting = () => {
  const [paceData, setPaceData] = useState(null);
  const [pickupData, setPickupData] = useState(null);
  const [segmentationData, setSegmentationData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await api.getForecastingDashboard(dateRange);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPaceAnalysis = async () => {
    try {
      setLoading(true);
      const paceData = await api.getBookingPace(dateRange);
      setPaceData(paceData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPickupAnalysis = async () => {
    try {
      setLoading(true);
      const pickupData = await api.getPickupReport(dateRange);
      setPickupData(pickupData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSegmentationAnalysis = async () => {
    try {
      setLoading(true);
      const segmentationData = await api.getSegmentationAnalysis(dateRange);
      setSegmentationData(segmentationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    // Budget feature not implemented - table doesn't exist in schema
    console.log('Budget feature not implemented');
  };

  const loadBudgetVsActual = async (budgetId) => {
    // Budget feature not implemented - table doesn't exist in schema
    console.log('Budget feature not implemented');
  };

  const handleDateRangeChange = (field, value) => {
    console.log(`${field} changed to:`, value);
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    switch (tabId) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'pace':
        loadPaceAnalysis();
        break;
      case 'pickup':
        loadPickupAnalysis();
        break;
      case 'segmentation':
        loadSegmentationAnalysis();
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-200">Error</h3>
            <div className="mt-2 text-sm text-red-300">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-secondary shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Manager Forecasting</h1>
            <p className="text-slate-300 mt-2">Analyze booking trends, pace, pickup, and budget performance</p>
          </div>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Date
                <span className="block text-xs font-normal text-slate-400 mt-0.5">
                  {dateRange.end_date ? 'Forecasts from this date...' : 'Forecasts from this date onwards'}
                </span>
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                className="mt-1 block w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                End Date
                <span className="block text-xs font-normal text-slate-400 mt-0.5">
                  {dateRange.start_date ? '...to this date' : 'Forecasts up to this date'}
                </span>
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                className="mt-1 block w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
              />
            </div>
          </div>
          {/* Clear Date Filters Button */}
          {(dateRange.start_date || dateRange.end_date) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDateRange({start_date: '', end_date: ''})}
                className="px-4 py-2 bg-red-900/20 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Clear Date Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Dashboard' },
            { id: 'pace', name: 'Pace Analysis' },
            { id: 'pickup', name: 'Pickup Analysis' },
            { id: 'segmentation', name: 'Segmentation' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-300 hover:text-slate-100 hover:border-border dark:border-slate-600'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <ForecastingDashboard dashboard={dashboard} />
      )}

      {/* Pace Analysis Tab */}
      {activeTab === 'pace' && paceData && (
        <PaceAnalysis paceData={paceData} />
      )}

      {/* Pickup Analysis Tab */}
      {activeTab === 'pickup' && pickupData && (
        <PickupAnalysis pickupData={pickupData} />
      )}

      {/* Segmentation Analysis Tab */}
      {activeTab === 'segmentation' && segmentationData && (
        <SegmentationAnalysis segmentationData={segmentationData} />
      )}

      {/* Budget Tracking Tab - Feature Not Implemented */}
      {activeTab === 'budgets' && (
        <div className="bg-yellow-900/20 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Budget Tracking Feature Not Implemented
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The budget tracking feature requires a budget table that is not yet implemented in the database schema.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Forecasting Dashboard Component
const ForecastingDashboard = ({ dashboard }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-900/200 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Total Bookings</p>
              <p className="text-2xl font-semibold text-white">
                {dashboard.trends.reduce((sum, trend) => sum + trend.bookings, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-900/200 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Total Revenue</p>
              <p className="text-2xl font-semibold text-white">
                Rs {dashboard.trends.reduce((sum, trend) => sum + trend.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-900/200 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Average Rate</p>
              <p className="text-2xl font-semibold text-white">
                ${dashboard.trends.length > 0 ? (dashboard.trends.reduce((sum, trend) => sum + trend.avg_rate, 0) / dashboard.trends.length).toFixed(2) : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-900/200 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Room Types</p>
              <p className="text-2xl font-semibold text-white">
                {dashboard.room_type_performance.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Type Performance */}
      <div className="bg-surface-secondary shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Room Type Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-surface-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Room Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Rate</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {dashboard.room_type_performance.map((roomType) => (
                <tr key={roomType.room_type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {roomType.room_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {roomType.bookings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    Rs {roomType.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    Rs {roomType.avg_rate.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Pace Analysis Component
const PaceAnalysis = ({ paceData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Booking Pace Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-900/20 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-200">Total Bookings</h4>
            <p className="text-2xl font-semibold text-white">{paceData.summary.total_bookings}</p>
          </div>
          <div className="bg-green-900/20 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-200">Total Revenue</h4>
            <p className="text-2xl font-semibold text-white">Rs {paceData.summary.total_revenue.toLocaleString()}</p>
          </div>
          <div className="bg-purple-900/20 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-200">Avg Daily Bookings</h4>
            <p className="text-2xl font-semibold text-white">{paceData.summary.avg_daily_bookings}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pickup Analysis Component
const PickupAnalysis = ({ pickupData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Pickup Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(pickupData.pickup_ranges).map(([range, data]) => (
            <div key={range} className="bg-surface-tertiary p-4 rounded-lg">
              <h4 className="text-sm font-medium text-white">{range} days</h4>
              <p className="text-xl font-semibold text-white">{data.bookings}</p>
              <p className="text-sm text-slate-300">Rs {data.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Segmentation Analysis Component
const SegmentationAnalysis = ({ segmentationData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Segmentation Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-surface-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Segment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Avg LOS</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {segmentationData.segments.map((segment) => (
                <tr key={segment.segment}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {segment.segment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {segment.bookings_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    Rs {segment.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    Rs {segment.avg_rate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {segment.avg_length_of_stay.toFixed(1)} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerForecasting;