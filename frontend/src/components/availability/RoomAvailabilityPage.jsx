import { useState, useEffect, useMemo } from 'react';
import { Calendar, RefreshCw, Filter, Download, Eye, EyeOff, Building2, Bed } from 'lucide-react';
import { format, addDays } from 'date-fns';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

export const RoomAvailabilityPage = () => {
  const [timelineFilters, setTimelineFilters] = useState({
    from: format(new Date(), 'yyyy-MM-dd'),
    to: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    room_type_id: '',
    branch_id: '', // NEW: Branch filter
    room_id: '', // NEW: Room search filter
    status: '', // NEW: Status filter
  });
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [branches, setBranches] = useState([]); // NEW: Branches state
  const [rooms, setRooms] = useState([]); // NEW: All rooms for search
  const [showRoomDetails, setShowRoomDetails] = useState(true);
  const roomTypeOptions = useMemo(
    () => [
      { id: '', name: 'All Room Types' },
      ...roomTypes.map((roomType) => ({
        id: String(roomType.room_type_id ?? roomType.id ?? ''),
        name: roomType.name
          ? `${roomType.name}${roomType.capacity ? ` (Capacity: ${roomType.capacity})` : ''}`
          : `Room Type ${roomType.room_type_id ?? ''}`,
      })),
    ],
    [roomTypes],
  );

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

  const statusOptions = useMemo(
    () => [
      { id: '', name: 'All Statuses' },
      { id: 'Available', name: 'Available' },
      { id: 'Unavailable', name: 'Unavailable' },
      { id: 'Occupied', name: 'Occupied' },
      { id: 'Maintenance', name: 'Maintenance' },
      { id: 'Reserved', name: 'Reserved' },
    ],
    [],
  );
  
  // Create modals state
  // Removed: creation handled in dedicated pages
  
  // Pagination state for rooms
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [hasMoreRooms, setHasMoreRooms] = useState(true);

  useEffect(() => {
    loadRoomTypes();
    loadBranches(); // NEW: Load branches
    loadRooms(); // NEW: Load all rooms
    loadTimeline();
  }, []);

  const loadRoomTypes = async () => {
    try {
      const data = await api.getRoomTypes();
      setRoomTypes(Array.isArray(data?.roomTypes) ? data.roomTypes : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load room types:', error);
    }
  };

  const loadBranches = async () => { // NEW: Load branches function
    try {
      const branchesData = await api.getBranches();
      const branchList = Array.isArray(branchesData) ? branchesData : branchesData?.branches || [];
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const loadRooms = async () => { // NEW: Load all rooms function
    try {
      const roomsData = await api.getRooms();
      const list = Array.isArray(roomsData?.rooms) ? roomsData.rooms : Array.isArray(roomsData) ? roomsData : [];
      setRooms(list);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  // Removed create handlers (moved to dedicated pages)

  const loadTimeline = async (page = 1, append = false) => {
    if (!timelineFilters.from || !timelineFilters.to) return;
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const params = {
        from: timelineFilters.from,
        to: timelineFilters.to,
        page,
        limit: pagination.limit
      };
      if (timelineFilters.room_type_id) {
        params.room_type_id = timelineFilters.room_type_id;
      }
      if (timelineFilters.branch_id) { // NEW: Add branch filter
        params.branch_id = timelineFilters.branch_id;
      }
      const data = await api.getAvailabilityMatrix(params);
      
      // Apply client-side status filtering
      let filteredData = { ...data };
      if (timelineFilters.status && data.rooms) {
        filteredData.rooms = data.rooms.filter(room => {
          const roomStatus = getRoomAvailabilityStatus(room);
          return roomStatus === timelineFilters.status;
        });
      }
      
      if (append && timelineData?.rooms) {
        setTimelineData(prev => ({
          ...prev,
          rooms: [...prev.rooms, ...filteredData.rooms]
        }));
      } else {
        setTimelineData(filteredData);
      }
      
      // Update pagination info if available
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          page: data.pagination.page || page,
          total: data.pagination.total || data.rooms?.length || 0,
          totalPages: data.pagination.totalPages || 1
        }));
        setHasMoreRooms((data.pagination.page || page) < (data.pagination.totalPages || 1));
      } else {
        // Fallback for simple response
        setHasMoreRooms(data.rooms?.length >= pagination.limit);
      }
    } catch (err) {
      console.error('Failed to load availability timeline:', err);
      setTimelineError(err.message);
      setTimelineData(null);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setTimelineFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportAvailability = () => {
    if (!timelineData?.rooms) return;
    
    const csvData = timelineData.rooms.map(room => ({
      'Room Number': room.room_number,
      'Room Type': room.room_type_name,
      'Capacity': room.capacity,
      'Daily Rate': room.daily_rate,
      'Status': room.room_status,
      'Bookings Count': room.bookings?.length || 0,
      'First Booking': room.bookings?.[0]?.guest_name || 'None',
      'Last Booking': room.bookings?.[room.bookings.length - 1]?.guest_name || 'None'
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room-availability-${timelineFilters.from}-to-${timelineFilters.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRoomAvailabilityStatus = (room) => {
    // If room has active bookings, it's unavailable
    if (room.bookings && room.bookings.length > 0) {
      return 'Unavailable';
    }
    // Otherwise use the room's database status
    return room.room_status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800 border-green-200';
      case 'Occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Out-of-Order': return 'bg-gray-100 text-gray-800 border-border';
      case 'Unavailable': return 'bg-red-100 text-red-800 border-red-200';
      case 'Reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-border';
    }
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'Booked': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Checked-In': return 'bg-green-100 text-green-800 border-green-200';
      case 'Checked-Out': return 'bg-gray-100 text-gray-800 border-border';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-border';
    }
  };

  // Calculate stats
  const totalRooms = timelineData?.rooms?.length || 0;
  const availableRooms = timelineData?.rooms?.filter(r => r.room_status === 'Available').length || 0;
  const occupiedRooms = timelineData?.rooms?.filter(r => r.room_status === 'Occupied').length || 0;

  if (timelineLoading && !timelineData) {
    return <LoadingSpinner size="xl" message="Loading availability timeline..." />;
  }

  return (
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Room Availability"
          description="Visual timeline of room availability and bookings"
          icon={Bed}
          stats={[
            { label: 'Total Rooms', value: totalRooms, trend: `${timelineFilters.from} to ${timelineFilters.to}` },
            { label: 'Available', value: availableRooms, trend: 'Ready to book' },
            { label: 'Occupied', value: occupiedRooms, trend: 'Currently in use' },
          ]}
          actions={[{
            label: showRoomDetails ? 'Hide Details' : 'Show Details',
            icon: showRoomDetails ? EyeOff : Eye,
            onClick: () => setShowRoomDetails(!showRoomDetails),
          }]}
        />

        {/* Filters */}
        <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-text-tertiary" />
            <span className="font-medium text-text-secondary">Date Range:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={timelineFilters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="input-field"
            />
            <span className="text-text-tertiary">to</span>
            <input
              type="date"
              value={timelineFilters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-tertiary" />
            <span className="font-medium text-text-secondary">Room Type:</span>
            <SearchableDropdown
              value={timelineFilters.room_type_id}
              onChange={(value) => handleFilterChange('room_type_id', value || '')}
              options={roomTypeOptions}
              className="min-w-[200px]"
              placeholder="All Room Types"
            />
            {/* Creation moved to Room Types page */}
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-text-tertiary" />
            <span className="font-medium text-text-secondary">Branch:</span>
            <SearchableDropdown
              value={timelineFilters.branch_id}
              onChange={(value) => handleFilterChange('branch_id', value || '')}
              options={branchOptions}
              className="min-w-[200px]"
              placeholder="All Branches"
            />
          </div>

          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-text-tertiary" />
            <span className="font-medium text-text-secondary">Status:</span>
            <SearchableDropdown
              value={timelineFilters.status}
              onChange={(value) => handleFilterChange('status', value || '')}
              options={statusOptions}
              className="min-w-[200px]"
              placeholder="All Statuses"
            />
          </div>

          <button
            onClick={loadTimeline}
            className="btn-primary flex items-center gap-2"
            disabled={timelineLoading}
          >
            <RefreshCw className={`w-4 h-4 ${timelineLoading ? 'animate-spin' : ''}`} />
            {timelineLoading ? 'Loading...' : 'Refresh Timeline'}
          </button>

          <button
            onClick={() => {
              setTimelineFilters({
                from: format(new Date(), 'yyyy-MM-dd'),
                to: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                room_type_id: '',
                branch_id: '',
                room_id: '',
                status: '',
              });
              loadTimeline();
            }}
            className="btn-secondary flex items-center gap-2"
            disabled={timelineLoading}
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(timelineFilters.room_type_id || timelineFilters.branch_id || timelineFilters.status) && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Active Filters:</span>
            {timelineFilters.room_type_id && (
              <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                Room Type: {roomTypes.find(rt => rt.room_type_id == timelineFilters.room_type_id)?.name || 'Unknown'}
              </span>
            )}
            {timelineFilters.branch_id && (
              <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                Branch: {branches.find(b => b.branch_id == timelineFilters.branch_id)?.branch_name || 'Unknown'}
              </span>
            )}
            {timelineFilters.status && (
              <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                Status: {timelineFilters.status}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {timelineError && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">Error loading timeline:</span>
            <span>{timelineError}</span>
          </div>
        </div>
      )}

      {/* Timeline Data */}
      {timelineLoading ? (
        <div className="card">
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold"></div>
            <span className="text-text-secondary">Loading availability timeline...</span>
          </div>
        </div>
      ) : timelineData?.rooms?.length ? (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card bg-green-50 border-green-200">
              <div className="text-2xl font-bold text-green-800">
                {timelineData.rooms.filter(r => getRoomAvailabilityStatus(r) === 'Available').length}
              </div>
              <div className="text-sm text-green-600">Available Rooms</div>
            </div>
            <div className="card bg-red-50 border-red-200">
              <div className="text-2xl font-bold text-red-800">
                {timelineData.rooms.filter(r => getRoomAvailabilityStatus(r) === 'Unavailable').length}
              </div>
              <div className="text-sm text-red-600">Unavailable Rooms</div>
            </div>
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="text-2xl font-bold text-yellow-800">
                {timelineData.rooms.filter(r => r.room_status === 'Maintenance').length}
              </div>
              <div className="text-sm text-yellow-600">Maintenance</div>
            </div>
            <div className="card bg-blue-50 border-blue-200">
              <div className="text-2xl font-bold text-blue-800">
                {timelineData.rooms.filter(r => r.room_status === 'Reserved').length}
              </div>
              <div className="text-sm text-blue-600">Reserved</div>
            </div>
            <div className="card bg-surface-tertiary border-border">
              <div className="text-2xl font-bold text-text-primary">
                {timelineData.rooms.reduce((sum, r) => sum + (r.bookings?.length || 0), 0)}
              </div>
              <div className="text-sm text-text-secondary">Total Bookings</div>
            </div>
          </div>

          {/* Room Timeline */}
          <div className="space-y-3">
            {timelineData.rooms.map((room) => (
              <div key={room.room_id} className={`card ${showRoomDetails ? '' : 'py-3'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(getRoomAvailabilityStatus(room))}`}>
                      {getRoomAvailabilityStatus(room)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        Room {room.room_number || room.room_id}
                      </h3>
                      <p className="text-sm text-text-tertiary">
                        {showRoomDetails && (
                          <>
                            {room.room_type_name} • Capacity: {room.capacity} • Rate: Rs. {room.daily_rate || 'N/A'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-text-tertiary">
                    {room.bookings?.length || 0} booking{(room.bookings?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>

                {showRoomDetails && room.bookings?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-text-secondary mb-2">Bookings:</div>
                    {room.bookings.map((booking) => (
                      <div
                        key={`${room.room_id}-${booking.booking_id}`}
                        className="bg-surface-tertiary border border-border rounded-lg p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getBookingStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className="font-medium text-text-primary">
                              #{booking.booking_id} - {booking.guest_name || 'Guest'}
                            </span>
                          </div>
                          <div className="text-sm text-text-tertiary">
                            {booking.date_range_pretty ||
                              `${booking.check_in_pretty || booking.check_in_date} → ${booking.check_out_pretty || booking.check_out_date}`}
                          </div>
                        </div>
                        {booking.meta && (
                          <div className="mt-2 space-y-1 text-xs text-text-secondary">
                            {booking.meta.specialRequests && (
                              <p>
                                <span className="font-semibold">Requests:</span> {booking.meta.specialRequests}
                              </p>
                            )}
                            {booking.meta.guestAlerts && (
                              <p>
                                <span className="font-semibold text-red-600">Alerts:</span> {booking.meta.guestAlerts}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Rooms Found</h3>
            <p className="text-text-secondary mb-4">
              No rooms found for the selected filters. Try adjusting your date range or room type filter.
            </p>
            <button
              onClick={loadTimeline}
              className="btn-primary"
            >
              Refresh Timeline
            </button>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasMoreRooms && timelineData?.rooms?.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadTimeline((pagination.page || 1) + 1, true)}
            disabled={timelineLoading}
            className="btn-primary px-6 py-2"
          >
            {timelineLoading ? 'Loading...' : `Load More Rooms (${timelineData.rooms.length} loaded)`}
          </button>
          <p className="text-sm text-text-secondary mt-2">
            Load more rooms for better availability overview
          </p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && timelineData?.rooms?.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing {timelineData.rooms.length} rooms from {pagination.total} total rooms
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadTimeline((pagination.page || 1) - 1)}
              disabled={(pagination.page || 1) <= 1}
              className="px-3 py-2 text-sm border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onClick={() => loadTimeline(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      pageNum === (pagination.page || 1)
                        ? 'bg-luxury-gold text-white border-luxury-gold'
                        : 'border-border dark:border-slate-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => loadTimeline((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
              className="px-3 py-2 text-sm border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Creation modals removed; creation handled in dedicated pages */}
      </div>
    </div>
  );
};

export default RoomAvailabilityPage;
