import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { 
  Bed, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  RefreshCw,
  Settings,
  Eye,
  Edit3,
  X,
  Calendar,
  User,
  Users,
  MapPin,
  Home,
  Sparkles,
  Building2
} from 'lucide-react';
import { LuxuryPageHeader, LoadingSpinner, SearchableDropdown } from '../common';

const statusColors = {
  Arrival: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800'
  },
  Stayover: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  'Due Out': { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    border: 'border-amber-200',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800'
  },
  Dirty: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-700', 
    border: 'border-rose-200',
    icon: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-800'
  },
  Available: { 
    bg: 'bg-surface-tertiary dark:bg-slate-700/30', 
    text: 'text-gray-700', 
    border: 'border-border',
    icon: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-800'
  },
  OOO: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    border: 'border-purple-200',
    icon: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-800'
  },
};

export default function HousekeepingPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  // Branch filtering state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });

  const loadBoard = async (page = 1, filters = {}) => {
    try {
      setError(null);
      const params = {
        page,
        limit: filters.limit || pagination.limit
      };
      if (selectedBranch) {
        params.branch_id = selectedBranch;
      }
      const data = await api.getHousekeepingBoard(params);

      // Handle paginated response
      const roomsList = data?.rooms || data || [];
      const total = data?.pagination?.total || data?.total || roomsList.length;
      const totalPages = data?.pagination?.totalPages || Math.ceil(total / (filters.limit || pagination.limit));

      setBoard({ ...data, rooms: roomsList });
      setPagination(prev => ({
        ...prev,
        page,
        total,
        totalPages
      }));
    } catch (e) {
      setError(e.message || 'Failed to load housekeeping board');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      const branchList = Array.isArray(branchesData) ? branchesData : branchesData?.branches || [];
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  useEffect(() => {
    loadBranches();
    loadBoard();
  }, []);

  useEffect(() => {
    // Reload board when branch filter changes (reset to page 1)
    if (branches.length > 0) {
      loadBoard(1);
    }
  }, [selectedBranch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload current page with current filters
      await loadBoard(pagination.page);
    } catch (error) {
      console.error('Refresh failed:', error);
      setError('Failed to refresh data');
    }
    // Note: setRefreshing(false) is called in loadBoard's finally block
  };

  const handleAutoUpdate = async () => {
    setRefreshing(true);
    try {
      const result = await api.updateRoomStatusesAutomatically();
      console.log('Auto-update result:', result);

      // Show success message
      if (result.updatesCount > 0) {
        alert(`Successfully updated ${result.updatesCount} room statuses automatically!`);
      } else {
        alert('No room statuses needed updating.');
      }

      // Refresh the board to show updated statuses (preserve current page)
      await loadBoard(pagination.page);
    } catch (error) {
      console.error('Auto-update failed:', error);
      alert('Failed to update room statuses automatically. Please try again.');
    }
    // Note: setRefreshing(false) is called in loadBoard's finally block
  };

  const handleRoomStatusUpdate = async (roomId, newStatus, forceOverride = false) => {
    setUpdating(true);
    try {
      await api.updateRoomStatus(roomId, newStatus, forceOverride);
      // Refresh the board while preserving current page and filters
      await loadBoard(pagination.page);
      setEditingRoom(null);
      setError(null); // Clear any previous errors

      if (forceOverride) {
        alert('Room status updated with emergency override. This action has been logged.');
      }
    } catch (err) {
      console.error('Room status update error:', err);

      // Enhanced error handling with business logic explanations
      if (err.message.includes('Status transition not allowed')) {
        const errorData = err.response?.data;
        if (errorData?.reason) {
          setError(`❌ ${errorData.reason}${errorData.suggestion ? `\n\n💡 ${errorData.suggestion}` : ''}`);
        } else {
          setError('❌ This status change is not allowed by business rules.');
        }
      } else if (err.message.includes('401') || err.message.includes('403')) {
        if (err.message.includes('Emergency override requires Admin role')) {
          setError('❌ Emergency override requires Admin role. Only Admins can force status changes.');
        } else {
          setError('❌ Authentication required. Please log in with Admin, Manager, Receptionist, or Accountant role.');
        }
      } else if (err.message.includes('404')) {
        setError('❌ Room not found or API endpoint not available.');
      } else {
        setError(`❌ ${err.message || 'Failed to update room status'}`);
      }
    } finally {
      setUpdating(false);
    }
  };

  // Simple room status counts
  const statusCounts = useMemo(() => {
    if (!board?.rooms) return { Available: 0, Occupied: 0, Maintenance: 0, Reserved: 0 };

    const counts = { Available: 0, Occupied: 0, Maintenance: 0, Reserved: 0 };
    board.rooms.forEach(room => {
      counts[room.room_status] = (counts[room.room_status] || 0) + 1;
    });
    return counts;
  }, [board]);

  // Filter rooms by status
  const filteredRooms = useMemo(() => {
    if (!board?.rooms) return [];
    if (filterStatus === 'All') return board.rooms;
    return board.rooms.filter(room => room.room_status === filterStatus);
  }, [board, filterStatus]);

  const branchOptions = useMemo(
    () => [
      { id: '', name: 'All Branches' },
      ...branches.map((branch) => ({
        id: String(branch.branch_id ?? branch.id ?? ''),
        name: branch.branch_name ?? branch.name ?? 'Branch',
      })),
    ],
    [branches],
  );

  const pageSizeOptions = useMemo(
    () => [
      { id: '25', name: '25 per page' },
      { id: '50', name: '50 per page' },
      { id: '100', name: '100 per page' },
    ],
    [],
  );

  if (loading) {
    return <LoadingSpinner size="xl" message="Loading housekeeping board..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-tertiary flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Board</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Housekeeping Board"
          description={`Room status management • ${board?.date || 'Today'}`}
          icon={Sparkles}
          stats={[
            { label: 'Available', value: statusCounts.Available, trend: 'Ready' },
            { label: 'Occupied', value: statusCounts.Occupied, trend: 'In use' },
            { label: 'Maintenance', value: statusCounts.Maintenance, trend: 'Out of order' },
            { label: 'Reserved', value: statusCounts.Reserved, trend: 'Pre-booked' },
            { label: 'Total Rooms', value: board?.rooms?.length || 0, trend: 'All statuses' },
          ]}
          actions={[{
            label: 'Refresh',
            icon: RefreshCw,
            onClick: handleRefresh,
            disabled: refreshing,
          }, {
            label: 'Auto-Update Statuses',
            icon: Settings,
            onClick: handleAutoUpdate,
            disabled: refreshing,
          }]}
        />

        {/* Branch Filter */}
        <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-text-secondary" />
              <span className="font-medium text-text-secondary">Filter by Branch:</span>
            </div>
            <SearchableDropdown
              value={selectedBranch}
              onChange={(value) => setSelectedBranch(value || '')}
              options={branchOptions}
              placeholder="All Branches"
              className="min-w-[200px]"
            />
            {selectedBranch && (
              <button
                onClick={() => setSelectedBranch('')}
                className="text-sm text-text-tertiary hover:text-text-secondary underline"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Status Summary Cards - Clickable Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setFilterStatus('Available')}
            className={`bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition-all duration-200 ${
              filterStatus === 'Available' 
                ? 'border-green-400 ring-2 ring-green-200 shadow-lg' 
                : 'border-green-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Available</p>
                <p className="text-2xl font-bold text-green-700">{statusCounts.Available}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Bed className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setFilterStatus('Occupied')}
            className={`bg-blue-50 border rounded-xl p-4 hover:shadow-md transition-all duration-200 ${
              filterStatus === 'Occupied' 
                ? 'border-blue-400 ring-2 ring-blue-200 shadow-lg' 
                : 'border-blue-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Occupied</p>
                <p className="text-2xl font-bold text-blue-700">{statusCounts.Occupied}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setFilterStatus('Maintenance')}
            className={`bg-orange-50 border rounded-xl p-4 hover:shadow-md transition-all duration-200 ${
              filterStatus === 'Maintenance' 
                ? 'border-orange-400 ring-2 ring-orange-200 shadow-lg' 
                : 'border-orange-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Maintenance</p>
                <p className="text-2xl font-bold text-orange-700">{statusCounts.Maintenance}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </button>

          {/* Reserved Filter Button */}
          <button
            onClick={() => setFilterStatus('Reserved')}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
              filterStatus === 'Reserved' 
                ? 'border-purple-300 bg-purple-50' 
                : 'border-border hover:border-purple-200 hover:bg-purple-25'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-left">
                <p className="text-sm font-medium text-purple-700">Reserved</p>
                <p className="text-2xl font-bold text-purple-700">{statusCounts.Reserved}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </button>
        </div>

        {/* All Rooms Button */}
        <div className="mb-6">
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              filterStatus === 'All'
                ? 'bg-luxury-gold text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Show All Rooms ({board?.rooms?.length || 0})
          </button>
        </div>

        {/* Business Rules Guide */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Housekeeping Status Change Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <div className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <span className="text-green-600">✓</span> What Housekeeping CAN Do:
                  </div>
                  <ul className="space-y-1 text-text-secondary">
                    <li>• Available → Maintenance (anytime)</li>
                    <li>• Maintenance → Available (anytime)</li>
                    <li>• Occupied → Maintenance (emergencies only)</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-200">
                  <div className="font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <span className="text-red-600">✗</span> What Requires Booking System:
                  </div>
                  <ul className="space-y-1 text-text-secondary">
                    <li>• Setting to Reserved (use pre-booking)</li>
                    <li>• Setting to Occupied (use check-in)</li>
                    <li>• Changing rooms with active bookings</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                <strong>💡 Protection:</strong> Rooms with active bookings cannot be changed to Available/Maintenance.
                Complete checkout or cancel booking first. Admins can use emergency override if needed.
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Rooms */}
        <div className="bg-surface-secondary rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="bg-surface-tertiary px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-luxury-gold">
                  <Bed className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Room Management</h2>
                  <p className="text-sm text-text-secondary">Click buttons to change room status</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-text-secondary">Currently showing:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'All' ? 'bg-gray-100 text-gray-800' :
                  filterStatus === 'Available' ? 'bg-green-100 text-green-800' :
                  filterStatus === 'Occupied' ? 'bg-blue-100 text-blue-800' :
                  filterStatus === 'Maintenance' ? 'bg-orange-100 text-orange-800' :
                  filterStatus === 'Reserved' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {filterStatus === 'All' ? 'All Rooms' : filterStatus}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map((room) => (
                <SimpleRoomCard 
                  key={room.room_id} 
                  room={room} 
                  isEditing={editingRoom === room.room_id}
                  onEdit={() => setEditingRoom(room.room_id)}
                  onCancel={() => setEditingRoom(null)}
                  onStatusUpdate={handleRoomStatusUpdate}
                  updating={updating}
                />
              ))}
            </div>
          </div>
          
          {/* Pagination Controls */}
          {filteredRooms.length > 0 && pagination.totalPages > 1 && (
            <div className="border-t border-border bg-white px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Result Count */}
                <div className="text-sm text-text-secondary">
                  Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-semibold">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-semibold">{pagination.total}</span> rooms
                </div>

                {/* Items Per Page Selector */}
                <div className="flex items-center gap-2">
                  <label htmlFor="limit" className="text-sm text-text-secondary">
                    Items per page:
                  </label>
                  <SearchableDropdown
                    id="limit"
                    value={String(pagination.limit)}
                    onChange={(value) => {
                      const newLimit = Number(value);
                      const resolvedLimit = Number.isNaN(newLimit) ? pagination.limit : newLimit;
                      setPagination(prev => ({ ...prev, limit: resolvedLimit }));
                      loadBoard(1, { limit: resolvedLimit });
                    }}
                    options={pageSizeOptions}
                    hideSearch
                    clearable={false}
                    className="min-w-[140px]"
                    buttonClassName="!border border-border dark:border-slate-600 !px-3 !py-1 text-sm focus-visible:!ring-luxury-gold focus-visible:!ring-offset-0"
                  />
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadBoard(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-border dark:border-slate-600 text-gray-700 hover:bg-surface-tertiary dark:bg-slate-700/30'
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 4) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 3) {
                        pageNum = pagination.totalPages - 6 + i;
                      } else {
                        pageNum = pagination.page - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => loadBoard(pageNum)}
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${
                            pagination.page === pageNum
                              ? 'bg-luxury-gold text-white shadow-md transform scale-105'
                              : 'bg-white border border-border dark:border-slate-600 text-gray-700 hover:bg-surface-tertiary dark:bg-slate-700/30 hover:border-luxury-gold'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => loadBoard(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-border dark:border-slate-600 text-gray-700 hover:bg-surface-tertiary dark:bg-slate-700/30'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleRoomCard({ room, isEditing, onEdit, onCancel, onStatusUpdate, updating }) {
  const [validTransitions, setValidTransitions] = useState(null);
  const [loadingTransitions, setLoadingTransitions] = useState(false);

  // Load valid transitions when editing starts OR when room status changes
  useEffect(() => {
    if (isEditing) {
      // Always reload when editing starts to get fresh data
      setValidTransitions(null); // Clear old data first
      loadValidTransitions();
    }
  }, [isEditing, room.room_status]); // Re-run when room status changes

  const loadValidTransitions = async () => {
    setLoadingTransitions(true);
    try {
      const data = await api.getValidStatusTransitions(room.room_id);
      setValidTransitions(data);
    } catch (error) {
      console.error('Failed to load valid transitions:', error);
    } finally {
      setLoadingTransitions(false);
    }
  };

  const handleStatusChange = async (newStatus, forceOverride = false) => {
    if (newStatus !== room.room_status) {
      await onStatusUpdate(room.room_id, newStatus, forceOverride);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-orange-100 text-orange-800';
      case 'Reserved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDerivedColor = (derived) => {
    switch (derived) {
      case 'Available': return 'bg-gray-100 text-gray-800';
      case 'Arrival': return 'bg-blue-100 text-blue-800';
      case 'Stayover': return 'bg-green-100 text-green-800';
      case 'Due Out': return 'bg-yellow-100 text-yellow-800';
      case 'Dirty': return 'bg-red-100 text-red-800';
      case 'OOO': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-surface-secondary border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200">
      {/* Room Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <MapPin className="w-4 h-4 text-text-tertiary" />
            <span className="text-xs text-text-secondary">{room.branch_name}</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Room {room.room_number}</h3>
          <p className="text-sm text-text-secondary">{room.room_type} • Cap {room.capacity}</p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="p-2 bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold/20 rounded-lg transition-all duration-200 hover:scale-105"
            title="Click to change room status"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
            title="Cancel editing"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Guest Information & Booking Protection Warning */}
      {room.booking && (
        <div className="mb-3">
          {/* Booking Protection Alert */}
          <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Booking Protected:</span> This room has an active booking.
                Status cannot be changed to Available/Maintenance. Cancel booking first or complete checkout.
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Guest Information</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Guest:</span>
                <span className="text-blue-900">{room.booking.guest_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Check-in:</span>
                <span className="text-blue-900">{new Date(room.booking.check_in_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Check-out:</span>
                <span className="text-blue-900">{new Date(room.booking.check_out_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Booking Status:</span>
                <span className="text-blue-900 font-semibold">{room.booking.status}</span>
              </div>
              {room.booking.special_requests && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="text-blue-700 font-medium">Special Requests:</span>
                  <p className="text-blue-900 text-xs mt-1">{room.booking.special_requests}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">Room Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.room_status)}`}>
            {room.room_status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">Housekeeping:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDerivedColor(room.derived)}`}>
            {room.derived}
          </span>
        </div>
      </div>

      {/* Status Change Buttons */}
      {isEditing ? (
        <div className="space-y-2">
          {loadingTransitions ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-luxury-gold"></div>
              <span className="ml-2 text-sm text-text-secondary">Loading status options...</span>
            </div>
          ) : validTransitions ? (
            <div className="space-y-2">
              {/* Helper Text Based on Current Status */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs text-blue-800">
                  {room.room_status === 'Available' && (
                    <>
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      <strong>Available Room:</strong> Can be set to Maintenance. Reserved/Occupied status is set through booking/check-in process.
                    </>
                  )}
                  {room.room_status === 'Maintenance' && (
                    <>
                      <Wrench className="w-3 h-3 inline mr-1" />
                      <strong>Maintenance Room:</strong> Can only be set to Available. Cannot be booked until maintenance complete.
                    </>
                  )}
                  {room.room_status === 'Reserved' && (
                    <>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      <strong>Reserved Room:</strong> Controlled by booking system. Cancel booking or use check-in process.
                    </>
                  )}
                  {room.room_status === 'Occupied' && (
                    <>
                      <User className="w-3 h-3 inline mr-1" />
                      <strong>Occupied Room:</strong> Guest is checked in. Can set to Maintenance for emergencies (guest will be relocated). Use checkout process to make Available.
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs font-medium text-text-secondary mb-2">✅ Available Status Changes:</div>
              {validTransitions.validTransitions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {validTransitions.validTransitions.map((transition) => (
                    <button
                      key={transition.status}
                      onClick={() => handleStatusChange(transition.status)}
                      disabled={updating}
                      className="px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-green-300"
                      title={transition.reason}
                    >
                      ✓ {transition.status}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-text-secondary italic p-2 bg-surface-tertiary rounded">
                  No manual status changes allowed. Use booking system to change this room's status.
                </div>
              )}

              {validTransitions.invalidTransitions.length > 0 && (
                <>
                  <div className="text-xs font-medium text-red-700 mb-2 mt-3">❌ Blocked Status Changes:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {validTransitions.invalidTransitions.map((transition) => (
                      <div
                        key={transition.status}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-md cursor-not-allowed text-sm font-medium opacity-75 border border-red-200"
                        title={transition.reason}
                      >
                        ✗ {transition.status}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-text-secondary mt-2 p-2 bg-surface-tertiary rounded border border-border">
                    💡 <strong>Why blocked?</strong> Hover over buttons to see reason. Use booking/check-in/checkout processes instead.
                  </div>
                </>
              )}

              {/* Emergency Override Section */}
              {validTransitions.invalidTransitions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-300">
                  <div className="text-xs font-medium text-red-700 mb-2">
                    🚨 Emergency Override (Admin Only):
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {validTransitions.invalidTransitions.map((transition) => (
                      <button
                        key={`force-${transition.status}`}
                        onClick={() => {
                          if (window.confirm(`⚠️ EMERGENCY OVERRIDE\n\nForce change to ${transition.status}?\n\nThis will:\n- Bypass all business rules\n- Be logged to audit trail\n- Require Admin privileges\n\nReason: ${transition.reason}\n\nContinue?`)) {
                            handleStatusChange(transition.status, true);
                          }
                        }}
                        disabled={updating}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold border-2 border-red-800 shadow-md"
                        title={`Emergency override: Force change to ${transition.status} (Admin only)`}
                      >
                        ⚡ Force {transition.status}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-red-700 mt-2 p-2 bg-red-50 rounded border border-red-300">
                    ⚠️ <strong>Warning:</strong> Emergency override bypasses all business rules and is permanently logged to audit trail. Only use in genuine emergencies.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm text-text-tertiary mb-2">
                Loading smart validation...
              </div>
              <div className="text-xs text-text-tertiary">
                Please wait while we check business rules
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 border-2 border-dashed border-border dark:border-slate-600 rounded-lg">
          <div className="text-sm text-text-secondary mb-2 font-medium">
            Click the edit icon above to change room status
          </div>
          <div className="text-xs text-text-tertiary max-w-xs mx-auto">
            Smart validation ensures proper business rules. Green = allowed, Red = blocked (use booking system).
          </div>
        </div>
      )}
    </div>
  );
}
