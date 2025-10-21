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
      const data = await api.request(`/api/reports/${reportId}`, {
        method: 'POST',
        body: JSON.stringify(dateRange)
      });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
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
                className="bg-white text-luxury-navy px-6 py-3 rounded-xl font-semibold hover:bg-surface-tertiary transition-all flex items-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
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
        <div className="bg-surface-secondary rounded-2xl shadow-lg p-6 border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-6 h-6 text-luxury-gold" />
            <h3 className="text-xl font-bold text-text-primary">Date Range Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Report Types - Premium Grid */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
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
                  className="group bg-surface-secondary rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-left disabled:opacity-50 border border-border hover:scale-105 transform"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`bg-gradient-to-br ${colors[report.id]} p-4 rounded-xl group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-text-primary mb-2">{report.name}</h3>
                  <p className="text-sm text-text-tertiary">Click to generate detailed report</p>
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
          <div className="bg-surface-secondary rounded-2xl shadow-xl p-12 text-center border border-border">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-luxury-gold mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-8 h-8 text-luxury-gold animate-pulse" />
              </div>
            </div>
            <p className="text-text-secondary mt-6 text-lg font-medium">Generating your report...</p>
            <p className="text-text-tertiary text-sm mt-2">Please wait while we compile the data</p>
          </div>
        )}

        {/* Report Results - Premium Table */}
        {reportData && !loading && (
          <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
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
                <div className="bg-surface-tertiary rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-text-tertiary" />
                </div>
                <p className="text-text-secondary text-lg font-medium">No data available</p>
                <p className="text-text-tertiary text-sm mt-2">Try adjusting your date range or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-tertiary border-b-2 border-border">
                    <tr>
                      {Object.keys(reportData[0]).map((key) => (
                        <th key={key} className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-tertiary transition-colors">
                        {Object.values(row).map((value, colIdx) => (
                          <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                            {value === null || value === undefined ? (
                              <span className="text-text-tertiary">-</span>
                            ) : typeof value === 'number' ? (
                              <span className="font-medium">{value.toLocaleString()}</span>
                            ) : typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/) ? (
                              <span className="text-text-secondary">{new Date(value).toLocaleDateString()}</span>
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
      <div className="flex gap-2">
        <button 
          className="flex-1 bg-white text-text-secondary px-4 py-2 rounded-xl font-medium hover:bg-surface-tertiary transition-all shadow-sm border border-border"
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
