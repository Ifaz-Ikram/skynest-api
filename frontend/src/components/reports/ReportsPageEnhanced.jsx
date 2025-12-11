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
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // Today
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

  // Filter data
  const [branches, setBranches] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  useEffect(() => {
    loadOperationsData();
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [branchesData, roomTypesData] = await Promise.all([
        api.getBranches(),
        api.getRoomTypes()
      ]);
      setBranches(branchesData || []);
      setRoomTypes(roomTypesData || []);
    } catch (error) {
      console.error('Failed to load filter data:', error);
      setBranches([]);
      setRoomTypes([]);
    }
  };

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
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
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
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'Checked-In' ? 'bg-green-800/30 text-green-200 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-800/30 text-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
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
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden transform hover:scale-105 transition-all duration-300">
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
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden transform hover:scale-105 transition-all duration-300">
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
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden transform hover:scale-105 transition-all duration-300">
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
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
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
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
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
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-all">
                  <div>
                    <p className="font-semibold text-white text-lg">{guest.guest || 'Unknown Guest'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-300">{guest.branch_name || 'Unknown Branch'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm text-slate-300">Room {guest.room_number || 'Unknown'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm text-slate-400">{guest.nights || 0} nights</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-luxury-gold">Rs {parseFloat(guest.total_bill || 0).toLocaleString()}</p>
                    {parseFloat(guest.balance_due || 0) > 0 && (
                      <p className="text-sm text-red-400 mt-1">Outstanding: Rs {parseFloat(guest.balance_due).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Outstanding Payments Alert */}
        {billingData.filter(b => parseFloat(b.balance_due || 0) > 0).length > 0 && (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-red-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Outstanding Payments Alert</h3>
                    <p className="text-red-100 text-sm mt-1">
                      {billingData.filter(b => parseFloat(b.balance_due || 0) > 0).length} bookings with outstanding balance
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => exportToCSV(billingData.filter(b => parseFloat(b.balance_due || 0) > 0), 'outstanding-payments')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Booking ID</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Guest</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Total Bill</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Paid</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData
                      .filter(b => parseFloat(b.balance_due || 0) > 0)
                      .slice(0, 10)
                      .map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-4 text-white font-medium">#{row.booking_id}</td>
                          <td className="py-3 px-4 text-slate-200">{row.guest}</td>
                          <td className="py-3 px-4 text-right text-slate-200">Rs {parseFloat(row.total_bill || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-green-400">Rs {parseFloat(row.total_paid || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-red-400 font-bold text-lg">Rs {parseFloat(row.balance_due || 0).toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
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
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
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
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-slate-700/50">
          <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-xl font-semibold">Loading Report...</p>
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
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
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
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a237e' }}>
            <TrendingUp className="w-7 h-7" style={{ color: '#0d47a1' }} />
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
          branches={branches}
          roomTypes={roomTypes}
          bookingStatuses={['Booked', 'Checked-In', 'Checked-Out', 'Cancelled']}
        />

        {/* Report Cards - Premium Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a237e' }}>
            <BarChart3 className="w-7 h-7" style={{ color: '#0d47a1' }} />
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
      className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-left transform hover:scale-105 ${active ? 'ring-4 ring-blue-500 shadow-xl scale-105' : ''
        }`}
      style={{ border: '1px solid #e9ecef' }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`bg-gradient-to-br ${colorStyles[color]} p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        {active && <Eye className="w-6 h-6 animate-pulse" style={{ color: '#0d47a1' }} />}
      </div>
      <h3 className="font-bold text-xl mb-2" style={{ color: '#1a237e' }}>{title}</h3>
      <p className="text-sm" style={{ color: '#6c757d' }}>{description}</p>
      <div className="mt-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#0d47a1' }}>
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
    green: 'bg-white border',
    orange: 'bg-white border',
    blue: 'bg-white border'
  };

  const bgColorStyles = {
    green: { backgroundColor: '#d4edda', borderColor: '#28a745' },
    orange: { backgroundColor: '#ffe5d0', borderColor: '#fd7e14' },
    blue: { backgroundColor: '#cfe2ff', borderColor: '#0d6efd' }
  };

  const textColors = {
    green: '#155724',
    orange: '#984c0c',
    blue: '#084298'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6" style={{ border: '1px solid #e9ecef' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1" style={{ color: '#6c757d' }}>{title}</div>
            <div className="text-4xl font-bold" style={{ color: textColors[color] }}>{count}</div>
          </div>
        </div>
      </div>
      <button
        className="w-full px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
        style={{ backgroundColor: bgColorStyles[color].backgroundColor, color: textColors[color] }}
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
    <div className="bg-white rounded-2xl shadow-lg p-12 text-center" style={{ border: '1px solid #e9ecef' }}>
      <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#dee2e6' }} />
      <p className="text-lg" style={{ color: '#6c757d' }}>{message}</p>
      <p className="text-sm mt-2" style={{ color: '#adb5bd' }}>Try selecting a different date range or report type</p>
    </div>
  );
}

export default ReportsPageEnhanced;
