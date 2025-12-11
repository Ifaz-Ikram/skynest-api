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
    if (branches.length > 0) {
      loadBoard(1);
    }
  }, [selectedBranch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadBoard(pagination.page);
    } catch (error) {
      console.error('Refresh failed:', error);
      setError('Failed to refresh data');
    }
  };

  const handleAutoUpdate = async () => {
    setRefreshing(true);
    try {
      const result = await api.updateRoomStatusesAutomatically();
      console.log('Auto-update result:', result);

      if (result.updatesCount > 0) {
        alert(`Successfully updated ${result.updatesCount} room statuses automatically!`);
      } else {
        alert('No room statuses needed updating.');
      }

      await loadBoard(pagination.page);
    } catch (error) {
      console.error('Auto-update failed:', error);
      alert('Failed to update room statuses automatically. Please try again.');
    }
  };

  const handleRoomStatusUpdate = async (roomId, newStatus, forceOverride = false) => {
    setUpdating(true);
    try {
      await api.updateRoomStatus(roomId, newStatus, forceOverride);
      await loadBoard(pagination.page);
      setEditingRoom(null);
      setError(null);

      if (forceOverride) {
        alert('Room status updated with emergency override. This action has been logged.');
      }
    } catch (err) {
      console.error('Room status update error:', err);

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

  const statusCounts = useMemo(() => {
    if (!board?.rooms) return { Available: 0, Occupied: 0, Maintenance: 0, Reserved: 0 };

    const counts = { Available: 0, Occupied: 0, Maintenance: 0, Reserved: 0 };
    board.rooms.forEach(room => {
      counts[room.room_status] = (counts[room.room_status] || 0) + 1;
    });
    return counts;
  }, [board]);

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

  if (error && !board) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: '#dc3545' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1a237e' }}>Error Loading Board</h2>
            <p className="mb-6" style={{ color: '#6c757d' }}>{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Housekeeping Board"
          description={`Room status management • ${board?.date || 'Today'}`}
          icon={Sparkles}
          stats={[
            { label: 'Available', value: statusCounts.Available },
            { label: 'Occupied', value: statusCounts.Occupied },
            { label: 'Maintenance', value: statusCounts.Maintenance },
            { label: 'Reserved', value: statusCounts.Reserved },
            { label: 'Total Rooms', value: board?.rooms?.length || 0 },
          ]}
          actions={[{
            label: 'Auto-Update Statuses',
            icon: Settings,
            onClick: handleAutoUpdate,
            disabled: refreshing,
          }]}
        />

        {/* Error Alert */}
        {error && (
          <div className="bg-white rounded-xl p-4 shadow-lg border-l-4" style={{ borderLeftColor: '#dc3545' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: '#dc3545' }} />
              <div>
                <p className="font-medium" style={{ color: '#dc3545' }}>{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" style={{ color: '#6c757d' }} />
              </button>
            </div>
          </div>
        )}

        {/* Branch Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: '#6c757d' }} />
              <span className="font-medium" style={{ color: '#1a237e' }}>Filter by Branch:</span>
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
                className="text-sm underline transition-colors"
                style={{ color: '#0d47a1' }}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatusCard
            label="Available"
            count={statusCounts.Available}
            icon={Bed}
            color="#28a745"
            bgColor="#d4edda"
            isActive={filterStatus === 'Available'}
            onClick={() => setFilterStatus('Available')}
          />
          <StatusCard
            label="Occupied"
            count={statusCounts.Occupied}
            icon={User}
            color="#0d6efd"
            bgColor="#cfe2ff"
            isActive={filterStatus === 'Occupied'}
            onClick={() => setFilterStatus('Occupied')}
          />
          <StatusCard
            label="Maintenance"
            count={statusCounts.Maintenance}
            icon={Wrench}
            color="#fd7e14"
            bgColor="#ffe5d0"
            isActive={filterStatus === 'Maintenance'}
            onClick={() => setFilterStatus('Maintenance')}
          />
          <StatusCard
            label="Reserved"
            count={statusCounts.Reserved}
            icon={Calendar}
            color="#6f42c1"
            bgColor="#e2d9f3"
            isActive={filterStatus === 'Reserved'}
            onClick={() => setFilterStatus('Reserved')}
          />
        </div>

        {/* All Rooms Button */}
        <div>
          <button
            onClick={() => setFilterStatus('All')}
            className="px-5 py-2.5 rounded-xl font-semibold transition-all"
            style={filterStatus === 'All' ? {
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)'
            } : {
              backgroundColor: 'white',
              color: '#1a237e',
              border: '2px solid #e9ecef'
            }}
          >
            Show All Rooms ({board?.rooms?.length || 0})
          </button>
        </div>

        {/* Business Rules Guide */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: '#0d6efd' }}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#e3f2fd' }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: '#0d6efd' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1a237e' }}>Housekeeping Status Change Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#d4edda', border: '1px solid #28a745' }}>
                  <div className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#155724' }}>
                    <span>✓</span> What Housekeeping CAN Do:
                  </div>
                  <ul className="space-y-1 text-sm" style={{ color: '#155724' }}>
                    <li>• Available → Maintenance (anytime)</li>
                    <li>• Maintenance → Available (anytime)</li>
                    <li>• Occupied → Maintenance (emergencies only)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#f8d7da', border: '1px solid #dc3545' }}>
                  <div className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#721c24' }}>
                    <span>✗</span> What Requires Booking System:
                  </div>
                  <ul className="space-y-1 text-sm" style={{ color: '#721c24' }}>
                    <li>• Setting to Reserved (use pre-booking)</li>
                    <li>• Setting to Occupied (use check-in)</li>
                    <li>• Changing rooms with active bookings</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', color: '#856404' }}>
                <strong>💡 Protection:</strong> Rooms with active bookings cannot be changed to Available/Maintenance.
                Complete checkout or cancel booking first. Admins can use emergency override if needed.
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
                  <Bed className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#1a237e' }}>Room Management</h2>
                  <p className="text-sm" style={{ color: '#6c757d' }}>Click buttons to change room status</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: '#6c757d' }}>Showing:</span>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={getFilterBadgeStyle(filterStatus)}
                >
                  {filterStatus === 'All' ? 'All Rooms' : filterStatus}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map((room) => (
                <RoomCard 
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
            
            {filteredRooms.length === 0 && (
              <div className="text-center py-12">
                <Bed className="w-16 h-16 mx-auto mb-4" style={{ color: '#dee2e6' }} />
                <p style={{ color: '#6c757d' }}>No rooms found with the selected filter.</p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {filteredRooms.length > 0 && pagination.totalPages > 1 && (
            <div className="border-t px-6 py-4" style={{ backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm" style={{ color: '#6c757d' }}>
                  Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{' '}
                  of <span className="font-semibold">{pagination.total}</span> rooms
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm" style={{ color: '#6c757d' }}>Per page:</label>
                  <SearchableDropdown
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
                    className="min-w-[120px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadBoard(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ 
                      backgroundColor: pagination.page === 1 ? '#e9ecef' : 'white',
                      color: '#1a237e',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    Previous
                  </button>

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
                          className="w-10 h-10 rounded-lg text-sm font-medium transition-all"
                          style={pagination.page === pageNum ? {
                            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(26, 35, 126, 0.3)'
                          } : {
                            backgroundColor: 'white',
                            color: '#1a237e',
                            border: '1px solid #dee2e6'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => loadBoard(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ 
                      backgroundColor: pagination.page === pagination.totalPages ? '#e9ecef' : 'white',
                      color: '#1a237e',
                      border: '1px solid #dee2e6'
                    }}
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

// Helper function for filter badge styling
function getFilterBadgeStyle(status) {
  const styles = {
    'All': { backgroundColor: '#e9ecef', color: '#495057' },
    'Available': { backgroundColor: '#d4edda', color: '#155724' },
    'Occupied': { backgroundColor: '#cfe2ff', color: '#084298' },
    'Maintenance': { backgroundColor: '#ffe5d0', color: '#984c0c' },
    'Reserved': { backgroundColor: '#e2d9f3', color: '#59359a' },
  };
  return styles[status] || styles['All'];
}

// Status Card Component
function StatusCard({ label, count, icon: Icon, color, bgColor, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-6 text-left transition-all hover:shadow-xl"
      style={{
        border: isActive ? `3px solid ${color}` : '3px solid transparent',
        boxShadow: isActive ? `0 0 0 3px ${bgColor}` : undefined
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: '#6c757d' }}>{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>{count}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: bgColor }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </button>
  );
}

// Room Card Component
function RoomCard({ room, isEditing, onEdit, onCancel, onStatusUpdate, updating }) {
  const [validTransitions, setValidTransitions] = useState(null);
  const [loadingTransitions, setLoadingTransitions] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setValidTransitions(null);
      loadValidTransitions();
    }
  }, [isEditing, room.room_status]);

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

  const getStatusStyle = (status) => {
    const styles = {
      'Available': { backgroundColor: '#d4edda', color: '#155724' },
      'Occupied': { backgroundColor: '#cfe2ff', color: '#084298' },
      'Maintenance': { backgroundColor: '#ffe5d0', color: '#984c0c' },
      'Reserved': { backgroundColor: '#e2d9f3', color: '#59359a' },
    };
    return styles[status] || { backgroundColor: '#e9ecef', color: '#495057' };
  };

  const getDerivedStyle = (derived) => {
    const styles = {
      'Available': { backgroundColor: '#e9ecef', color: '#495057' },
      'Arrival': { backgroundColor: '#cfe2ff', color: '#084298' },
      'Stayover': { backgroundColor: '#d4edda', color: '#155724' },
      'Due Out': { backgroundColor: '#fff3cd', color: '#856404' },
      'Dirty': { backgroundColor: '#f8d7da', color: '#721c24' },
      'OOO': { backgroundColor: '#e2d9f3', color: '#59359a' },
    };
    return styles[derived] || { backgroundColor: '#e9ecef', color: '#495057' };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all" style={{ border: '1px solid #e9ecef' }}>
      {/* Room Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4" style={{ color: '#6c757d' }} />
            <span className="text-xs" style={{ color: '#6c757d' }}>{room.branch_name}</span>
          </div>
          <h3 className="text-lg font-bold" style={{ color: '#1a237e' }}>Room {room.room_number}</h3>
          <p className="text-sm" style={{ color: '#6c757d' }}>{room.room_type} • Cap {room.capacity}</p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}
            title="Click to change room status"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            title="Cancel editing"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Guest Information & Booking Warning */}
      {room.booking && (
        <div className="mb-4">
          <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#856404' }} />
              <div className="text-xs" style={{ color: '#856404' }}>
                <span className="font-semibold">Booking Protected:</span> This room has an active booking.
                Status cannot be changed to Available/Maintenance.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: '#e3f2fd', border: '1px solid #0d6efd' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: '#0d47a1' }} />
              <span className="text-sm font-medium" style={{ color: '#0d47a1' }}>Guest Information</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#0d6efd' }}>Guest:</span>
                <span className="font-medium" style={{ color: '#1a237e' }}>{room.booking.guest_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#0d6efd' }}>Check-in:</span>
                <span style={{ color: '#495057' }}>{new Date(room.booking.check_in_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#0d6efd' }}>Check-out:</span>
                <span style={{ color: '#495057' }}>{new Date(room.booking.check_out_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#0d6efd' }}>Status:</span>
                <span className="font-semibold" style={{ color: '#1a237e' }}>{room.booking.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#6c757d' }}>Room Status:</span>
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={getStatusStyle(room.room_status)}
          >
            {room.room_status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#6c757d' }}>Housekeeping:</span>
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={getDerivedStyle(room.derived)}
          >
            {room.derived}
          </span>
        </div>
      </div>

      {/* Status Change Section */}
      {isEditing ? (
        <div className="space-y-3 pt-3 border-t" style={{ borderColor: '#e9ecef' }}>
          {loadingTransitions ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#0d47a1' }}></div>
              <span className="ml-2 text-sm" style={{ color: '#6c757d' }}>Loading options...</span>
            </div>
          ) : validTransitions ? (
            <div className="space-y-3">
              {/* Helper Text */}
              <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
                {room.room_status === 'Available' && (
                  <><CheckCircle2 className="w-3 h-3 inline mr-1" /><strong>Available:</strong> Can be set to Maintenance.</>
                )}
                {room.room_status === 'Maintenance' && (
                  <><Wrench className="w-3 h-3 inline mr-1" /><strong>Maintenance:</strong> Can only be set to Available.</>
                )}
                {room.room_status === 'Reserved' && (
                  <><Calendar className="w-3 h-3 inline mr-1" /><strong>Reserved:</strong> Controlled by booking system.</>
                )}
                {room.room_status === 'Occupied' && (
                  <><User className="w-3 h-3 inline mr-1" /><strong>Occupied:</strong> Can set to Maintenance for emergencies.</>
                )}
              </div>

              {/* Valid Transitions */}
              {validTransitions.validTransitions.length > 0 && (
                <>
                  <div className="text-xs font-medium" style={{ color: '#28a745' }}>✅ Available Changes:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {validTransitions.validTransitions.map((transition) => (
                      <button
                        key={transition.status}
                        onClick={() => handleStatusChange(transition.status)}
                        disabled={updating}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ 
                          backgroundColor: '#d4edda', 
                          color: '#155724', 
                          border: '1px solid #28a745' 
                        }}
                        title={transition.reason}
                      >
                        ✓ {transition.status}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {validTransitions.validTransitions.length === 0 && (
                <div className="text-xs italic p-2 rounded-lg" style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}>
                  No manual status changes allowed. Use booking system.
                </div>
              )}

              {/* Invalid Transitions */}
              {validTransitions.invalidTransitions.length > 0 && (
                <>
                  <div className="text-xs font-medium mt-3" style={{ color: '#dc3545' }}>❌ Blocked Changes:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {validTransitions.invalidTransitions.map((transition) => (
                      <div
                        key={transition.status}
                        className="px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
                        style={{ 
                          backgroundColor: '#f8d7da', 
                          color: '#721c24', 
                          border: '1px solid #dc3545' 
                        }}
                        title={transition.reason}
                      >
                        ✗ {transition.status}
                      </div>
                    ))}
                  </div>
                  
                  {/* Emergency Override */}
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: '#dc3545' }}>
                    <div className="text-xs font-medium mb-2" style={{ color: '#dc3545' }}>
                      🚨 Emergency Override (Admin Only):
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {validTransitions.invalidTransitions.map((transition) => (
                        <button
                          key={`force-${transition.status}`}
                          onClick={() => {
                            if (window.confirm(`⚠️ EMERGENCY OVERRIDE\n\nForce change to ${transition.status}?\n\nThis will bypass all business rules and be logged.\n\nContinue?`)) {
                              handleStatusChange(transition.status, true);
                            }
                          }}
                          disabled={updating}
                          className="px-3 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50"
                          style={{ backgroundColor: '#dc3545', border: '2px solid #b02a37' }}
                          title={`Emergency override: Force change to ${transition.status}`}
                        >
                          ⚡ Force {transition.status}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs mt-2 p-2 rounded-lg" style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>
                      ⚠️ Emergency override bypasses all rules and is permanently logged.
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm mb-2" style={{ color: '#6c757d' }}>Loading validation...</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 border-2 border-dashed rounded-lg" style={{ borderColor: '#dee2e6' }}>
          <div className="text-sm font-medium mb-1" style={{ color: '#6c757d' }}>
            Click edit to change status
          </div>
          <div className="text-xs" style={{ color: '#adb5bd' }}>
            <span style={{ color: '#28a745' }}>Green = allowed</span>, <span style={{ color: '#dc3545' }}>Red = blocked</span>
          </div>
        </div>
      )}
    </div>
  );
}
