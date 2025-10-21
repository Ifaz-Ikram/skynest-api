import { useEffect, useState } from 'react';
import { Bed, DollarSign, Calendar, CreditCard, Users, ShoppingBag, Download, LogIn, LogOut, Building2, FileText, TrendingUp, Filter } from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  // Ops widgets
  const [arrivals, setArrivals] = useState(null);
  const [departures, setDepartures] = useState(null);
  const [inHouse, setInHouse] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, d, i] = await Promise.all([
          api.getArrivalsToday(),
          api.getDeparturesToday(),
          api.getInHouse(),
        ]);
        setArrivals(a);
        setDepartures(d);
        setInHouse(i);
      } catch (_) {}
    })();
  }, []);

  const setReportFromList = (name, list) => {
    const rows = normalizeRows(list);
    setSelectedReport(name);
    setReportData(rows);
  };

  const reportTypes = [
    { id: 'occupancy', name: 'Occupancy Report', icon: Bed },
    { id: 'revenue', name: 'Revenue Report', icon: DollarSign },
    { id: 'bookings', name: 'Bookings Summary', icon: Calendar },
    { id: 'payments', name: 'Payments Report', icon: CreditCard },
    { id: 'customers', name: 'Customer Report', icon: Users },
    { id: 'services', name: 'Services Usage', icon: ShoppingBag },
  ];

  const loadReport = async (reportId) => {
    setLoading(true);
    try {
      // Map report IDs to actual API endpoints
      const reportEndpoints = {
        'occupancy': '/api/reports/occupancy-by-day',
        'revenue': '/api/reports/billing-summary', 
        'bookings': '/api/reports/billing-summary', // Using billing summary for bookings
        'payments': '/api/reports/payments-ledger',
        'customers': '/api/reports/billing-summary', // Using billing summary for customers
        'services': '/api/reports/service-usage-detail'
      };
      
      const endpoint = reportEndpoints[reportId];
      if (!endpoint) {
        throw new Error('Report not found');
      }
      
      // Build query parameters for date range - backend expects 'from' and 'to'
      const params = new URLSearchParams();
      if (dateRange.start_date) {
        params.append('from', dateRange.start_date);
        console.log('Adding start date filter (from):', dateRange.start_date);
      }
      if (dateRange.end_date) {
        params.append('to', dateRange.end_date);
        console.log('Adding end date filter (to):', dateRange.end_date);
      }
      
      const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Loading report from:', url);
      const data = await api.request(url);
      setReportData(data);
      setSelectedReport(reportId);
    } catch (error) {
      alert('Failed to load report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportReportToCSV = () => {
    if (!reportData || !reportData.length) {
      alert('No data to export');
      return;
    }
    
    const csv = [
      Object.keys(reportData[0]).join(','),
      ...reportData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-surface-primary dark:bg-slate-950 p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Header */}
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
                {format(new Date(), 'EEEE, MMMM do yyyy')} • Comprehensive business insights
              </p>
            </div>
            {reportData && (
              <button
                onClick={exportReportToCSV}
                className="bg-slate-800/90 backdrop-blur-xl text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all flex items-center gap-2 shadow-lg border border-slate-700/50"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Today's Operations - Premium Cards */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-luxury-gold" />
            Today's Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OpsCard
              title="Arrivals Today"
              icon={LogIn}
              count={Array.isArray(arrivals) ? arrivals.length : 0}
              data={Array.isArray(arrivals) ? arrivals : []}
              onView={() => setReportFromList('Arrivals Today', arrivals)}
              color="green"
            />
            <OpsCard
              title="Departures Today"
              icon={LogOut}
              count={Array.isArray(departures) ? departures.length : 0}
              data={Array.isArray(departures) ? departures : []}
              onView={() => setReportFromList('Departures Today', departures)}
              color="orange"
            />
            <OpsCard
              title="In-House Guests"
              icon={Building2}
              count={Array.isArray(inHouse) ? inHouse.length : 0}
              data={Array.isArray(inHouse) ? inHouse : []}
              onView={() => setReportFromList('In-House', inHouse)}
              color="blue"
            />
          </div>
        </div>

        {/* Date Range Filter - Beautiful Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-6 h-6 text-luxury-gold" />
            <h3 className="text-xl font-bold text-white">Date Range Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Start Date
                <span className="block text-xs font-normal text-slate-400 mt-0.5">
                  {dateRange.end_date ? 'Reports from this date...' : 'Reports from this date onwards'}
                </span>
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => {
                  console.log('Start date changed to:', e.target.value);
                  setDateRange({...dateRange, start_date: e.target.value});
                }}
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400-2 border-border rounded-xl focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                End Date
                <span className="block text-xs font-normal text-slate-400 mt-0.5">
                  {dateRange.start_date ? '...to this date' : 'Reports up to this date'}
                </span>
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => {
                  console.log('End date changed to:', e.target.value);
                  setDateRange({...dateRange, end_date: e.target.value});
                }}
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400-2 border-border rounded-xl focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
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

        {/* Report Types - Premium Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-7 h-7 text-luxury-gold" />
            Available Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map(report => {
              const Icon = report.icon;
              const colors = {
                'occupancy': 'from-blue-500 to-blue-600',
                'revenue': 'from-green-500 to-green-600',
                'bookings': 'from-purple-500 to-purple-600',
                'payments': 'from-yellow-500 to-yellow-600',
                'customers': 'from-pink-500 to-pink-600',
                'services': 'from-indigo-500 to-indigo-600'
              };
              return (
                <button
                  key={report.id}
                  onClick={() => loadReport(report.id)}
                  disabled={loading}
                  className="group bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-left disabled:opacity-50 border border-slate-700/50 hover:scale-105 transform"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`bg-gradient-to-br ${colors[report.id]} p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-white mb-2">{report.name}</h3>
                  <p className="text-sm text-slate-400">Click to generate detailed report</p>
                  <div className="mt-4 text-luxury-gold text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Generate Report →
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State - Premium */}
        {loading && (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-slate-700/50">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700/50 border-t-luxury-gold mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-8 h-8 text-luxury-gold animate-pulse" />
              </div>
            </div>
            <p className="text-slate-300 mt-6 text-lg font-medium">Generating your report...</p>
            <p className="text-slate-400 text-sm mt-2">Please wait while we compile the data</p>
          </div>
        )}

        {/* Report Results - Premium Table */}
        {reportData && !loading && (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-luxury-navy to-indigo-900 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FileText className="w-7 h-7" />
                {reportTypes.find(r => r.id === selectedReport)?.name || selectedReport}
              </h2>
              <p className="text-indigo-200 mt-1">
                Generated on {format(new Date(), 'MMMM do, yyyy')} • {reportData.length} records
              </p>
            </div>
            
            {reportData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-slate-700/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-300 text-lg font-medium">No data available</p>
                <p className="text-slate-400 text-sm mt-2">Try adjusting your date range or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-700/50 rounded-xl bg-slate-800/90">
                <table className="min-w-full">
                  <thead className="bg-slate-800/60 border-b-2 border-slate-700/50">
                    <tr>
                      {Object.keys(reportData[0]).map((key) => (
                        <th key={key} className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/90 divide-y divide-slate-700/50">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/40 transition-colors">
                        {Object.values(row).map((value, colIdx) => (
                          <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {value === null || value === undefined ? (
                              <span className="text-slate-400">-</span>
                            ) : typeof value === 'number' ? (
                              <span className="font-medium">{value.toLocaleString()}</span>
                            ) : typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/) ? (
                              <span className="text-slate-300">{new Date(value).toLocaleDateString()}</span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function OpsCard({ title, count, icon: Icon, data, onView, color }) {
  const exportCsv = () => {
    if (!Array.isArray(data) || !data.length) return;
    const header = ['booking_id','guest','room_number','branch_name'];
    const lines = [header.join(',')].concat(data.map(r=>[r.booking_id,r.guest,r.room_number,r.branch_name].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g,'-')}-${new Date().toISOString().split('T')[0]}.csv`;
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
    green: 'bg-green-900/30 border border-green-700/50',
    orange: 'bg-orange-900/30 border border-orange-700/50',
    blue: 'bg-blue-900/30 border border-blue-700/50'
  };

  return (
    <div className={`${bgColors[color]} backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105 transform`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-300 mb-1">{title}</div>
            <div className="text-4xl font-bold text-white">{count}</div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="flex-1 bg-slate-800/80 text-slate-200 px-4 py-2 rounded-xl font-medium hover:bg-slate-700 transition-all shadow-sm border border-slate-600"
          onClick={exportCsv}
        >
          <Download className="w-4 h-4 inline mr-1" />
          Export
        </button>
        <button 
          className="flex-1 bg-luxury-navy text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-900 transition-all shadow-sm"
          onClick={onView}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// Helper to set report panel from a list
function normalizeRows(list) {
  if (!Array.isArray(list) || !list.length) return [];
  return list.map((r) => ({
    booking_id: r.booking_id,
    guest: r.guest,
    room_number: r.room_number,
    branch: r.branch_name,
    check_in_date: r.check_in_date,
    check_out_date: r.check_out_date,
    status: r.status,
  }));
}
