import { useState } from 'react';
import { Bed, DollarSign, Calendar, CreditCard, Users, ShoppingBag, Download } from 'lucide-react';
import api from '../../utils/api';

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view business reports</p>
        </div>
        {reportData && (
          <button onClick={exportReportToCSV} className="btn-secondary">
            <Download className="w-4 h-4 mr-2 inline" />
            Export Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
            className="input-field"
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
            className="input-field"
            placeholder="DD/MM/YYYY"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map(report => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => loadReport(report.id)}
              disabled={loading}
              className="card hover:shadow-lg transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="bg-luxury-gold p-3 rounded-xl">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-600">Click to generate</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
          <p className="text-gray-600 mt-4">Generating report...</p>
        </div>
      )}

      {reportData && !loading && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {reportTypes.find(r => r.id === selectedReport)?.name}
          </h2>
          
          {reportData.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No data found for the selected date range</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(reportData[0]).map((key) => (
                      <th key={key} className="px-4 py-3 text-left">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, colIdx) => (
                        <td key={colIdx} className="px-4 py-3">
                          {value === null || value === undefined ? '-' : 
                           typeof value === 'number' ? value.toLocaleString() :
                           typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(value).toLocaleDateString() :
                           String(value)}
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
  );
};
