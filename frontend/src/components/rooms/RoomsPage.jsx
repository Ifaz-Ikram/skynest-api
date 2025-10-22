import { useState, useEffect } from 'react';
import { Bed, Building2, CheckCircle, DoorOpen, TrendingUp, Plus, X, Edit, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

export const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [freeRooms, setFreeRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'available'

  // Branch filtering state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Room type filtering state
  const [selectedRoomType, setSelectedRoomType] = useState('');

  // Room search state
  const [selectedRoom, setSelectedRoom] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [hasMoreRooms, setHasMoreRooms] = useState(true);

  useEffect(() => {
    loadBranches();
    loadRooms();
    loadRoomTypes();
  }, []);

  useEffect(() => {
    // Reload rooms when branch or room type filter changes
    if (branches.length > 0) {
      loadRooms();
    }
  }, [selectedBranch, selectedRoomType]);

  const loadBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const types = await api.getRoomTypes();
      setRoomTypes(Array.isArray(types) ? types : types?.roomTypes || []);
    } catch (e) {
      console.error('Failed to load room types', e);
    }
  };

  const loadRooms = async (page = 1, append = false) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: pagination.limit
      };
      
      // Add branch filter if selected
      if (selectedBranch) {
        params.branch_id = selectedBranch;
      }
      
      // Add room type filter if selected
      if (selectedRoomType) {
        params.room_type_id = selectedRoomType;
      }
      
      // Get all rooms (including occupied and maintenance)
      const data = await api.getAllRooms(params);
      
      // Handle API response structure
      const roomsList = Array.isArray(data.rooms) ? data.rooms : Array.isArray(data) ? data : [];
      
      if (append) {
        setAllRooms(prev => [...prev, ...roomsList]);
      } else {
        setAllRooms(roomsList);
      }
      
      // Filter available rooms from the total rooms list
      const availableRooms = roomsList.filter(room => room.status === 'Available');
      
      setRooms(roomsList);
      setFreeRooms(availableRooms);
      
      // Update pagination info if available
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          page: data.pagination.page || page,
          total: data.pagination.total || roomsList.length,
          totalPages: data.pagination.totalPages || 1
        }));
        setHasMoreRooms((data.pagination.page || page) < (data.pagination.totalPages || 1));
      } else {
        // Fallback for simple array response
        setHasMoreRooms(roomsList.length >= pagination.limit);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayRooms = Array.isArray(viewMode === 'available' ? freeRooms : rooms) 
    ? (viewMode === 'available' ? freeRooms : rooms) 
    : [];

  // Filter rooms by selected room
  const filteredRooms = selectedRoom 
    ? displayRooms.filter(room => room.room_id === Number(selectedRoom))
    : displayRooms;

  // Calculate stats for header
  const availableRooms = rooms.filter(r => r.status === 'Available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance').length;
  const reservedRooms = rooms.filter(r => r.status === 'Reserved').length;
  const occupancyRate = rooms.length > 0 ? ((occupiedRooms / rooms.length) * 100).toFixed(1) : 0;

  const headerStats = [
    { label: 'Total Rooms', value: rooms.length },
    { label: 'Available', value: availableRooms },
    { label: 'Occupied', value: occupiedRooms },
    { label: 'Maintenance', value: maintenanceRooms },
    { label: 'Reserved', value: reservedRooms },
    { label: 'Occupancy Rate', value: `${occupancyRate}%` }
  ];

  const handleEdit = (room) => {
    setEditingRoom(room);
    setShowEditModal(true);
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteRoom(roomId);
      alert('Room deleted successfully!');
      loadRooms(pagination.page);
    } catch (error) {
      alert('Failed to delete room: ' + error.message);
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <LoadingSpinner 
        icon={Bed}
        message="Loading rooms..."
        submessage="Fetching room inventory"
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-tertiary dark:bg-slate-700/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Room Inventory"
          description="Manage hotel room availability and status"
          icon={Bed}
          stats={headerStats}
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-xl font-medium transition-all bg-surface-secondary text-slate-300 dark:text-slate-200 border-2 border-border dark:border-slate-700 hover:border-blue-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Room
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  viewMode === 'all' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-slate-800 dark:bg-slate-800 text-slate-100 dark:text-slate-200 border-2 border-border dark:border-slate-700 hover:border-blue-600'
                }`}
              >
                All ({rooms.length})
              </button>
              <button
                onClick={() => setViewMode('available')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  viewMode === 'available' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                    : 'bg-slate-800 dark:bg-slate-800 text-slate-100 dark:text-slate-200 border-2 border-border dark:border-slate-700 hover:border-green-600'
                }`}
              >
                Available ({freeRooms.length})
              </button>
            </div>
          }
        />

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50" style={{minWidth: '600px'}}>
            <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex justify-between items-center" style={{ zIndex: 'var(--z-sticky)' }}>
              <h2 className="text-2xl font-display font-bold text-white">Add New Room</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-300 dark:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <CreateRoomForm
              branches={branches}
              roomTypes={roomTypes}
              loading={createLoading}
              onCancel={() => setShowCreateModal(false)}
              onCreated={async () => {
                setShowCreateModal(false);
                await loadRooms(pagination.page);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && editingRoom && (
        <EditRoomModal
          room={editingRoom}
          branches={branches}
          roomTypes={roomTypes}
          onClose={() => {
            setShowEditModal(false);
            setEditingRoom(null);
          }}
          onSuccess={async () => {
            setShowEditModal(false);
            setEditingRoom(null);
            await loadRooms(pagination.page);
          }}
        />
      )}

      {/* Branch Filter - Second Priority */}
      <div className="card relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-300 dark:text-slate-300" />
            <span className="font-medium text-slate-300 dark:text-slate-200">Filter by Branch:</span>
          </div>
          <SearchableDropdown
            options={branches}
            value={selectedBranch}
            onChange={setSelectedBranch}
            placeholder="All Branches"
            searchPlaceholder="Search branches..."
            displayKey="branch_name"
            valueKey="branch_id"
            searchKeys={['branch_name', 'branch_code']}
            renderOption={(branch) => branch.branch_name}
            className="min-w-[200px]"
          />
          {selectedBranch && (
            <button
              onClick={() => setSelectedBranch('')}
              className="text-sm text-slate-400 dark:text-slate-400 hover:text-slate-300 dark:text-slate-200 underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Room Type Filter - Third Priority */}
      <div className="card relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-300 dark:text-slate-300" />
            <span className="font-medium text-slate-300 dark:text-slate-200">Filter by Room Type:</span>
          </div>
          <SearchableDropdown
            options={[
              { room_type_id: '', name: 'All Room Types' },
              ...roomTypes
            ]}
            value={selectedRoomType}
            onChange={setSelectedRoomType}
            placeholder="All Room Types"
            searchPlaceholder="Search room types..."
            displayKey="name"
            valueKey="room_type_id"
            searchKeys={['name']}
            renderOption={(roomType) => `${roomType.name} - Rs.${parseFloat(roomType.daily_rate || 0).toFixed(2)}/night`}
            className="min-w-[250px]"
          />
          {selectedRoomType && (
            <button
              onClick={() => setSelectedRoomType('')}
              className="text-sm text-slate-400 dark:text-slate-400 hover:text-slate-300 dark:text-slate-200 underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Room Search Filter - Fourth Priority */}
      <div className="card relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-slate-300 dark:text-slate-300" />
            <span className="font-medium text-slate-300 dark:text-slate-200">Search Room:</span>
          </div>
          <SearchableDropdown
            options={displayRooms.map(room => ({
              room_id: room.room_id,
              room_number: room.room_number,
              room_type: room.room_type_name,
              status: room.status,
              display_text: `Room ${room.room_number} - ${room.room_type_name} (${room.status})`
            }))}
            value={selectedRoom}
            onChange={setSelectedRoom}
            placeholder="All Rooms"
            searchPlaceholder="Search rooms..."
            displayKey="display_text"
            valueKey="room_id"
            searchKeys={['room_number', 'room_type', 'status']}
            renderOption={(room) => room.display_text}
            className="min-w-[300px]"
          />
          {selectedRoom && (
            <button
              onClick={() => setSelectedRoom('')}
              className="text-sm text-slate-400 dark:text-slate-400 hover:text-slate-300 dark:text-slate-200 underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* View Mode - Lower Priority */}
      <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border dark:border-slate-700/80 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300 dark:text-slate-200">View Mode:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'all' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                  : 'bg-slate-800 dark:bg-slate-800 text-slate-100 dark:text-slate-200 border hover:border-blue-600'
              }`}
            >
              All Rooms ({rooms.length})
            </button>
            <button
              onClick={() => setViewMode('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'available' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                  : 'bg-slate-800 dark:bg-slate-800 text-slate-100 dark:text-slate-200 border hover:border-green-600'
              }`}
            >
              Available ({freeRooms.length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="card h-48 skeleton"></div>
          ))
        ) : filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Bed className="w-16 h-16 text-slate-500 dark:text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 dark:text-slate-300">No rooms found</p>
          </div>
        ) : (
          filteredRooms.map(room => (
            <div key={room.room_id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white dark:text-slate-100">Room {room.room_number}</h3>
                  <p className="text-sm text-slate-300 dark:text-slate-300">{room.room_type_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room.status === 'Available' ? 'bg-green-800/30 text-green-200 dark:bg-green-900/30 dark:text-green-300 dark:bg-green-900/20 dark:bg-green-900/200/100/20 dark:text-green-300' :
                  room.status === 'Occupied' ? 'bg-red-800/30 text-red-200 dark:bg-red-900/30 dark:text-red-300 dark:bg-red-900/20 dark:bg-red-900/200/100/20 dark:text-red-300' :
                  room.status === 'Maintenance' ? 'bg-yellow-800/30 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:bg-yellow-900/20 dark:bg-yellow-900/200/100/20 dark:text-yellow-300' :
                  room.status === 'Reserved' ? 'bg-blue-800/30 text-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:bg-blue-900/20 dark:bg-blue-900/200/100/20 dark:text-blue-300' :
                  'bg-slate-800 text-slate-100 dark:bg-slate-600/30 dark:text-slate-200 dark:text-slate-200'
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300 dark:text-slate-300">Room Type:</span>
                  <span className="font-medium text-white dark:text-slate-100">{room.room_type_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 dark:text-slate-300">Branch:</span>
                  <span className="font-medium text-white dark:text-slate-100">{room.branch_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 dark:text-slate-300">Price per Night:</span>
                  <span className="font-bold text-luxury-gold">Rs {room.daily_rate ? parseFloat(room.daily_rate).toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 dark:text-slate-300">Max Occupancy:</span>
                  <span className="font-medium text-white dark:text-slate-100">{room.capacity || 'N/A'} guests</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-border dark:border-slate-700">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="text-blue-600 dark:text-blue-300 hover:text-blue-900 p-2 rounded hover:bg-blue-900/20 dark:bg-blue-900/200/10"
                    title="Edit Room"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.room_id)}
                    className="text-red-600 dark:text-red-300 hover:text-red-900 p-2 rounded hover:bg-red-900/20 dark:bg-red-900/200/10"
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMoreRooms && displayRooms.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadRooms((pagination.page || 1) + 1, true)}
            disabled={loading}
            className="btn-primary px-6 py-2"
          >
            {loading ? 'Loading...' : `Load More Rooms (${allRooms.length} loaded)`}
          </button>
          <p className="text-sm text-slate-300 dark:text-slate-300 mt-2">
            Load more rooms for better inventory overview
          </p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && displayRooms.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-slate-300 dark:text-slate-200">
            Showing {displayRooms.length} {viewMode === 'available' ? 'available' : ''} rooms from {allRooms.length} loaded rooms
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadRooms((pagination.page || 1) - 1)}
              disabled={(pagination.page || 1) <= 1}
              className="px-3 py-2 text-sm border border-border dark:border-slate-600 dark:border-slate-600 rounded-md hover:bg-surface-tertiary dark:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => {
                const pageNum = Math.max(1, Math.min((pagination.totalPages || 1) - 4, (pagination.page || 1) - 2)) + i;
                if (pageNum > (pagination.totalPages || 1)) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => loadRooms(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      pageNum === (pagination.page || 1)
                        ? 'bg-luxury-gold text-white border-luxury-gold'
                        : 'border-border dark:border-slate-600 dark:border-slate-600 hover:bg-slate-900 dark:bg-slate-700/30'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => loadRooms((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
              className="px-3 py-2 text-sm border border-border dark:border-slate-600 dark:border-slate-600 rounded-md hover:bg-surface-tertiary dark:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const CreateRoomForm = ({ branches, roomTypes, loading, onCancel, onCreated }) => {
  const [form, setForm] = useState({ room_type_id: '', branch_id: '', status: 'Available' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        room_type_id: Number(form.room_type_id),
        branch_id: Number(form.branch_id),
        status: form.status || 'Available',
      };
      await api.createRoom(payload);
      onCreated();
    } catch (e) {
      alert('Failed to create room: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      <div className="relative z-30">
        <label className="block text-sm font-medium text-slate-300 dark:text-slate-200 mb-2">Room Type *</label>
        <SearchableDropdown
          options={roomTypes}
          value={form.room_type_id}
          onChange={(value) => setForm({...form, room_type_id: value})}
          placeholder="Select Room Type"
          searchPlaceholder="Search room types..."
          className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
          required
          displayKey="name"
          valueKey="room_type_id"
          searchKeys={['name']}
          renderOption={(roomType) => (
            <div className="flex justify-between items-center w-full">
              <div>
                <div className="font-semibold text-white">{roomType.name}</div>
                <div className="text-sm text-slate-200">
                  Capacity: {roomType.capacity} | Rs {parseFloat(roomType.daily_rate).toFixed(2)}/night
                </div>
              </div>
            </div>
          )}
          renderSelected={(roomType) => `${roomType.name} Rs ${parseFloat(roomType.daily_rate).toFixed(2)}/night`}
          emptyMessage="No room types found"
        />
      </div>
      <div className="relative z-20">
        <label className="block text-sm font-medium text-slate-300 dark:text-slate-200 mb-2">Branch</label>
        <SearchableDropdown
          options={branches}
          value={form.branch_id}
          onChange={(value) => setForm({...form, branch_id: value})}
          placeholder="Select Branch"
          searchPlaceholder="Search branches..."
          className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
          required
          displayKey="branch_name"
          valueKey="branch_id"
          searchKeys={['branch_name', 'branch_code']}
          renderOption={(branch) => (
            <div className="flex justify-between items-center w-full">
              <div>
                <div className="font-semibold text-white">{branch.branch_name}</div>
                <div className="text-sm text-slate-200">
                  {branch.branch_code} | {branch.address}
                </div>
              </div>
            </div>
          )}
          renderSelected={(branch) => `${branch.branch_name} ${branch.branch_code}`}
          emptyMessage="No branches found"
        />
      </div>
      <div className="relative z-10">
        <label className="block text-sm font-medium text-slate-300 dark:text-slate-200 mb-2">Status</label>
        <SearchableDropdown
          options={[
            { value: 'Available', label: 'Available' },
            { value: 'Occupied', label: 'Occupied' },
            { value: 'Maintenance', label: 'Maintenance' },
            { value: 'Reserved', label: 'Reserved' }
          ]}
          value={form.status}
          onChange={(value) => setForm({...form, status: value})}
          placeholder="Select Status"
          searchPlaceholder="Search status..."
          className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
          displayKey="label"
          valueKey="value"
          searchKeys={['label']}
          renderOption={(status) => (
            <div className="flex justify-between items-center w-full">
              <div>
                <div className="font-semibold text-white">{status.label}</div>
              </div>
            </div>
          )}
          renderSelected={(status) => (
            <div className="flex justify-between items-center w-full">
              <span className="font-medium">{status.label}</span>
            </div>
          )}
          emptyMessage="No status options found"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={loading || submitting}>{submitting ? 'Creating...' : 'Create'}</button>
      </div>
    </form>
  );
};

// Edit Room Modal Component
const EditRoomModal = ({ room, branches, roomTypes, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    room_type_id: room?.room_type_id || '',
    branch_id: room?.branch_id || '',
    status: room?.status || 'Available'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setForm({
        room_type_id: room.room_type_id || '',
        branch_id: room.branch_id || '',
        status: room.status || 'Available'
      });
    }
  }, [room]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        room_type_id: Number(form.room_type_id),
        branch_id: Number(form.branch_id),
        status: form.status || 'Available',
      };
      await api.updateRoom(room.room_id, payload);
      onSuccess();
      onClose();
    } catch (e) {
      alert('Failed to update room: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex justify-between items-center" style={{ zIndex: 'var(--z-sticky)' }}>
          <h2 className="text-2xl font-display font-bold text-white">
            Edit Room
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300 dark:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="relative z-30">
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-200 mb-2">Room Type *</label>
            <SearchableDropdown
              options={roomTypes}
              value={form.room_type_id}
              onChange={(value) => setForm({...form, room_type_id: value})}
              placeholder="Select Room Type"
              searchPlaceholder="Search room types..."
              className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              displayKey="name"
              valueKey="room_type_id"
              renderOption={(roomType) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-semibold text-white">{roomType.name}</div>
                    <div className="text-sm text-slate-200">
                      Capacity: {roomType.capacity} | Rs {parseFloat(roomType.daily_rate).toFixed(2)}/night
                    </div>
                  </div>
                </div>
              )}
              renderSelected={(roomType) => `${roomType.name} Rs ${parseFloat(roomType.daily_rate).toFixed(2)}/night`}
              emptyMessage="No room types found"
            />
          </div>
          
          <div className="relative z-20">
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-200 mb-2">Branch *</label>
            <SearchableDropdown
              options={branches}
              value={form.branch_id}
              onChange={(value) => setForm({...form, branch_id: value})}
              placeholder="Select Branch"
              searchPlaceholder="Search branches..."
              className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              displayKey="branch_name"
              valueKey="branch_id"
              renderOption={(branch) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-semibold text-white">{branch.branch_name}</div>
                    <div className="text-sm text-slate-200">{branch.address}</div>
                  </div>
                  {branch.branch_code && (
                    <div className="text-xs text-slate-300">
                      {branch.branch_code}
                    </div>
                  )}
                </div>
              )}
              renderSelected={(branch) => `${branch.branch_name} ${branch.branch_code}`}
              emptyMessage="No branches found"
            />
          </div>
          
          <div className="relative z-10">
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-200 mb-2">Status</label>
            <SearchableDropdown
              options={[
                { value: 'Available', label: 'Available' },
                { value: 'Occupied', label: 'Occupied' },
                { value: 'Maintenance', label: 'Maintenance' },
                { value: 'Reserved', label: 'Reserved' }
              ]}
              value={form.status}
              onChange={(value) => setForm({...form, status: value})}
              placeholder="Select Status"
              searchPlaceholder="Search status..."
              className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              displayKey="label"
              valueKey="value"
              searchKeys={['label']}
              renderOption={(status) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-semibold text-white">{status.label}</div>
                  </div>
                </div>
              )}
              renderSelected={(status) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{status.label}</span>
                </div>
              )}
              emptyMessage="No status options found"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomsPage;
