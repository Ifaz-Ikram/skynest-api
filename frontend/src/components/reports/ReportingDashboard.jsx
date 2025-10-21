// frontend/src/components/reports/ReportingDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Bed,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  PieChart,
  Activity,
  Clock,
  Star,
  Target,
  AlertCircle,
  CheckCircle,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import api from '../../utils/api';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import BranchSelector from './BranchSelector';
import SearchableDropdown from '../common/SearchableDropdown';

const ReportingDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchSelector, setShowBranchSelector] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '2025-10-01', // Set to October 2025 where your data exists
    end: '2025-10-31'    // Set to October 2025 where your data exists
  });
  const [reportType, setReportType] = useState('overview');
  const [reportData, setReportData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    roomType: 'all'
  });
  const [chartData, setChartData] = useState({
    revenue: [],
    occupancy: []
  });
  const [revenueTimeFilter, setRevenueTimeFilter] = useState('daily');

  const reportTypeOptions = useMemo(
    () => [
      { id: 'overview', name: 'Overview' },
      { id: 'revenue', name: 'Revenue' },
      { id: 'occupancy', name: 'Occupancy' },
      { id: 'guests', name: 'Guests' },
    ],
    [],
  );

  const roomTypeOptions = useMemo(
    () => [
      { id: 'all', name: 'All Room Types' },
      { id: 'standard', name: 'Standard Room' },
      { id: 'deluxe', name: 'Deluxe Room' },
      { id: 'family', name: 'Family Room' },
    ],
    [],
  );

  useEffect(() => {
    if (selectedBranch) {
      loadReportData();
    }
  }, [dateRange, reportType, filters, selectedBranch]);

  useEffect(() => {
    if (reportData) {
      loadChartData();
    }
  }, [reportData, revenueTimeFilter]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setShowBranchSelector(false);
    setReportData(null); // Clear previous data
  };

  const handleBackToBranchSelection = () => {
    setShowBranchSelector(true);
    setSelectedBranch(null);
    setReportData(null);
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate date range
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date');
      }
      
      // Allow future dates for hotel reporting (bookings can be in the future)
      // But warn if the date is more than 2 years in the future
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      
      if (endDate > twoYearsFromNow) {
        throw new Error('End date cannot be more than 2 years in the future');
      }
      
      const data = await api.getReportData({
        start_date: dateRange.start,
        end_date: dateRange.end,
        report_type: reportType,
        branch_id: selectedBranch?.id || 'all',
        ...filters
      });
      
      // Validate API response
      if (!data) {
        throw new Error('No data received from server');
      }
      
      // Calculate real trends with error handling
      let trends = { revenue_trend: 0, adr_trend: 0, revpar_trend: 0, occupancy_trend: 0 };
      try {
        trends = await calculateTrends();
      } catch (trendError) {
        console.warn('Trend calculation failed, using default values:', trendError.message);
      }
      
      // Update data with real trends
      const dataWithTrends = {
        ...data,
        kpis: {
          ...data.kpis,
          ...trends
        }
      };
      
      setReportData(dataWithTrends);
      
    } catch (err) {
      console.error('Error loading report data:', err);
      setError(err.message || 'Failed to load report data');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      // Validate data before processing
      if (!reportData) {
        setChartData({ revenue: [], occupancy: [] });
        return;
      }
      
      // Use real data from the API response
      if (reportData?.channel_performance?.length > 0) {
        // Create revenue trend from actual bookings based on selected time filter
        const revenueData = [];
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        const totalRevenue = reportData.channel_performance.reduce((sum, channel) => sum + channel.revenue, 0);
        const totalBookings = reportData.channel_performance.reduce((sum, channel) => sum + channel.bookings, 0);
        
        if (revenueTimeFilter === 'daily') {
          // Daily view - show actual booking distribution
          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          
          // Initialize all days with zero revenue
          for (let i = 0; i <= daysDiff; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            revenueData.push({
              date: format(date, 'MMM dd'),
              revenue: 0,
              bookings: 0
            });
          }
          
          // Distribute actual bookings across the period more naturally
          if (reportData?.channel_performance?.length > 0) {
            const totalBookings = reportData.channel_performance.reduce((sum, channel) => sum + channel.bookings, 0);
            const totalRevenue = reportData.channel_performance.reduce((sum, channel) => sum + channel.revenue, 0);
            
            // Distribute bookings more naturally across the period
            const bookingsPerDay = Math.max(1, Math.floor(totalBookings / Math.max(daysDiff, 1)));
            const revenuePerBooking = totalRevenue / totalBookings;
            
            // Place bookings more realistically across the period
            let remainingBookings = totalBookings;
            let remainingRevenue = totalRevenue;
            
            // Use real booking data from API - group by actual check-in dates
            // This data should come from the backend, not randomly distributed
            // For now, show empty if no time-series data available
            console.warn('Revenue chart needs real time-series data from backend API');
          }
        } else if (revenueTimeFilter === 'weekly') {
          // Weekly view - distribute bookings naturally across weeks
          const weeksDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
          
          // Initialize all weeks with zero
          for (let i = 0; i <= weeksDiff; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            revenueData.push({
              date: `${format(weekStart, 'MMM dd')}-${format(weekEnd, 'MMM dd')}`,
              revenue: 0,
              bookings: 0
            });
          }
          
          // Distribute actual bookings across weeks
          if (reportData?.channel_performance?.length > 0) {
            const totalBookings = reportData.channel_performance.reduce((sum, channel) => sum + channel.bookings, 0);
            const totalRevenue = reportData.channel_performance.reduce((sum, channel) => sum + channel.revenue, 0);
            const revenuePerBooking = totalRevenue / totalBookings;
            
            let remainingBookings = totalBookings;
            let remainingRevenue = totalRevenue;
            
            // Use real booking data from API - group by actual check-in weeks
            console.warn('Weekly revenue chart needs real time-series data from backend API');
          }
        } else if (revenueTimeFilter === 'monthly') {
          // Monthly view - distribute bookings naturally across months
          const monthsDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
          
          // Initialize all months with zero
          for (let i = 0; i <= monthsDiff; i++) {
            const monthStart = new Date(startDate);
            monthStart.setMonth(monthStart.getMonth() + i);
            
            revenueData.push({
              date: format(monthStart, 'MMM yyyy'),
              revenue: 0,
              bookings: 0
            });
          }
          
          // Distribute actual bookings across months
          if (reportData?.channel_performance?.length > 0) {
            const totalBookings = reportData.channel_performance.reduce((sum, channel) => sum + channel.bookings, 0);
            const totalRevenue = reportData.channel_performance.reduce((sum, channel) => sum + channel.revenue, 0);
            const revenuePerBooking = totalRevenue / totalBookings;
            
            let remainingBookings = totalBookings;
            let remainingRevenue = totalRevenue;
            
            // Use real booking data from API - group by actual check-in months
            console.warn('Monthly revenue chart needs real time-series data from backend API');
          }
        }
        
        setChartData(prev => ({ ...prev, revenue: revenueData }));
      } else {
        // Show empty state instead of fake data
        setChartData(prev => ({ ...prev, revenue: [] }));
      }
      
      // Use real room type data for occupancy chart
      if (reportData?.room_type_performance?.length > 0) {
        const occupancyData = reportData.room_type_performance
          .filter(roomType => roomType.room_type_name && roomType.occupancy > 0) // Filter out invalid data
          .map((roomType, index) => ({
            name: roomType.room_type_name,
            value: Math.max(0, roomType.occupancy || 0), // Ensure non-negative
            color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#ff9f40', '#ff6b6b'][index % 6]
          }));
        setChartData(prev => ({ ...prev, occupancy: occupancyData }));
      } else {
        // Show empty state instead of fake data
        setChartData(prev => ({ ...prev, occupancy: [] }));
      }
    } catch (err) {
      console.error('Error loading chart data:', err);
    }
  };

  // Calculate real trends by comparing current period with previous period
  const calculateTrends = async () => {
    if (!reportData?.kpis) return { revenue_trend: 0, adr_trend: 0, revpar_trend: 0, occupancy_trend: 0 };
    
    try {
      // Calculate previous period dates
      const currentStart = new Date(dateRange.start);
      const currentEnd = new Date(dateRange.end);
      const periodLength = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));
      
      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - periodLength);
      
      // Get previous period data
      const previousData = await api.getReportData({
        start_date: previousStart.toISOString().split('T')[0],
        end_date: previousEnd.toISOString().split('T')[0],
        report_type: reportType,
        ...filters
      });
      
      const current = reportData.kpis;
      const previous = previousData.kpis;
      
      // Calculate percentage changes with better edge case handling
      const calculateTrend = (currentValue, previousValue) => {
        if (!currentValue || !previousValue || previousValue === 0) {
          return currentValue > 0 ? 100 : 0; // If current has data but previous doesn't, show 100% growth
        }
        const trend = ((currentValue - previousValue) / previousValue) * 100;
        return Math.max(-999, Math.min(999, trend)); // Cap at -999% to +999%
      };
      
      const revenue_trend = calculateTrend(current.total_revenue, previous.total_revenue);
      const adr_trend = calculateTrend(current.adr, previous.adr);
      const revpar_trend = calculateTrend(current.revpar, previous.revpar);
      const occupancy_trend = calculateTrend(current.occupancy, previous.occupancy);
      
      return {
        revenue_trend: Math.round(revenue_trend * 10) / 10,
        adr_trend: Math.round(adr_trend * 10) / 10,
        revpar_trend: Math.round(revpar_trend * 10) / 10,
        occupancy_trend: Math.round(occupancy_trend * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating trends:', error);
      return { revenue_trend: 0, adr_trend: 0, revpar_trend: 0, occupancy_trend: 0 };
    }
  };

  const exportReport = async (format) => {
    try {
      await api.exportReport({
        start_date: dateRange.start,
        end_date: dateRange.end,
        report_type: reportType,
        format,
        ...filters
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-text-secondary" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Revenue KPI */}
      <div className="card hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-text-tertiary mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-text-primary mb-2">
              Rs {(reportData?.kpis?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center">
              {getTrendIcon(reportData?.kpis?.revenue_trend || 0)}
              <span className={`ml-1 text-sm font-medium ${getTrendColor(reportData?.kpis?.revenue_trend || 0)}`}>
                {Math.abs(reportData?.kpis?.revenue_trend || 0).toFixed(1)}%
              </span>
              <span className="text-xs text-text-tertiary ml-2">vs last period</span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* ADR KPI */}
      <div className="card hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-text-tertiary mb-2">ADR (Avg Daily Rate)</p>
            <p className="text-3xl font-bold text-text-primary mb-2">
              Rs {(reportData?.kpis?.adr || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center">
              {getTrendIcon(reportData?.kpis?.adr_trend || 0)}
              <span className={`ml-1 text-sm font-medium ${getTrendColor(reportData?.kpis?.adr_trend || 0)}`}>
                {Math.abs(reportData?.kpis?.adr_trend || 0).toFixed(1)}%
              </span>
              <span className="text-xs text-text-tertiary ml-2">vs last period</span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* RevPAR KPI */}
      <div className="card hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-text-tertiary mb-2">RevPAR</p>
            <p className="text-3xl font-bold text-text-primary mb-2">
              Rs {(reportData?.kpis?.revpar || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center">
              {getTrendIcon(reportData?.kpis?.revpar_trend || 0)}
              <span className={`ml-1 text-sm font-medium ${getTrendColor(reportData?.kpis?.revpar_trend || 0)}`}>
                {Math.abs(reportData?.kpis?.revpar_trend || 0).toFixed(1)}%
              </span>
              <span className="text-xs text-text-tertiary ml-2">vs last period</span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Occupancy KPI */}
      <div className="card hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-text-tertiary mb-2">Occupancy Rate</p>
            <p className="text-3xl font-bold text-text-primary mb-2">
              {(reportData?.kpis?.occupancy || 0).toFixed(1)}%
            </p>
            <div className="flex items-center">
              {getTrendIcon(reportData?.kpis?.occupancy_trend || 0)}
              <span className={`ml-1 text-sm font-medium ${getTrendColor(reportData?.kpis?.occupancy_trend || 0)}`}>
                {Math.abs(reportData?.kpis?.occupancy_trend || 0).toFixed(1)}%
              </span>
              <span className="text-xs text-text-tertiary ml-2">vs last period</span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Bed className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRevenueChart = () => (
    <div className="card shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Revenue Trend</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setRevenueTimeFilter('daily')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              revenueTimeFilter === 'daily' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Daily
          </button>
          <button 
            onClick={() => setRevenueTimeFilter('weekly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              revenueTimeFilter === 'weekly' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setRevenueTimeFilter('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              revenueTimeFilter === 'monthly' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="h-80 mt-4">
        {chartData.revenue.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.revenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [
                  `Rs ${value.toLocaleString()}`, 
                  name === 'revenue' ? 'Revenue' : 'Bookings'
                ]}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fill="url(#colorRevenue)"
                fillOpacity={1}
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary bg-surface-tertiary rounded-lg">
            <div className="text-center p-8">
              <Activity className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium text-text-secondary">No revenue data available</p>
              <p className="text-sm text-text-tertiary mt-1">Try selecting a different date range</p>
            </div>
        </div>
        )}
      </div>
    </div>
  );

  const renderOccupancyChart = () => (
    <div className="card shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Occupancy Rate</h3>
        </div>
        <div className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg">
          By Room Type
        </div>
      </div>
      <div className="h-80 mt-4">
        {chartData.occupancy.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData.occupancy}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.occupancy.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary bg-surface-tertiary rounded-lg">
            <div className="text-center p-8">
              <PieChart className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium text-text-secondary">No occupancy data available</p>
              <p className="text-sm text-text-tertiary mt-1">Try selecting a different date range</p>
            </div>
        </div>
        )}
      </div>
    </div>
  );

  const renderGuestAnalytics = () => (
    <div className="card shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">Guest Analytics</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-text-tertiary" />
            <span className="text-text-secondary font-medium">Total Guests</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{reportData?.guests?.total || 0}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-text-tertiary" />
            <span className="text-text-secondary font-medium">Avg Stay Length</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">{reportData?.guests?.avg_stay || 0} <span className="text-sm text-text-tertiary">nights</span></span>
        </div>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-text-tertiary" />
            <span className="text-text-secondary font-medium">Total Bookings</span>
          </div>
          <span className="text-2xl font-bold text-text-primary">
            {reportData?.channel_performance?.reduce((sum, channel) => sum + channel.bookings, 0) || 0}
          </span>
        </div>
      </div>
    </div>
  );


  const renderRoomTypeAnalysis = () => (
    <div className="card shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
          <Bed className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">Room Type Performance</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData?.room_type_performance?.map((roomType, index) => (
          <div key={index} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-border rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-text-primary text-lg">{roomType.room_type_name}</h4>
              <div className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg">
                {roomType.occupancy}%
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-surface-secondary rounded-lg group-hover:shadow-sm transition-shadow">
                <span className="text-text-secondary text-sm flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Revenue:
                </span>
                <span className="font-bold text-text-primary">Rs {roomType.revenue?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-surface-secondary rounded-lg group-hover:shadow-sm transition-shadow">
                <span className="text-text-secondary text-sm flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  ADR:
                </span>
                <span className="font-bold text-text-primary">Rs {roomType.adr?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-surface-secondary rounded-lg group-hover:shadow-sm transition-shadow">
                <span className="text-text-secondary text-sm flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Bookings:
                </span>
                <span className="font-bold text-text-primary">{roomType.bookings}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // REMOVED: Forecasting functionality - Phase 3 feature (Q2 2026)
  // const renderForecasting = () => (
  //   <div className="space-y-6">
  //     <div className="bg-surface-secondary border border-border rounded-lg p-6">
  //       <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Forecast</h3>
  //       {/* ... forecasting content ... */}
  //     </div>
  //   </div>
  // );

  const renderContent = () => {
    switch (reportType) {
      case 'overview':
        return (
          <div className="space-y-6">
            {renderKPICards()}
            {renderRevenueChart()}
            {renderOccupancyChart()}
            {renderGuestAnalytics()}
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-6">
            {renderRevenueChart()}
            {renderRoomTypeAnalysis()}
          </div>
        );
      case 'occupancy':
        return (
          <div className="space-y-6">
            {renderOccupancyChart()}
            {renderRoomTypeAnalysis()}
          </div>
        );
      case 'guests':
        return (
          <div className="space-y-6">
            {renderGuestAnalytics()}
          </div>
        );
      // REMOVED: case 'forecasting' - Phase 3 feature (Q2 2026)
      // case 'forecasting':
      //   return renderForecasting();
      default:
        return null;
    }
  };

  // Show branch selector if no branch is selected
  if (showBranchSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="luxury-gradient rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Reports Dashboard</h1>
                  <p className="text-white/80 mt-2">Select a branch location to view detailed reports and analytics</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card shadow-xl">
            <BranchSelector 
              onBranchSelect={handleBranchSelect}
              selectedBranch={selectedBranch}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="luxury-gradient rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToBranchSelection}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="border-l border-white/30 pl-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {selectedBranch?.name}
                    </h1>
                    <p className="text-white/80 mt-1">
                      {selectedBranch?.isOverall ? 'Overall analytics from all locations' : selectedBranch?.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <button
                onClick={loadReportData}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportReport('pdf')}
                  className="gold-gradient hover:opacity-90 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => exportReport('excel')}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Date Range and Report Type */}
      <div className="card shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-purple-500" />
              Report Type
            </label>
            <SearchableDropdown
              value={reportType}
              onChange={(value) => setReportType(value || 'overview')}
              options={reportTypeOptions}
              hideSearch
              clearable={false}
              placeholder="Select report type"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadReportData}
              className="w-full btn-primary flex items-center justify-center space-x-2 h-11"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Updating...' : 'Update Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Room Type Filter */}
      {showFilters && (
        <div className="card shadow-lg bg-blue-50/50">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Advanced Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Room Type</label>
              <SearchableDropdown
                value={filters.roomType}
                onChange={(value) => setFilters((prev) => ({ ...prev, roomType: value || 'all' }))}
                options={roomTypeOptions}
                hideSearch
                clearable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="card shadow-xl text-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-border border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-text-secondary text-xl font-semibold">Loading Report Data...</p>
          <p className="mt-2 text-text-tertiary text-sm">Analyzing metrics and generating insights</p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      ) : error ? (
        <div className="card shadow-xl text-center py-16">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-10 max-w-lg mx-auto">
            <div className="bg-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-red-900 mb-3">Unable to Load Report Data</h3>
            <p className="text-red-700 mb-6 text-lg">{error}</p>
            <button
              onClick={loadReportData}
              className="btn-primary inline-flex items-center space-x-2 px-8 py-3 text-lg"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      ) : (
        renderContent()
      )}
      </div>
    </div>
  );
};

export default ReportingDashboard;




