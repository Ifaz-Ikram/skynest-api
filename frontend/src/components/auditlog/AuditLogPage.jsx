import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Filter, 
  Download, 
  Search, 
  Calendar, 
  User, 
  Eye, 
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
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
  
  // Filters state
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    entity: 'all',
    action: 'all',
    actor: '',
    search: ''
  });
  const entityOptions = useMemo(
    () => [
      { id: 'all', name: 'All Entities' },
      { id: 'booking', name: 'Booking' },
      { id: 'room', name: 'Room' },
      { id: 'payment', name: 'Payment' },
      { id: 'guest', name: 'Guest' },
      { id: 'service_usage', name: 'Service Usage' },
      { id: 'pre_booking', name: 'Pre-Booking' },
    ],
    [],
  );

  const actionOptions = useMemo(
    () => [
      { id: 'all', name: 'All Actions' },
      { id: 'CREATE', name: 'Create' },
      { id: 'UPDATE', name: 'Update' },
      { id: 'DELETE', name: 'Delete' },
      { id: 'INSERT', name: 'Insert' },
    ],
    [],
  );
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadStats();
    loadAuditLogs();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [pagination.page, filters]);

  const loadStats = async () => {
    try {
      const response = await api.getAuditLogStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load audit log stats:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getAuditLogs(filters, pagination.page, pagination.limit);
      
      setAuditLogs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setError(error.message);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      entity: 'all',
      action: 'all',
      actor: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      await api.exportAuditLogs(filters);
    } catch (error) {
      alert('Failed to export audit logs: ' + error.message);
    }
  };

  const handleViewDetails = async (logId) => {
    try {
      const response = await api.getAuditLogById(logId);
      setSelectedLog(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      alert('Failed to load audit log details: ' + error.message);
    }
  };

  const getActionColor = (action) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
      case 'INSERT':
        return <CheckCircle className="w-4 h-4" />;
      case 'UPDATE':
        return <RefreshCw className="w-4 h-4" />;
      case 'DELETE':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEntityIcon = (entity) => {
    switch (entity.toLowerCase()) {
      case 'booking':
        return '📅';
      case 'room':
        return '🏨';
      case 'payment':
        return '💳';
      case 'guest':
        return '👤';
      case 'service_usage':
        return '🔧';
      case 'pre_booking':
        return '📋';
      default:
        return '📄';
    }
  };

  const formatDetails = (details) => {
    if (!details) return 'No details';
    if (typeof details === 'string') return details;
    return JSON.stringify(details, null, 2);
  };

  const renderFilters = () => (
    <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary"
          >
            Clear All
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary"
          >
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Entity Type</label>
            <SearchableDropdown
              value={filters.entity}
              onChange={(value) => handleFilterChange('entity', value || 'all')}
              options={entityOptions}
              placeholder="All Entities"
              hideSearch
              clearable={false}
              buttonClassName="!w-full !px-3 !py-2 border border-border dark:border-slate-600 rounded-md focus-visible:!ring-blue-500 focus-visible:!ring-offset-0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Action Type</label>
            <SearchableDropdown
              value={filters.action}
              onChange={(value) => handleFilterChange('action', value || 'all')}
              options={actionOptions}
              placeholder="All Actions"
              hideSearch
              clearable={false}
              buttonClassName="!w-full !px-3 !py-2 border border-border dark:border-slate-600 rounded-md focus-visible:!ring-blue-500 focus-visible:!ring-offset-0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Actor</label>
            <input
              type="text"
              value={filters.actor}
              onChange={(e) => handleFilterChange('actor', e.target.value)}
              placeholder="Search by actor..."
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search entity ID or details..."
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderAuditLogTable = () => (
    <div className="bg-surface-secondary rounded-xl shadow-md border border-border">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Audit Logs</h3>
          <div className="flex space-x-2">
            <button
              onClick={loadAuditLogs}
              className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <LoadingSpinner message="Loading audit logs..." />
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary">No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-surface-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Entity ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-surface-tertiary">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-text-tertiary" />
                        {log.user?.username || log.actor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        <span className="ml-1">{log.action}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <div className="flex items-center">
                        <span className="mr-2">{getEntityIcon(log.entity)}</span>
                        {log.entity.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {log.entity_id || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary max-w-xs truncate">
                      {log.details ? (
                        <span className="text-text-secondary">
                          {typeof log.details === 'string' ? log.details : 'JSON data'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(log.audit_id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-border dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-tertiary"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-text-secondary">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-border dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-tertiary"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderDetailsModal = () => (
    showDetailsModal && selectedLog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-surface-secondary rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Audit Log Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-text-tertiary hover:text-text-secondary"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-text-primary mb-3">Basic Information</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary">ID</dt>
                    <dd className="text-sm text-text-primary">{selectedLog.audit_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary">Timestamp</dt>
                    <dd className="text-sm text-text-primary">{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary">Actor</dt>
                    <dd className="text-sm text-text-primary">{selectedLog.user?.username || selectedLog.actor}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary">Action</dt>
                    <dd className="text-sm text-text-primary">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                        {getActionIcon(selectedLog.action)}
                        <span className="ml-1">{selectedLog.action}</span>
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary">Entity</dt>
                    <dd className="text-sm text-text-primary">
                      <div className="flex items-center">
                        <span className="mr-2">{getEntityIcon(selectedLog.entity)}</span>
                        {selectedLog.entity.replace('_', ' ')}
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-text-tertiary">Entity ID</dt>
                    <dd className="text-sm text-text-primary">{selectedLog.entity_id || '—'}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="font-medium text-text-primary mb-3">Entity Information</h4>
                {selectedLog.entity_info ? (
                  <dl className="space-y-2">
                    {Object.entries(selectedLog.entity_info).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-text-tertiary">{key.replace('_', ' ')}</dt>
                        <dd className="text-sm text-text-primary">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-text-tertiary">No entity information available</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-text-primary mb-3">Details</h4>
              <div className="bg-surface-tertiary rounded-lg p-4">
                <pre className="text-sm text-text-primary whitespace-pre-wrap overflow-x-auto">
                  {formatDetails(selectedLog.details)}
                </pre>
              </div>
            </div>
            
            {selectedLog.relatedLogs && selectedLog.relatedLogs.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-text-primary mb-3">Related Activity</h4>
                <div className="space-y-2">
                  {selectedLog.relatedLogs.map((log) => (
                    <div key={log.audit_id} className="flex items-center justify-between p-3 bg-surface-tertiary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          <span className="ml-1">{log.action}</span>
                        </span>
                        <span className="text-sm text-text-secondary">{log.user?.username || log.actor}</span>
                      </div>
                      <span className="text-sm text-text-tertiary">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Audit Log"
          description="System activity and security audit trail"
          icon={FileText}
          stats={[
            { 
              label: 'Total Events', 
              value: stats?.totalEvents?.toLocaleString() || '—', 
              trend: 'All time' 
            },
            { 
              label: 'Today', 
              value: stats?.todayEvents?.toLocaleString() || '—', 
              trend: 'Last 24 hours' 
            },
            { 
              label: 'Critical', 
              value: stats?.criticalEvents?.toLocaleString() || '—', 
              trend: 'Delete operations' 
            },
          ]}
        />

        {renderFilters()}
        {renderAuditLogTable()}
        {renderDetailsModal()}
      </div>
    </div>
  );
};

export default AuditLogPage;
