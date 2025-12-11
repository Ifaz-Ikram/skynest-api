import { useEffect, useState } from 'react';
import { Bed, DollarSign, Calendar, CreditCard, Users, ShoppingBag, Download, LogIn, LogOut, Building2, FileText, TrendingUp, Filter, Eye } from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });

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
      } catch (_) { }
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
      const reportEndpoints = {
        'occupancy': '/api/reports/occupancy-by-day',
        'revenue': '/api/reports/billing-summary',
        'bookings': '/api/reports/billing-summary',
        'payments': '/api/reports/payments-ledger',
        'customers': '/api/reports/billing-summary',
        'services': '/api/reports/service-usage-detail'
      };

      const endpoint = reportEndpoints[reportId];
      if (!endpoint) throw new Error('Report not found');

      const params = new URLSearchParams();
      if (dateRange.start_date) params.append('from', dateRange.start_date);
      if (dateRange.end_date) params.append('to', dateRange.end_date);

      const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
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
    if (!reportData || !reportData.length) return alert('No data to export');

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
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-10 h-10" />
                <h1 className="text-4xl font-bold">Reports & Analytics</h1>
              </div>
              <p style={{ color: '#90caf9' }}>
                {format(new Date(), 'EEEE, MMMM do yyyy')} • Comprehensive business insights
              </p>
            </div>
            {reportData && (
              <button
                onClick={exportReportToCSV}
                className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Today's Operations */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a237e' }}>
            <TrendingUp className="w-7 h-7" style={{ color: '#0d47a1' }} />
            Today's Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OpsCard title="Arrivals Today" icon={LogIn} count={Array.isArray(arrivals) ? arrivals.length : 0} data={Array.isArray(arrivals) ? arrivals : []} onView={() => setReportFromList('Arrivals Today', arrivals)} color="green" />
            <OpsCard title="Departures Today" icon={LogOut} count={Array.isArray(departures) ? departures.length : 0} data={Array.isArray(departures) ? departures : []} onView={() => setReportFromList('Departures Today', departures)} color="orange" />
            <OpsCard title="In-House Guests" icon={Building2} count={Array.isArray(inHouse) ? inHouse.length : 0} data={Array.isArray(inHouse) ? inHouse : []} onView={() => setReportFromList('In-House', inHouse)} color="blue" />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-6 h-6" style={{ color: '#0d47a1' }} />
            <h3 className="text-xl font-bold" style={{ color: '#1a237e' }}>Date Range Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
                style={{ borderColor: '#e9ecef', color: '#333' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
                style={{ borderColor: '#e9ecef', color: '#333' }}
              />
            </div>
          </div>
          {(dateRange.start_date || dateRange.end_date) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDateRange({ start_date: '', end_date: '' })}
                className="px-4 py-2 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}
              >
                Clear Date Filters
              </button>
            </div>
          )}
        </div>

        {/* Report Types */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a237e' }}>
            <FileText className="w-7 h-7" style={{ color: '#0d47a1' }} />
            Available Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map(report => {
              const Icon = report.icon;
              const colors = {
                'occupancy': '#0d6efd', 'revenue': '#28a745', 'bookings': '#6f42c1',
                'payments': '#ffc107', 'customers': '#e91e8c', 'services': '#6610f2'
              };
              return (
                <button
                  key={report.id}
                  onClick={() => loadReport(report.id)}
                  disabled={loading}
                  className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 text-left disabled:opacity-50"
                  style={{ border: '1px solid #e9ecef' }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: colors[report.id] + '20' }}>
                      <Icon className="w-8 h-8" style={{ color: colors[report.id] }} />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-2" style={{ color: '#1a237e' }}>{report.name}</h3>
                  <p className="text-sm" style={{ color: '#6c757d' }}>Click to generate detailed report</p>
                  <div className="mt-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#0d47a1' }}>
                    Generate Report →
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 mx-auto" style={{ borderColor: '#e9ecef', borderTopColor: '#0d47a1' }}></div>
            <p className="mt-6 text-lg font-medium" style={{ color: '#6c757d' }}>Generating your report...</p>
          </div>
        )}

        {/* Report Results */}
        {reportData && !loading && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FileText className="w-7 h-7" />
                {reportTypes.find(r => r.id === selectedReport)?.name || selectedReport}
              </h2>
              <p style={{ color: '#90caf9' }}>Generated on {format(new Date(), 'MMMM do, yyyy')} • {reportData.length} records</p>
            </div>

            {reportData.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-20 h-20 mx-auto mb-4" style={{ color: '#dee2e6' }} />
                <p className="text-lg font-medium" style={{ color: '#6c757d' }}>No data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#e3f2fd' }}>
                      {Object.keys(reportData[0]).map((key) => (
                        <th key={key} className="px-6 py-4 text-left text-xs font-bold uppercase" style={{ color: '#1a237e' }}>
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#e9ecef' }}>
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        {Object.values(row).map((value, colIdx) => (
                          <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#333' }}>
                            {value === null || value === undefined ? '-' : typeof value === 'number' ? value.toLocaleString() : String(value)}
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
  const colorStyles = {
    green: { bg: '#d4edda', text: '#155724', border: '#28a745' },
    orange: { bg: '#ffe5d0', text: '#984c0c', border: '#fd7e14' },
    blue: { bg: '#cfe2ff', text: '#084298', border: '#0d6efd' }
  };
  const style = colorStyles[color];

  const exportCsv = () => {
    if (!Array.isArray(data) || !data.length) return;
    const csv = ['Booking ID,Guest,Room,Branch', ...data.map(r => `${r.booking_id},${r.guest},${r.room_number},${r.branch_name}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all" style={{ border: `1px solid ${style.border}20` }}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: style.bg }}>
          <Icon className="w-7 h-7" style={{ color: style.border }} />
        </div>
        <div>
          <h3 className="text-sm font-medium" style={{ color: '#6c757d' }}>{title}</h3>
          <div className="text-4xl font-bold" style={{ color: style.border }}>{count}</div>
        </div>
      </div>

      {count > 0 && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: style.bg + '40' }}>
          {data.slice(0, 3).map((item, idx) => (
            <div key={idx} className="text-sm py-1" style={{ color: style.text }}>
              {item.guest} - Room {item.room_number}
            </div>
          ))}
          {count > 3 && <div className="text-xs mt-1" style={{ color: style.text }}>+{count - 3} more...</div>}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={exportCsv}
          disabled={count === 0}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          <Download className="w-4 h-4 inline mr-1" /> Export
        </button>
        <button
          onClick={onView}
          disabled={count === 0}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          <Eye className="w-4 h-4 inline mr-1" /> View
        </button>
      </div>
    </div>
  );
}

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
