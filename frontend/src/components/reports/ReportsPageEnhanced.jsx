import { useEffect, useState } from 'react';
import { 
  Bed, DollarSign, Calendar, CreditCard, Users, ShoppingBag, Download, 
  LogIn, LogOut, Building2, TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon,
  AlertCircle, RefreshCw, Filter, Eye, FileText, FileSpreadsheet
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import api from '../../utils/api';
import { InteractiveDataTable, AdvancedFiltersPanel } from '../common';
import { exportToExcel, exportReportToPDF } from '../../utils/exportUtils';

const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const ReportsPageEnhanced = () => {
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: '2025-10-01',
    end_date: '2025-10-31'
  });

  // Filters state
  const [filters, setFilters] = useState({
    branch: 'all',
    roomType: 'all',
    status: 'all',
    dateRange: { start: '', end: '' },
    guestType: 'all'
  });

  // Data states
  const [occupancyData, setOccupancyData] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [serviceUsageData, setServiceUsageData] = useState([]);
  const [branchRevenueData, setBranchRevenueData] = useState([]);
  const [serviceTrendData, setServiceTrendData] = useState([]);
  
  // Operations widgets
  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [inHouse, setInHouse] = useState([]);

  useEffect(() => {
    loadOperationsData();
  }, []);

  const loadOperationsData = async () => {
    try {
      const [a, d, i] = await Promise.all([
        api.request('/api/reports/arrivals-today'),
        api.request('/api/reports/departures-today'),
        api.request('/api/reports/in-house'),
      ]);
      setArrivals(a);
      setDepartures(d);
      setInHouse(i);
    } catch (err) {
      console.error('Failed to load operations data:', err);
    }
  };

  const loadReport = async (reportType) => {
    setLoading(true);
    setActiveReport(reportType);
    
    try {
      switch (reportType) {
        case 'occupancy':
          const occData = await api.request('/api/reports/occupancy-by-day');
          setOccupancyData(Array.isArray(occData) ? occData.slice(0, 30) : []);
          break;
          
        case 'billing':
          const billData = await api.request('/api/reports/billing-summary');
          setBillingData(Array.isArray(billData) ? billData : []);
          break;
          
        case 'services':
          const servData = await api.request('/api/reports/service-usage-detail');
          setServiceUsageData(Array.isArray(servData) ? servData.slice(0, 100) : []);
          break;
          
        case 'branch-revenue':
          const branchData = await api.request('/api/reports/branch-revenue-monthly');
          setBranchRevenueData(Array.isArray(branchData) ? branchData : []);
          break;
          
        case 'service-trend':
          const trendData = await api.request('/api/reports/service-monthly-trend');
          setServiceTrendData(Array.isArray(trendData) ? trendData : []);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      alert('Failed to load report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
      alert('No data to export');
      return;
    }
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => 
        typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOccupancyChart = () => {
    if (!occupancyData.length) return <EmptyState message="No occupancy data available" />;
    
    // Group by date and count bookings
    const chartData = occupancyData.reduce((acc, item) => {
      const date = item.day?.split('T')[0] || 'Unknown';
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.bookings += 1;
      } else {
        acc.push({ date, bookings: 1 });
      }
      return acc;
    }, []).slice(0, 30);

    return (
      <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-luxury-navy to-indigo-900 p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Daily Occupancy Trend</h3>
                <p className="text-indigo-200 text-sm mt-1">{occupancyData.length} records found</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => exportToExcel(occupancyData, 'occupancy-report')} 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button 
                onClick={() => exportReportToPDF({
                  title: 'Occupancy Report',
                  data: occupancyData.slice(0, 20),
                  chartElementId: 'occupancy-chart',
                  filename: 'occupancy-report'
                })} 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
        <div id="occupancy-chart">
          <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="bookings" stroke="#3B82F6" fillOpacity={1} fill="url(#colorOccupancy)" />
          </AreaChart>
        </ResponsiveContainer>
        </div>
        
        <div className="mt-6">
          <InteractiveDataTable
            data={occupancyData.map(row => ({
              date: row.day?.split('T')[0] || 'N/A',
              branch: row.branch_name || 'N/A',
              room: row.room_number || 'N/A',
              guest: row.guest || 'N/A',
              status: row.status || 'N/A'
            }))}
            columns={[
              { key: 'date', label: 'Date', sortable: true },
              { key: 'branch', label: 'Branch', sortable: true },
              { key: 'room', label: 'Room', sortable: true },
              { key: 'guest', label: 'Guest', sortable: true },
              { 
                key: 'status', 
                label: 'Status', 
                sortable: true,
                render: (value) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    value === 'Checked-In' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {value}
                  </span>
                )
              }
            ]}
            pageSize={10}
            searchable={true}
            sortable={true}
            paginated={true}
          />
        </div>
      </div>
    );
  };

  const renderBillingDashboard = () => {
    if (!billingData.length) return <EmptyState message="No billing data available" />;
    
    // Calculate metrics
    const totalBilled = billingData.reduce((sum, b) => sum + parseFloat(b.total_bill || 0), 0);
    const totalPaid = billingData.reduce((sum, b) => sum + parseFloat(b.total_paid || 0), 0);
    const totalOutstanding = billingData.reduce((sum, b) => sum + parseFloat(b.balance_due || 0), 0);
    
    const pieData = [
      { name: 'Paid', value: totalPaid, color: '#10B981' },
      { name: 'Outstanding', value: totalOutstanding, color: '#EF4444' }
    ];

    const topRevenue = [...billingData]
      .sort((a, b) => parseFloat(b.total_bill || 0) - parseFloat(a.total_bill || 0))
      .slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Total Billed</p>
                  <p className="text-3xl font-bold">Rs {totalBilled.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm text-green-100 mb-1">Total Paid</p>
                  <p className="text-3xl font-bold">Rs {totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm text-red-100 mb-1">Outstanding</p>
                  <p className="text-3xl font-bold">Rs {totalOutstanding.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-luxury-navy to-indigo-900 p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <RechartsPie className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Payment Status</h3>
                  <p className="text-indigo-200 text-sm mt-1">Distribution of paid vs outstanding</p>
                </div>
              </div>
              <button 
                onClick={() => exportToCSV(billingData, 'billing-report')} 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
            </RechartsPie>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Top Revenue Guests */}
        <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-luxury-gold to-yellow-600 p-6">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Top Revenue Guests</h3>
                <p className="text-yellow-100 text-sm mt-1">Highest spending customers</p>
              </div>
            </div>
          </div>
          <div className="p-6">
          <div className="space-y-3">
            {topRevenue.map((guest, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-surface-tertiary rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">{guest.guest || 'Unknown'}</p>
                  <p className="text-sm text-text-secondary">{guest.room || 'N/A'} • {guest.nights || 0} nights</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-luxury-gold">Rs {parseFloat(guest.total_bill || 0).toLocaleString()}</p>
                  {parseFloat(guest.balance_due || 0) > 0 && (
                    <p className="text-sm text-red-600">Outstanding: Rs {parseFloat(guest.balance_due).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Outstanding Payments Alert */}
        {billingData.filter(b => parseFloat(b.balance_due || 0) > 0).length > 0 && (
          <div className="card shadow-lg bg-red-50 border-2 border-red-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h4 className="font-bold text-red-900 mb-2">Outstanding Payments Alert</h4>
                <p className="text-red-700 mb-3">
                  {billingData.filter(b => parseFloat(b.balance_due || 0) > 0).length} bookings with outstanding balance
                </p>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Guest</th>
                        <th>Total Bill</th>
                        <th>Paid</th>
                        <th>Balance Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingData
                        .filter(b => parseFloat(b.balance_due || 0) > 0)
                        .slice(0, 10)
                        .map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.booking_id}</td>
                            <td>{row.guest}</td>
                            <td>Rs {parseFloat(row.total_bill || 0).toLocaleString()}</td>
                            <td>Rs {parseFloat(row.total_paid || 0).toLocaleString()}</td>
                            <td className="text-red-600 font-bold">Rs {parseFloat(row.balance_due || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBranchRevenueChart = () => {
    if (!branchRevenueData.length) return <EmptyState message="No branch revenue data available" />;
    
    const chartData = branchRevenueData.slice(0, 12).reverse();

    return (
      <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Branch Revenue Monthly</h3>
                <p className="text-purple-200 text-sm mt-1">{chartData.length} months of data</p>
              </div>
            </div>
            <button 
              onClick={() => exportToCSV(branchRevenueData, 'branch-revenue')} 
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip formatter={(value) => `Rs ${value?.toLocaleString() || 0}`} />
            <Legend />
            <Bar dataKey="room_revenue" fill="#D4AF37" name="Room Revenue" />
            <Bar dataKey="service_revenue" fill="#3B82F6" name="Service Revenue" />
            <Line type="monotone" dataKey="total_revenue" stroke="#EF4444" strokeWidth={3} name="Total Revenue" />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderServiceTrendChart = () => {
    if (!serviceTrendData.length) return <EmptyState message="No service trend data available" />;
    
    // Get top 5 services by revenue
    const servicesByRevenue = {};
    serviceTrendData.forEach(item => {
      const service = item.service_name || 'Unknown';
      if (!servicesByRevenue[service]) {
        servicesByRevenue[service] = 0;
      }
      servicesByRevenue[service] += parseFloat(item.total_revenue || 0);
    });
    
    const topServices = Object.entries(servicesByRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Group by date and create proper chart data structure
    const dateMap = {};
    serviceTrendData
      .filter(item => topServices.includes(item.service_name))
      .forEach(item => {
        const date = item.month || item.date || 'Unknown';
        if (!dateMap[date]) {
          dateMap[date] = { date };
        }
        const service = item.service_name;
        dateMap[date][service] = (dateMap[date][service] || 0) + parseFloat(item.total_revenue || 0);
      });

    const chartData = Object.values(dateMap).slice(-30); // Last 30 data points

    return (
      <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Service Usage Trend</h3>
                <p className="text-green-100 text-sm mt-1">Top 5 services by revenue</p>
              </div>
            </div>
            <button 
              onClick={() => exportToCSV(serviceTrendData, 'service-trend')} 
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        <div className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip formatter={(value) => `Rs ${value?.toLocaleString() || 0}`} />
            <Legend />
            {topServices.map((service, idx) => (
              <Area
                key={service}
                type="monotone"
                dataKey={service}
                stackId="1"
                stroke={COLORS[idx % COLORS.length]}
                fill={COLORS[idx % COLORS.length]}
                fillOpacity={0.6}
                name={service}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderActiveReport = () => {
    if (loading) {
      return (
        <div className="card shadow-xl text-center py-20">
          <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-xl font-semibold">Loading Report...</p>
        </div>
      );
    }

    switch (activeReport) {
      case 'occupancy':
        return renderOccupancyChart();
      case 'billing':
        return renderBillingDashboard();
      case 'branch-revenue':
        return renderBranchRevenueChart();
      case 'service-trend':
        return renderServiceTrendChart();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Header with Gradient */}
        <div className="bg-gradient-to-r from-luxury-navy to-indigo-900 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-10 h-10" />
                <h1 className="text-4xl font-bold">Reports & Analytics</h1>
              </div>
              <p className="text-indigo-200 text-lg">
                Comprehensive business intelligence with interactive visualizations
              </p>
            </div>
            <button
              onClick={() => activeReport && loadReport(activeReport)}
              className="bg-white/20 backdrop-blur-sm p-4 rounded-xl hover:bg-white/30 transition-all group"
            >
              <RefreshCw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Today's Operations - Premium Cards */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-luxury-gold" />
            Today's Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OpsCard
              title="Arrivals Today"
              icon={LogIn}
              count={Array.isArray(arrivals) ? arrivals.length : 0}
              data={arrivals}
              color="green"
            />
            <OpsCard
              title="Departures Today"
              icon={LogOut}
              count={Array.isArray(departures) ? departures.length : 0}
              data={departures}
              color="orange"
            />
            <OpsCard
              title="In-House Guests"
              icon={Building2}
              count={Array.isArray(inHouse) ? inHouse.length : 0}
              data={inHouse}
              color="blue"
            />
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AdvancedFiltersPanel
          onApplyFilters={(newFilters) => {
            setFilters(newFilters);
            console.log('Filters applied:', newFilters);
            // Reload data with filters
            if (activeReport) {
              loadReport(activeReport);
            }
          }}
          onClearFilters={() => {
            setFilters({
              branch: 'all',
              roomType: 'all',
              status: 'all',
              dateRange: { start: '', end: '' },
              guestType: 'all'
            });
            console.log('Filters cleared');
          }}
          branches={['Colombo', 'Kandy', 'Galle']}
          roomTypes={['Deluxe', 'Suite', 'Standard', 'Family Room']}
          bookingStatuses={['confirmed', 'pending', 'checked-in', 'checked-out']}
        />

        {/* Report Cards - Premium Grid */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-luxury-gold" />
            Available Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard
              title="Occupancy Analysis"
              description="Daily occupancy trends and room utilization"
              icon={Bed}
              color="blue"
              onClick={() => loadReport('occupancy')}
              active={activeReport === 'occupancy'}
            />
            <ReportCard
              title="Billing Dashboard"
              description="Revenue, payments, and outstanding balances"
              icon={DollarSign}
              color="green"
              onClick={() => loadReport('billing')}
              active={activeReport === 'billing'}
            />
            <ReportCard
              title="Branch Revenue"
              description="Monthly revenue comparison by branch"
              icon={Building2}
              color="purple"
              onClick={() => loadReport('branch-revenue')}
              active={activeReport === 'branch-revenue'}
            />
            <ReportCard
              title="Service Trends"
              description="Service usage and revenue trends"
              icon={ShoppingBag}
              color="orange"
              onClick={() => loadReport('service-trend')}
              active={activeReport === 'service-trend'}
            />
          </div>
        </div>

        {/* Active Report Display */}
        {activeReport && renderActiveReport()}
      </div>
    </div>
  );
};

function ReportCard({ title, description, icon: Icon, color, onClick, active }) {
  const colorStyles = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <button
      onClick={onClick}
      className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-left transform hover:scale-105 ${
        active ? 'ring-4 ring-luxury-gold shadow-xl scale-105' : ''
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`bg-gradient-to-br ${colorStyles[color]} p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        {active && <Eye className="w-6 h-6 text-luxury-gold animate-pulse" />}
      </div>
      <h3 className="font-bold text-text-primary text-xl mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
      <div className="mt-4 text-luxury-gold text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        View Report →
      </div>
    </button>
  );
}

function OpsCard({ title, count, icon: Icon, data, color }) {
  const exportCsv = () => {
    if (!Array.isArray(data) || !data.length) return;
    const header = ['booking_id', 'guest', 'room_number', 'branch_name'];
    const lines = [header.join(',')].concat(
      data.map(r => [r.booking_id, r.guest, r.room_number, r.branch_name].join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    orange: 'from-orange-500 to-amber-600',
    blue: 'from-blue-500 to-indigo-600'
  };

  const bgColors = {
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    blue: 'bg-blue-50'
  };

  return (
    <div className={`${bgColors[color]} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-white group hover:scale-105 transform`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-secondary mb-1">{title}</div>
            <div className="text-4xl font-bold text-text-primary">{count}</div>
          </div>
        </div>
      </div>
      <button 
        className="w-full bg-white text-text-secondary px-4 py-2 rounded-xl font-medium hover:bg-surface-tertiary transition-all shadow-sm border border-border flex items-center justify-center gap-2"
        onClick={exportCsv}
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="card text-center py-16">
      <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-text-secondary text-lg">{message}</p>
      <p className="text-text-tertiary text-sm mt-2">Try selecting a different date range or report type</p>
    </div>
  );
}

export default ReportsPageEnhanced;
