import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Filter, Download, User, Eye, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import { LuxuryPageHeader, LoadingSpinner, SearchableDropdown } from '../common';

const AuditLogPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [filters, setFilters] = useState({ start_date: '', end_date: '', entity: 'all', action: 'all', actor: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const entityOptions = useMemo(() => [
    { id: 'all', name: 'All Entities' }, { id: 'booking', name: 'Booking' }, { id: 'room', name: 'Room' },
    { id: 'payment', name: 'Payment' }, { id: 'guest', name: 'Guest' }, { id: 'service_usage', name: 'Service Usage' }
  ], []);
  const actionOptions = useMemo(() => [
    { id: 'all', name: 'All Actions' }, { id: 'CREATE', name: 'Create' }, { id: 'UPDATE', name: 'Update' }, { id: 'DELETE', name: 'Delete' }
  ], []);

  useEffect(() => { loadStats(); loadAuditLogs(); }, []);
  useEffect(() => { loadAuditLogs(); }, [pagination.page, filters]);

  const loadStats = async () => { try { const r = await api.getAuditLogStats(); setStats(r.data); } catch (e) { console.error(e); } };
  const loadAuditLogs = async () => {
    try { setLoading(true); setError(null); const r = await api.getAuditLogs(filters, pagination.page, pagination.limit); setAuditLogs(r.data); setPagination(r.pagination); }
    catch (e) { setError(e.message); setAuditLogs([]); } finally { setLoading(false); }
  };

  const handleFilterChange = (key, value) => { setFilters(p => ({ ...p, [key]: value })); setPagination(p => ({ ...p, page: 1 })); };
  const clearFilters = () => { setFilters({ start_date: '', end_date: '', entity: 'all', action: 'all', actor: '', search: '' }); };

  const getActionStyle = (action) => {
    const map = { 'CREATE': { bg: '#d4edda', color: '#155724' }, 'INSERT': { bg: '#d4edda', color: '#155724' }, 'UPDATE': { bg: '#cfe2ff', color: '#084298' }, 'DELETE': { bg: '#f8d7da', color: '#842029' } };
    return map[action.toUpperCase()] || { bg: '#e9ecef', color: '#495057' };
  };
  const getActionIcon = (action) => {
    const map = { 'CREATE': <CheckCircle className="w-4 h-4" />, 'INSERT': <CheckCircle className="w-4 h-4" />, 'UPDATE': <RefreshCw className="w-4 h-4" />, 'DELETE': <XCircle className="w-4 h-4" /> };
    return map[action.toUpperCase()] || <Clock className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader title="Audit Log" description="System activity and security audit trail" icon={FileText}
          stats={[{ label: 'Total Events', value: stats?.totalEvents || '—' }, { label: 'Today', value: stats?.todayEvents || '—' }, { label: 'Critical', value: stats?.criticalEvents || '—' }]}
        />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1a237e' }}><Filter className="w-5 h-5" /> Filters</h3>
            <div className="flex gap-2">
              <button onClick={clearFilters} className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>Clear</button>
              <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-1 text-sm rounded-lg" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#1a237e' }}>Start Date</label><input type="date" value={filters.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)} className="w-full px-4 py-2 rounded-lg border-2" style={{ borderColor: '#e9ecef' }} /></div>
              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#1a237e' }}>End Date</label><input type="date" value={filters.end_date} onChange={(e) => handleFilterChange('end_date', e.target.value)} className="w-full px-4 py-2 rounded-lg border-2" style={{ borderColor: '#e9ecef' }} /></div>
              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#1a237e' }}>Entity</label><SearchableDropdown value={filters.entity} onChange={(v) => handleFilterChange('entity', v || 'all')} options={entityOptions} placeholder="All Entities" hideSearch clearable={false} /></div>
              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#1a237e' }}>Action</label><SearchableDropdown value={filters.action} onChange={(v) => handleFilterChange('action', v || 'all')} options={actionOptions} placeholder="All Actions" hideSearch clearable={false} /></div>
              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#1a237e' }}>Actor</label><input type="text" value={filters.actor} onChange={(e) => handleFilterChange('actor', e.target.value)} placeholder="Search actor..." className="w-full px-4 py-2 rounded-lg border-2" style={{ borderColor: '#e9ecef' }} /></div>
              <div><label className="block text-sm font-semibold mb-1" style={{ color: '#1a237e' }}>Search</label><input type="text" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} placeholder="Search details..." className="w-full px-4 py-2 rounded-lg border-2" style={{ borderColor: '#e9ecef' }} /></div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
            <h3 className="text-lg font-bold" style={{ color: '#1a237e' }}>Audit Logs</h3>
            <div className="flex gap-2">
              <button onClick={loadAuditLogs} className="px-3 py-1 text-sm rounded-lg flex items-center gap-1" style={{ backgroundColor: 'white', color: '#495057' }}><RefreshCw className="w-4 h-4" /> Refresh</button>
              <button onClick={() => api.exportAuditLogs(filters)} className="px-3 py-1 text-sm rounded-lg flex items-center gap-1 text-white" style={{ backgroundColor: '#0d47a1' }}><Download className="w-4 h-4" /> Export</button>
            </div>
          </div>

          {loading ? <div className="p-8 text-center"><LoadingSpinner message="Loading..." /></div> : error ? (
            <div className="p-8 text-center"><AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#dc3545' }} /><p style={{ color: '#dc3545' }}>{error}</p></div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center"><FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#dee2e6' }} /><p style={{ color: '#6c757d' }}>No audit logs found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr style={{ backgroundColor: '#e3f2fd' }}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Entity ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Actions</th>
                </tr></thead>
                <tbody className="divide-y" style={{ borderColor: '#e9ecef' }}>
                  {auditLogs.map((log) => (
                    <tr key={log.audit_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm" style={{ color: '#333' }}>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-6 py-4 text-sm flex items-center gap-2" style={{ color: '#333' }}><User className="w-4 h-4" style={{ color: '#6c757d' }} />{log.user?.username || log.actor}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit" style={getActionStyle(log.action)}>{getActionIcon(log.action)}{log.action}</span></td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#333' }}>{log.entity.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#6c757d' }}>{log.entity_id || '—'}</td>
                      <td className="px-6 py-4"><button onClick={async () => { const r = await api.getAuditLogById(log.audit_id); setSelectedLog(r.data); setShowDetailsModal(true); }} className="flex items-center gap-1 text-sm" style={{ color: '#0d47a1' }}><Eye className="w-4 h-4" /> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }}>
              <div className="text-sm" style={{ color: '#6c757d' }}>Page {pagination.page} of {pagination.totalPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="px-3 py-1 rounded-lg text-sm disabled:opacity-50" style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}>Previous</button>
                <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 rounded-lg text-sm disabled:opacity-50" style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-5 border-b flex items-center justify-between" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
                <h3 className="text-lg font-bold" style={{ color: '#1a237e' }}>Audit Log Details</h3>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 rounded-lg" style={{ backgroundColor: 'white' }}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-sm" style={{ color: '#6c757d' }}>ID:</span><p className="font-medium" style={{ color: '#1a237e' }}>{selectedLog.audit_id}</p></div>
                  <div><span className="text-sm" style={{ color: '#6c757d' }}>Timestamp:</span><p className="font-medium" style={{ color: '#1a237e' }}>{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}</p></div>
                  <div><span className="text-sm" style={{ color: '#6c757d' }}>Actor:</span><p className="font-medium" style={{ color: '#1a237e' }}>{selectedLog.user?.username || selectedLog.actor}</p></div>
                  <div><span className="text-sm" style={{ color: '#6c757d' }}>Action:</span><span className="px-2 py-1 rounded-full text-xs font-medium" style={getActionStyle(selectedLog.action)}>{selectedLog.action}</span></div>
                  <div><span className="text-sm" style={{ color: '#6c757d' }}>Entity:</span><p className="font-medium" style={{ color: '#1a237e' }}>{selectedLog.entity}</p></div>
                  <div><span className="text-sm" style={{ color: '#6c757d' }}>Entity ID:</span><p className="font-medium" style={{ color: '#1a237e' }}>{selectedLog.entity_id || '—'}</p></div>
                </div>
                <div><span className="text-sm" style={{ color: '#6c757d' }}>Details:</span><pre className="mt-2 p-4 rounded-lg text-sm overflow-x-auto" style={{ backgroundColor: '#f8f9fa', color: '#333' }}>{JSON.stringify(selectedLog.details, null, 2)}</pre></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
