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
    <div className="min-h-screen p-6" style={{ background: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: '2px solid #e0e0e0' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.2,
            }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Bed className="w-12 h-12 text-white" />
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Room Inventory</h1>
                    <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Manage hotel room availability and status
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 flex items-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(255, 255, 255, 0.3)',
                    border: '3px solid rgba(255, 255, 255, 0.6)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.35)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(255, 255, 255, 0.3)';
                  }}
                >
                  <Plus className="w-5 h-5" />
                  Add Room
                </button>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {headerStats.map((stat, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur-md rounded-xl p-4 hover:bg-white/30 transition-all duration-300 border border-white/30">
                    <div className="text-white text-sm font-semibold mb-2">{stat.label}</div>
                    <div className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* View Mode Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-slate-700">View Mode:</div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: `All Rooms (${rooms.length})` },
                { key: 'available', label: `Available (${freeRooms.length})` },
              ].map(({ key, label }) => {
                const isActive = viewMode === key;
                return (
              <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className="px-6 py-3 rounded-xl font-bold transition-all"
                    style={
                      isActive
                  ? {
                      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)'
                          }
                        : {
                            background: 'white',
                            color: '#495057',
                            border: '2px solid #e0e0e0'
                          }
                    }
                  >
                    {label}
              </button>
                );
              })}
            </div>
          </div>
        </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative z-10 flex items-center justify-center w-full h-full p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden" style={{minWidth: '600px', border: '2px solid #e0e0e0'}}>
            <div className="px-6 py-5 flex-shrink-0 sticky top-0 z-10 rounded-t-2xl" style={{
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Add New Room</h2>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Create a new room with branch and type details.
                  </p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                  type="button"
                >
                <X className="w-6 h-6" />
              </button>
              </div>
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

      {/* Combined Filters */}
      <div className="bg-white rounded-2xl shadow-xl overflow-visible" style={{ border: '2px solid #e0e0e0' }}>
        <div className="p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Building2 className="w-6 h-6" />
          </div>
            <div>
              <h3 className="text-2xl font-bold">Filters</h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Branch, room type and quick room search</p>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Branch */}
            <div className="flex items-center gap-3 min-w-0 lg:col-span-4">
              <div className="flex items-center gap-2 shrink-0" style={{ color: '#1a237e' }}>
                <Building2 className="w-5 h-5" />
                <span className="font-semibold">Branch:</span>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
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
                  buttonClassName="!w-full !px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 !truncate text-ellipsis focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                  dropdownClassName="!border-gray-300"
                />
        </div>
      </div>

            {/* Room Type */}
            <div className="flex items-center gap-3 min-w-0 lg:col-span-4">
              <div className="flex items-center gap-2 shrink-0" style={{ color: '#1a237e' }}>
                <Bed className="w-5 h-5" />
                <span className="font-semibold">Room Type:</span>
          </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
            <SearchableDropdown
              options={roomTypes}
              value={selectedRoomType}
              onChange={setSelectedRoomType}
              placeholder="All Room Types"
              searchPlaceholder="Search room types..."
              displayKey="name"
              valueKey="room_type_id"
              searchKeys={['name']}
              renderOption={(roomType) => `${roomType.name} - Rs.${parseFloat(roomType.daily_rate || 0).toFixed(2)}/night`}
                  buttonClassName="!w-full !px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 !truncate text-ellipsis focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                  dropdownClassName="!border-gray-300"
                />
        </div>
      </div>

            {/* Actions (single Clear button) */}
            <div className="flex items-center justify-end lg:col-span-4">
            <button
                onClick={() => { setSelectedBranch(''); setSelectedRoomType(''); setSelectedRoom(''); }}
                className="px-6 py-3 rounded-xl font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)' }}
              >
                Clear
            </button>
            </div>

            {/* Search Room (moved to second row, full width) */}
            <div className="flex items-center gap-3 min-w-0 lg:col-span-12">
              <div className="flex items-center gap-2 shrink-0" style={{ color: '#1a237e' }}>
                <Bed className="w-5 h-5" />
                <span className="font-semibold">Room:</span>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
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
                  buttonClassName="!w-full !px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 !truncate text-ellipsis focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                  dropdownClassName="!border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-xl p-6 h-64 animate-pulse" style={{ border: '2px solid #e9ecef', background: '#f8f9fa' }}></div>
          ))
        ) : filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Bed className="w-16 h-16 mx-auto mb-4" style={{ color: '#adb5bd' }} />
            <p style={{ color: '#495057' }}>No rooms found</p>
          </div>
        ) : (
          filteredRooms.map(room => (
            <div key={room.room_id} className="rounded-xl p-6 hover:shadow-lg transition-all" style={{ border: '2px solid #e9ecef', background: '#f8f9fa' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#1a237e' }}>Room {room.room_number}</h3>
                  <p className="text-sm" style={{ color: '#6c757d' }}>{room.room_type_name}</p>
                </div>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={(function(){
                    const s = String(room.status || '').toLowerCase();
                    if (s.startsWith('avail')) return { background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', color: '#2e7d32', border: '2px solid #81c784' };
                    if (s.includes('occup') || s.includes('unavail')) return { background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)', color: '#c62828', border: '2px solid #e57373' };
                    if (s.startsWith('maint')) return { background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', color: '#f57f17', border: '2px solid #ffee58' };
                    if (s.startsWith('reserv')) return { background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)', color: '#0d47a1', border: '2px solid #64b5f6' };
                    return { background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', color: '#0d47a1', border: '2px solid #64b5f6' };
                  })()}
                >
                  {(function(){
                    const s = String(room.status || '').toLowerCase();
                    if (s.includes('unavail')) return 'Occupied';
                    return room.status;
                  })()}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#6c757d' }}>Room Type:</span>
                  <span className="font-medium" style={{ color: '#1a237e' }}>{room.room_type_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6c757d' }}>Branch:</span>
                  <span className="font-medium" style={{ color: '#1a237e' }}>{room.branch_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6c757d' }}>Price per Night:</span>
                  <span className="font-bold" style={{ color: '#1a237e' }}>Rs {room.daily_rate ? parseFloat(room.daily_rate).toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6c757d' }}>Max Occupancy:</span>
                  <span className="font-medium" style={{ color: '#1a237e' }}>{room.capacity || 'N/A'} guests</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-4 pt-4" style={{ borderTop: '2px solid #e9ecef' }}>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="px-4 py-2 rounded-lg font-bold text-white transition-all"
                    style={{ 
                      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                      boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)'
                    }}
                    title="Edit Room"
                  >
                    <div className="flex items-center gap-2"><Edit className="w-5 h-5" /> Edit</div>
                  </button>
                  <button
                    onClick={() => handleDelete(room.room_id)}
                    className="px-4 py-2 rounded-lg font-bold text-white transition-all"
                    style={{ 
                      background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)',
                      boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)'
                    }}
                    title="Delete Room"
                  >
                    <div className="flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete</div>
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
            className="px-6 py-3 rounded-xl font-bold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)'
            }}
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
        <div className="flex items-center justify-between p-6 bg-white rounded-xl shadow-lg" style={{ border: '2px solid #e0e0e0' }}>
          <div className="text-sm" style={{ color: '#495057' }}>
            Showing {displayRooms.length} {viewMode === 'available' ? 'available' : ''} rooms from {allRooms.length} loaded rooms
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadRooms((pagination.page || 1) - 1)}
              disabled={(pagination.page || 1) <= 1}
              className="px-4 py-2 text-sm rounded-xl font-medium transition-all border-0"
              style={{
                background: 'white',
                color: '#495057',
                border: '2px solid #e0e0e0'
              }}
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
                    className="px-4 py-2 text-sm rounded-xl font-bold transition-all border-0"
                    style={
                      pageNum === (pagination.page || 1)
                        ? {
                            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)'
                          }
                        : {
                            background: 'white',
                            color: '#495057',
                            border: '2px solid #e0e0e0'
                          }
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => loadRooms((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
              className="px-4 py-2 text-sm rounded-xl font-medium transition-all border-0"
              style={{
                background: 'white',
                color: '#495057',
                border: '2px solid #e0e0e0'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
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
    <div className="flex-1 overflow-y-auto" style={{ background: '#f8f9fa' }}>
    <form onSubmit={submit} className="p-6 space-y-4">
        <div className="relative z-[100004]">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Room Type</label>
        <SearchableDropdown
          options={roomTypes}
          value={form.room_type_id}
          onChange={(value) => setForm({...form, room_type_id: value})}
            placeholder="Select room type"
          searchPlaceholder="Search room types..."
          required
          displayKey="name"
          valueKey="room_type_id"
          searchKeys={['name']}
          renderOption={(roomType) => (
            <div className="flex justify-between items-center w-full">
              <div>
                  <div className="font-semibold" style={{ color: '#1a237e' }}>{roomType.name}</div>
                  <div className="text-sm" style={{ color: '#495057' }}>
                  Capacity: {roomType.capacity} | Rs {parseFloat(roomType.daily_rate).toFixed(2)}/night
                </div>
              </div>
            </div>
          )}
          renderSelected={(roomType) => `${roomType.name} Rs ${parseFloat(roomType.daily_rate).toFixed(2)}/night`}
          emptyMessage="No room types found"
            buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
            dropdownClassName="!border-gray-300 !bg-white !text-gray-900 !z-[100005]"
            inputClassName="!text-gray-900 !placeholder-gray-500"
        />
      </div>
        <div className="relative z-[100003]">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Branch</label>
        <SearchableDropdown
          options={branches}
          value={form.branch_id}
          onChange={(value) => setForm({...form, branch_id: value})}
            placeholder="Select branch"
          searchPlaceholder="Search branches..."
          required
          displayKey="branch_name"
          valueKey="branch_id"
          searchKeys={['branch_name', 'branch_code']}
          renderOption={(branch) => (
            <div className="flex justify-between items-center w-full">
              <div>
                  <div className="font-semibold" style={{ color: '#1a237e' }}>{branch.branch_name}</div>
                  <div className="text-sm" style={{ color: '#495057' }}>
                  {branch.branch_code} | {branch.address}
                </div>
              </div>
            </div>
          )}
          renderSelected={(branch) => `${branch.branch_name} ${branch.branch_code}`}
          emptyMessage="No branches found"
            buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
            dropdownClassName="!border-gray-300 !bg-white !text-gray-900 !z-[100004]"
            inputClassName="!text-gray-900 !placeholder-gray-500"
        />
      </div>
        <div className="relative z-[100002]">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Status</label>
        <SearchableDropdown
          options={[
            { value: 'Available', label: 'Available' },
            { value: 'Occupied', label: 'Occupied' },
            { value: 'Maintenance', label: 'Maintenance' },
            { value: 'Reserved', label: 'Reserved' }
          ]}
          value={form.status}
          onChange={(value) => setForm({...form, status: value})}
            placeholder="Select status"
          searchPlaceholder="Search status..."
          displayKey="label"
          valueKey="value"
          searchKeys={['label']}
          renderOption={(status) => (
            <div className="flex justify-between items-center w-full">
              <div>
                  <div className="font-semibold" style={{ color: '#1a237e' }}>{status.label}</div>
              </div>
            </div>
          )}
          renderSelected={(status) => (
            <div className="flex justify-between items-center w-full">
              <span className="font-medium">{status.label}</span>
            </div>
          )}
          emptyMessage="No status options found"
            buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
            dropdownClassName="!border-gray-300 !bg-white !text-gray-900 !z-[100003]"
            inputClassName="!text-gray-900 !placeholder-gray-500"
        />
      </div>

        <div className="px-6 py-5 flex-shrink-0 sticky bottom-0 z-10 rounded-b-2xl" style={{ 
          background: 'white',
          borderTop: '2px solid #e0e0e0'
        }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="dropdown-option-button px-6 py-3 font-semibold rounded-xl transition-all duration-200 flex-1"
              style={{
                background: 'white',
                border: '2px solid #1a237e',
                color: '#1a237e',
                boxShadow: '0 2px 8px rgba(26, 35, 126, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.target.style.setProperty('background', 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', 'important');
                e.target.style.setProperty('color', 'white', 'important');
                e.target.style.setProperty('box-shadow', '0 4px 12px rgba(26, 35, 126, 0.3)', 'important');
              }}
              onMouseLeave={(e) => {
                e.target.style.setProperty('background', 'white', 'important');
                e.target.style.setProperty('color', '#1a237e', 'important');
                e.target.style.setProperty('box-shadow', '0 2px 8px rgba(26, 35, 126, 0.15)', 'important');
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dropdown-option-button px-6 py-3 font-bold rounded-xl transition-all flex-1"
              disabled={loading || submitting}
              style={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                color: 'white',
                border: '2px solid transparent',
                boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                opacity: (loading || submitting) ? 0.5 : 1,
                cursor: (loading || submitting) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating...' : 'Create Room'}
            </button>
          </div>
      </div>
    </form>
    </div>
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
    <div className="fixed inset-0 z-[99999]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden" style={{minWidth: '600px', border: '2px solid #e0e0e0'}}>
        <div className="px-6 py-5 sticky top-0 z-10 rounded-t-2xl flex justify-between items-center" style={{ 
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)'
        }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Edit Room</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: '#f8f9fa' }}>
          <div className="relative z-[100004]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Room Type *</label>
            <SearchableDropdown
              options={roomTypes}
              value={form.room_type_id}
              onChange={(value) => setForm({...form, room_type_id: value})}
              placeholder="Select Room Type"
              searchPlaceholder="Search room types..."
              className="input-field bg-white border-2 border-gray-300 text-slate-700 placeholder-slate-400"
              buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
              dropdownClassName="!border-gray-300 !bg-white !text-gray-900 !z-[100005]"
              inputClassName="!text-gray-900 !placeholder-gray-500"
              displayKey="name"
              valueKey="room_type_id"
              renderOption={(roomType) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-semibold" style={{ color: '#1a237e' }}>{roomType.name}</div>
                    <div className="text-sm" style={{ color: '#495057' }}>
                      Capacity: {roomType.capacity} | Rs {parseFloat(roomType.daily_rate).toFixed(2)}/night
                    </div>
                  </div>
                </div>
              )}
              renderSelected={(roomType) => `${roomType.name} Rs ${parseFloat(roomType.daily_rate).toFixed(2)}/night`}
            />
          </div>
          
          <div className="relative z-[100003]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Branch *</label>
            <SearchableDropdown
              options={branches}
              value={form.branch_id}
              onChange={(value) => setForm({...form, branch_id: value})}
              placeholder="Select Branch"
              searchPlaceholder="Search branches..."
              className="input-field bg-white border-2 border-gray-300 text-slate-700 placeholder-slate-400"
              buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
              dropdownClassName="!border-gray-300 !bg-white !text-gray-900 !z-[100004]"
              inputClassName="!text-gray-900 !placeholder-gray-500"
              displayKey="branch_name"
              valueKey="branch_id"
              renderOption={(branch) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-semibold" style={{ color: '#1a237e' }}>{branch.branch_name}</div>
                    <div className="text-sm" style={{ color: '#495057' }}>{branch.address}</div>
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
          
          <div className="relative z-[100002]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
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
              className="input-field bg-white border-2 border-gray-300 text-slate-700 placeholder-slate-400"
              buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
              dropdownClassName="!border-gray-300 !bg-white !text-gray-900 !z-[100003]"
              inputClassName="!text-gray-900 !placeholder-gray-500"
              displayKey="label"
              valueKey="value"
              searchKeys={['label']}
              renderOption={(status) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-semibold" style={{ color: '#1a237e' }}>{status.label}</div>
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

        </form>
        <div className="px-6 py-5 flex-shrink-0 sticky bottom-0 z-10 rounded-b-2xl" style={{ 
          background: 'white',
          borderTop: '2px solid #e0e0e0'
        }}>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="dropdown-option-button px-6 py-3 font-semibold rounded-xl transition-all duration-200"
              style={{
                background: 'white',
                border: '2px solid #1a237e',
                color: '#1a237e',
                boxShadow: '0 2px 8px rgba(26, 35, 126, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.target.style.setProperty('background', 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', 'important');
                e.target.style.setProperty('color', 'white', 'important');
                e.target.style.setProperty('box-shadow', '0 4px 12px rgba(26, 35, 126, 0.3)', 'important');
              }}
              onMouseLeave={(e) => {
                e.target.style.setProperty('background', 'white', 'important');
                e.target.style.setProperty('color', '#1a237e', 'important');
                e.target.style.setProperty('box-shadow', '0 2px 8px rgba(26, 35, 126, 0.15)', 'important');
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={submit}
              className="dropdown-option-button px-6 py-3 font-bold rounded-xl transition-all"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                color: 'white',
                border: '2px solid transparent',
                boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                opacity: submitting ? 0.5 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Updating...' : 'Update Room'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RoomsPage;
