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
      { id: 'Occupied', name: 'Occupied' }, // Unavailable merged into Occupied
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
    const dbStatus = String(room.room_status || '').trim().toLowerCase();
    // 1) Honor explicit Reserved from DB (pre-bookings)
    if (dbStatus === 'reserved') return 'Reserved';
    // 2) Any overlapping bookings => Occupied
    if (Array.isArray(room.bookings) && room.bookings.length > 0) return 'Occupied';
    // 3) Maintenance stays visible regardless of bookings
    if (dbStatus === 'maintenance') return 'Maintenance';
    // 4) Otherwise treat as Available (ignore stray 'occupied/unavailable' without overlaps)
    return 'Available';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-800/30 text-green-200 border-green-700';
      case 'Occupied': return 'bg-red-800/30 text-red-200 border-red-700';
      case 'Maintenance': return 'bg-yellow-800/30 text-yellow-800 border-yellow-200';
      case 'Out-of-Order': return 'bg-slate-800 text-white border-border';
      case 'Unavailable': return 'bg-red-800/30 text-red-200 border-red-700';
      case 'Reserved': return 'bg-blue-800/30 text-blue-200 border-blue-700';
      default: return 'bg-slate-800 text-white border-border';
    }
  };

  const getBookingPillStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('book')) {
      return { background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)', color: '#0d47a1', border: '2px solid #64b5f6' };
    }
    if (s.includes('check') && s.includes('in')) {
      return { background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', color: '#f57f17', border: '2px solid #ffee58' };
    }
    if (s.includes('check') && s.includes('out')) {
      return { background: 'linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)', color: '#6a1b9a', border: '2px solid #ba68c8' };
    }
    if (s.includes('cancel')) {
      return { background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)', color: '#c62828', border: '2px solid #e57373' };
    }
    return { background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', color: '#2e7d32', border: '2px solid #81c784' };
  };

  const getStatusPillStyle = (status) => {
    if (!status) {
      return { background: '#e9ecef', color: '#495057', border: '2px solid #dee2e6' };
    }
    switch (status) {
      case 'Available':
        return { background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', color: '#2e7d32', border: '2px solid #81c784' };
      case 'Unavailable':
      case 'Occupied':
        return { background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)', color: '#c62828', border: '2px solid #e57373' };
      case 'Maintenance':
        return { background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', color: '#f57f17', border: '2px solid #ffee58' };
      case 'Reserved':
        return { background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)', color: '#0d47a1', border: '2px solid #64b5f6' };
      default:
        return { background: '#e9ecef', color: '#495057', border: '2px solid #dee2e6' };
    }
  };

  // Calculate stats
  const totalRooms = timelineData?.rooms?.length || 0;
  const availableRooms = timelineData?.rooms?.filter(r => getRoomAvailabilityStatus(r) === 'Available').length || 0;
  const occupiedRooms = timelineData?.rooms?.filter(r => getRoomAvailabilityStatus(r) === 'Occupied').length || 0;

  if (timelineLoading && !timelineData) {
    return <LoadingSpinner size="xl" message="Loading availability timeline..." />;
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#f8f9fa' }}>
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
        <div className="bg-white rounded-2xl shadow-xl overflow-visible" style={{ border: '2px solid #e0e0e0' }}>
          <div className="p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Filter className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Filters</h3>
                <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Date range and quick selectors</p>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-visible">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
              {/* Branch - Row 1 */}
              <div className="flex items-center gap-3 xl:col-span-4 min-w-0">
                <div className="flex items-center gap-2 shrink-0" style={{ color: '#1a237e' }}>
                  <Building2 className="w-5 h-5" />
                  <span className="font-semibold">Branch:</span>
                </div>
                <SearchableDropdown value={timelineFilters.branch_id} onChange={(value) => handleFilterChange('branch_id', value || '')} options={branchOptions} placeholder="All Branches" className="min-w-[200px]" buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700" dropdownClassName="!border-gray-300" />
              </div>

              {/* Room Type - Row 1 */}
              <div className="flex items-center gap-3 xl:col-span-4 min-w-0">
                <div className="flex items-center gap-2 shrink-0" style={{ color: '#1a237e' }}>
                  <Filter className="w-5 h-5" />
                  <span className="font-semibold">Room Type:</span>
                </div>
                <SearchableDropdown value={timelineFilters.room_type_id} onChange={(value) => handleFilterChange('room_type_id', value || '')} options={roomTypeOptions} placeholder="All Room Types" className="min-w-[200px]" buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700" dropdownClassName="!border-gray-300" />
              </div>

              {/* Status - Row 1 */}
              <div className="flex items-center gap-3 xl:col-span-4 min-w-0">
                <div className="flex items-center gap-2 shrink-0" style={{ color: '#1a237e' }}>
                  <Bed className="w-5 h-5" />
                  <span className="font-semibold">Status:</span>
                </div>
                <SearchableDropdown value={timelineFilters.status} onChange={(value) => handleFilterChange('status', value || '')} options={statusOptions} placeholder="All Statuses" className="min-w-[200px]" buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700" dropdownClassName="!border-gray-300" />
              </div>

              {/* Date Range - Row 2 */}
              <div className="flex items-center gap-3 xl:col-span-6">
                <div className="flex items-center gap-2 shrink-0" style={{ color: '#1a237e' }}>
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Date Range:</span>
                </div>
                <input type="date" value={timelineFilters.from} onChange={(e) => handleFilterChange('from', e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all" style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }} />
                <span className="text-slate-600">to</span>
                <input type="date" value={timelineFilters.to} onChange={(e) => handleFilterChange('to', e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all" style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }} />
              </div>

              {/* Actions - Row 2 */}
              <div className="flex items-center justify-end gap-3 xl:col-span-6">
                <button onClick={loadTimeline} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)' }} disabled={timelineLoading}>
                  <RefreshCw className={`w-4 h-4 ${timelineLoading ? 'animate-spin' : ''}`} />
                  {timelineLoading ? 'Loading...' : 'Refresh Timeline'}
                </button>
                <button onClick={() => { setTimelineFilters({ from: format(new Date(), 'yyyy-MM-dd'), to: format(addDays(new Date(), 7), 'yyyy-MM-dd'), room_type_id: '', branch_id: '', room_id: '', status: '', }); loadTimeline(); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)' }} disabled={timelineLoading}>
                  <Filter className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(timelineFilters.room_type_id || timelineFilters.branch_id || timelineFilters.status) && (
        <div className="rounded-2xl p-4" style={{ border: '2px solid #e0e0e0', background: 'white' }}>
          <div className="flex items-center gap-2" style={{ color: '#1a237e' }}>
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Active Filters:</span>
            {timelineFilters.room_type_id && (
              <span className="px-2 py-1 rounded-full text-sm font-semibold" style={{ background: '#e3f2fd', color: '#0d47a1', border: '2px solid #64b5f6' }}>
                Room Type: {roomTypes.find(rt => rt.room_type_id == timelineFilters.room_type_id)?.name || 'Unknown'}
              </span>
            )}
            {timelineFilters.branch_id && (
              <span className="px-2 py-1 rounded-full text-sm font-semibold" style={{ background: '#e3f2fd', color: '#0d47a1', border: '2px solid #64b5f6' }}>
                Branch: {branches.find(b => b.branch_id == timelineFilters.branch_id)?.branch_name || 'Unknown'}
              </span>
            )}
            {timelineFilters.status && (
              <span className="px-2 py-1 rounded-full text-sm font-bold" style={getStatusPillStyle(timelineFilters.status)}>
                Status: {timelineFilters.status}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {timelineError && (
        <div className="card bg-red-900/20 border-red-700">
          <div className="flex items-center gap-2 text-red-200">
            <div className="w-2 h-2 bg-red-900/200 rounded-full"></div>
            <span className="font-medium">Error loading timeline:</span>
            <span>{timelineError}</span>
          </div>
        </div>
      )}

      {/* Timeline Data */}
      {timelineLoading ? (
        <div className="bg-white rounded-2xl shadow-xl p-6" style={{ border: '2px solid #e0e0e0' }}>
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="animate-spin rounded-full h-8 w-8" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: '#e9ecef', borderTopColor: '#1a237e' }}></div>
            <span className="text-slate-600">Loading availability timeline...</span>
          </div>
        </div>
      ) : timelineData?.rooms?.length ? (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="rounded-2xl p-5" style={{ border: '2px solid #e0e0e0', background: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: '#2e7d32' }}>
                {timelineData.rooms.filter(r => getRoomAvailabilityStatus(r) === 'Available').length}
              </div>
              <div className="text-sm font-medium" style={{ color: '#2e7d32' }}>Available Rooms</div>
            </div>
            <div className="rounded-2xl p-5" style={{ border: '2px solid #e0e0e0', background: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: '#c62828' }}>
                {timelineData.rooms.filter(r => getRoomAvailabilityStatus(r) === 'Occupied').length}
              </div>
              <div className="text-sm font-medium" style={{ color: '#c62828' }}>Occupied Rooms</div>
            </div>
            <div className="rounded-2xl p-5" style={{ border: '2px solid #e0e0e0', background: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: '#f57f17' }}>
                {timelineData.rooms.filter(r => getRoomAvailabilityStatus(r) === 'Maintenance').length}
              </div>
              <div className="text-sm font-medium" style={{ color: '#f57f17' }}>Maintenance</div>
            </div>
            <div className="rounded-2xl p-5" style={{ border: '2px solid #e0e0e0', background: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: '#0d47a1' }}>
                {timelineData.rooms.filter(r => getRoomAvailabilityStatus(r) === 'Reserved').length}
              </div>
              <div className="text-sm font-medium" style={{ color: '#0d47a1' }}>Reserved</div>
            </div>
            <div className="rounded-2xl p-5" style={{ border: '2px solid #e0e0e0', background: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: '#1a237e' }}>
                {timelineData.rooms.reduce((sum, r) => sum + (r.bookings?.length || 0), 0)}
              </div>
              <div className="text-sm font-medium" style={{ color: '#1a237e' }}>Total Bookings</div>
            </div>
          </div>

          {/* Room Timeline */}
          <div className="space-y-3">
            {timelineData.rooms.map((room) => (
              <div key={room.room_id} className={`bg-white rounded-xl p-6 ${showRoomDetails ? '' : 'py-3'}`} style={{ border: '2px solid #e9ecef' }}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold`} style={getStatusPillStyle(getRoomAvailabilityStatus(room))}>
                      {getRoomAvailabilityStatus(room)}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#1a237e' }}>
                        Room {room.room_number || room.room_id}
                      </h3>
                      <p className="text-sm" style={{ color: '#6c757d' }}>
                        {showRoomDetails && (
                          <>
                            {room.room_type_name} • Capacity: {room.capacity} • Rate: Rs. {room.daily_rate || 'N/A'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm" style={{ color: '#6c757d' }}>
                    {room.bookings?.length || 0} booking{(room.bookings?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>

                {showRoomDetails && room.bookings?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium" style={{ color: '#495057' }}>Bookings:</div>
                    {room.bookings.map((booking) => (
                      <div
                        key={`${room.room_id}-${booking.booking_id}`}
                        className="rounded-lg p-3"
                        style={{ border: '2px solid #e9ecef', background: 'white' }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold`} style={getBookingPillStyle(booking.status)}>
                              {booking.status}
                            </span>
                            <span className="font-medium" style={{ color: '#1a237e' }}>
                              #{booking.booking_id} - {booking.guest_name || 'Guest'}
                            </span>
                          </div>
                          <div className="text-sm" style={{ color: '#6c757d' }}>
                            {booking.date_range_pretty ||
                              `${booking.check_in_pretty || booking.check_in_date} → ${booking.check_out_pretty || booking.check_out_date}`}
                          </div>
                        </div>
                        {booking.meta && (
                          <div className="mt-2 space-y-1 text-xs" style={{ color: '#495057' }}>
                            {booking.meta.specialRequests && (
                              <p>
                                <span className="font-semibold" style={{ color: '#1a237e' }}>Requests:</span> {booking.meta.specialRequests}
                              </p>
                            )}
                            {booking.meta.guestAlerts && (
                              <p>
                                <span className="font-semibold" style={{ color: '#c62828' }}>Alerts:</span> {booking.meta.guestAlerts}
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
        <div className="bg-white rounded-2xl shadow-xl p-6" style={{ border: '2px solid #e0e0e0' }}>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#adb5bd' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a237e' }}>No Rooms Found</h3>
            <p className="mb-4" style={{ color: '#495057' }}>
              No rooms found for the selected filters. Try adjusting your date range or room type filter.
            </p>
            <button
              onClick={loadTimeline}
              className="px-6 py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)' }}
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
            className="px-6 py-3 rounded-xl font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)' }}
          >
            {timelineLoading ? 'Loading...' : `Load More Rooms (${timelineData.rooms.length} loaded)`}
          </button>
          <p className="text-sm mt-2" style={{ color: '#6c757d' }}>
            Load more rooms for better availability overview
          </p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && timelineData?.rooms?.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-slate-300">
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
                        : 'border-border dark:border-slate-600 hover:bg-slate-900'
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
  );
}

export default RoomAvailabilityPage;
