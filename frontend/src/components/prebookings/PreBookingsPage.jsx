import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, AlertCircle, X, ArrowRight, Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

const PreBookingsPage = () => {
  const [preBookings, setPreBookings] = useState([]);
  const [allPreBookings, setAllPreBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPreBooking, setSelectedPreBooking] = useState(null);

  // Branch filtering state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  // Room type filtering state
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  
  // Date filtering state
  const [dateFilters, setDateFilters] = useState({
    start_date: '',
    end_date: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [hasMorePreBookings, setHasMorePreBookings] = useState(true);

  // Rooms snapshot to show current reserved counts per room type
  const [roomsSnapshot, setRoomsSnapshot] = useState([]);
  // Last allocation details returned from backend
  const [allocationSummary, setAllocationSummary] = useState(null); // {reserved, processed}
  const [allocationDetails, setAllocationDetails] = useState([]); // [{pre_booking_id, reserved, reason?}]
  const allocationDetailsMap = useMemo(() => {
    const map = new Map();
    for (const d of allocationDetails || []) map.set(Number(d.pre_booking_id), d);
    return map;
  }, [allocationDetails]);
  const reservedByTypeBranch = useMemo(() => {
    const map = new Map();
    for (const r of roomsSnapshot) {
      const status = String(r.status || r.room_status || '').toLowerCase();
      const typeId = r.room_type_id || r.room_type?.room_type_id;
      const branchId = r.branch_id || r.branch?.branch_id;
      if (status === 'reserved' && typeId && branchId) {
        const key = `${typeId}-${branchId}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return map;
  }, [roomsSnapshot]);

  const branchOptions = useMemo(
    () => [
      { branch_id: '', branch_name: 'All Branches' },
      ...branches,
    ],
    [branches],
  );

  const roomTypeOptions = useMemo(
    () => [
      { room_type_id: '', name: 'All Room Types' },
      ...roomTypes,
    ],
    [roomTypes],
  );

  const fetchRoomsSnapshot = async () => {
    try {
      // Use all-rooms endpoint so Reserved rooms are included
      const roomsData = await api.getAllRooms?.({ limit: 10000 });
      const list = Array.isArray(roomsData?.rooms) ? roomsData.rooms : Array.isArray(roomsData) ? roomsData : [];
      setRoomsSnapshot(list);
    } catch {
      setRoomsSnapshot([]);
    }
  };

  useEffect(() => {
    loadBranches();
    loadRoomTypes();
    loadPreBookings();
    fetchRoomsSnapshot();
  }, []);

  useEffect(() => {
    // Reload pre-bookings when branch, room type, or date filters change
    if (branches.length > 0 && roomTypes.length > 0) {
      loadPreBookings();
    }
  }, [selectedBranch, selectedRoomType, dateFilters.start_date, dateFilters.end_date]);

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
      const roomTypesData = await api.getRoomTypes();
      setRoomTypes(roomTypesData);
    } catch (error) {
      console.error('Failed to load room types:', error);
    }
  };

  const loadPreBookings = async (page = 1, append = false) => {
    try {
      setError(null);
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
      
      // Add date filters if selected - backend expects 'from' and 'to'
      if (dateFilters.start_date) {
        params.from = dateFilters.start_date;
        console.log('Adding start date filter (from):', dateFilters.start_date);
      }
      if (dateFilters.end_date) {
        params.to = dateFilters.end_date;
        console.log('Adding end date filter (to):', dateFilters.end_date);
      }
      
      console.log('Loading pre-bookings with params:', params);
      
      const data = await api.getPreBookings(params);
      // Backend returns { pre_bookings: [...] }
      const preBookingsList = data?.pre_bookings || data || [];
      const preBookingsData = Array.isArray(preBookingsList) ? preBookingsList : [];
      
      if (append) {
        setAllPreBookings(prev => [...prev, ...preBookingsData]);
      } else {
        setAllPreBookings(preBookingsData);
      }
      
      setPreBookings(preBookingsData);
      
      // Update pagination info if available
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          page: data.pagination.page || page,
          total: data.pagination.total || preBookingsData.length,
          totalPages: data.pagination.totalPages || 1
        }));
        setHasMorePreBookings((data.pagination.page || page) < (data.pagination.totalPages || 1));
      } else {
        // Fallback for simple array response
        setHasMorePreBookings(preBookingsData.length >= pagination.limit);
      }
    } catch (error) {
      console.error('Failed to load pre-bookings:', error);
      setError(error.message);
      setPreBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToBooking = (preBooking) => {
    setSelectedPreBooking(preBooking);
    setShowConvertModal(true);
  };

  const handleEditPreBooking = (preBooking) => {
    setSelectedPreBooking(preBooking);
    setShowEditModal(true);
  };

  const handleDeletePreBooking = async (preBooking) => {
    if (window.confirm(`Are you sure you want to delete pre-booking #${preBooking.pre_booking_id}?`)) {
      try {
        await api.deletePreBooking(preBooking.pre_booking_id);
        alert('Pre-booking deleted successfully!');
        loadPreBookings(pagination.page);
      } catch (error) {
        alert('Failed to delete pre-booking: ' + error.message);
      }
    }
  };

  // Calculate stats
  const totalPreBookings = pagination.total;
  const pendingCount = allPreBookings.filter(pb => pb.status === 'Pending').length;
  const confirmedCount = allPreBookings.filter(pb => pb.status === 'Confirmed').length;

  if (loading && allPreBookings.length === 0) {
    return <LoadingSpinner size="xl" message="Loading pre-bookings..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ background: '#f8f9fa' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold" style={{ color: '#1a237e' }}>Pre-Bookings</h1>
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #ffcdd2' }}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" style={{ color: '#d32f2f' }} />
              <div>
                <p className="font-semibold" style={{ color: '#c62828' }}>Error loading pre-bookings</p>
                <p className="text-sm" style={{ color: '#6c757d' }}>{error}</p>
                <button 
                  type="button"
                  onClick={loadPreBookings} 
                  className="mt-3 px-4 py-2 text-sm rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
                  style={{
                    background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)',
                    boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                  <Calendar className="w-12 h-12 text-white" />
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Pre-Bookings Management</h1>
                    <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Advance booking requests and reservations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  New Pre-Booking
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const res = await api.allocatePendingPreBookings();
                      if (res && (res.success || res.reserved !== undefined)) {
                        const extra = Array.isArray(res.details) && res.details.some(d => d.reason)
                          ? `\n\nNotes:\n` + res.details.filter(d => d.reason).map(d => `#${d.pre_booking_id}: ${d.reason}`).join('\n')
                          : '';
                        alert(`Reserved ${res.reserved || 0} room(s) across ${res.processed || 0} pending pre-booking(s).${extra}`);
                        setAllocationSummary({ reserved: res.reserved || 0, processed: res.processed || 0 });
                        setAllocationDetails(res.details || []);
                      } else {
                        alert('No pending pre-bookings required allocation.');
                        setAllocationSummary({ reserved: 0, processed: 0 });
                        setAllocationDetails([]);
                      }
                      await Promise.all([
                        loadPreBookings(pagination.page),
                        fetchRoomsSnapshot(),
                      ]);
                    } catch (e) {
                      alert(`Failed to allocate pending pre-bookings: ${e?.message || 'Unknown error'}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
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
                  <ArrowRight className="w-5 h-5" />
                  Allocate Pending
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const res = await api.reconcileReservedRooms();
                      alert(`Released ${res.released || 0} extra reserved room(s).`);
                      await Promise.all([
                        loadPreBookings(pagination.page),
                        fetchRoomsSnapshot(),
                      ]);
                    } catch (e) {
                      alert(`Failed to reconcile: ${e?.message || 'Unknown error'}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
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
                  Reconcile Reservations
                </button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 hover:bg-white/30 transition-all duration-300 border border-white/30">
                  <div className="text-white text-sm font-semibold mb-2">Total Pre-Bookings</div>
                  <div className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{totalPreBookings}</div>
                  <div className="text-sm text-white/80 mt-1">{pagination.totalPages} pages</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 hover:bg-white/30 transition-all duration-300 border border-white/30">
                  <div className="text-white text-sm font-semibold mb-2">Pending</div>
                  <div className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{pendingCount}</div>
                  <div className="text-sm text-white/80 mt-1">Awaiting confirmation</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 hover:bg-white/30 transition-all duration-300 border border-white/30">
                  <div className="text-white text-sm font-semibold mb-2">Confirmed</div>
                  <div className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{confirmedCount}</div>
                  <div className="text-sm text-white/80 mt-1">Ready to convert</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Filter */}
      {/* Allocation Result Banner */}
      {allocationSummary && (
        <div className="bg-white rounded-xl shadow-lg p-6 overflow-visible" style={{ border: '2px solid #e0e0e0' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-bold" style={{ color: '#1a237e' }}>
                Allocation Result: Reserved {allocationSummary.reserved} room(s) across {allocationSummary.processed} pre-booking(s)
              </div>
              {Array.isArray(allocationDetails) && allocationDetails.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {allocationDetails.map((d, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: '#1a237e' }}>#{d.pre_booking_id}</span>
                      <span style={{ color: '#495057' }}>→ reserved {d.reserved || 0}</span>
                      {d.reason && (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }}>
                          {d.reason}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setAllocationSummary(null); setAllocationDetails([]); }}
              className="px-4 py-2 rounded-lg font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

        <div className="bg-white rounded-xl shadow-lg p-6 overflow-visible" style={{ border: '2px solid #e0e0e0' }}>
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="w-5 h-5" style={{ color: '#1a237e' }} />
            <span className="font-semibold whitespace-nowrap" style={{ color: '#495057' }}>Filter by Branch:</span>
          </div>
          <div className="flex-1 min-w-0">
            <SearchableDropdown
              value={selectedBranch}
              onChange={(value) => setSelectedBranch(value || '')}
              options={branchOptions}
              placeholder="All Branches"
              className="w-full"
              hideSearch={branchOptions.length <= 6}
              displayKey="branch_name"
              valueKey="branch_id"
              searchKeys={['branch_name', 'branch_code']}
              renderOption={(branch) => `${branch.branch_name} (${branch.branch_code || ''})`}
              buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
              dropdownClassName="!border-gray-300"
            />
          </div>
          {selectedBranch && (
            <button
              onClick={() => setSelectedBranch('')}
              className="dropdown-option-button text-sm font-semibold transition-all whitespace-nowrap shrink-0 px-4 py-2 rounded-lg"
              style={{ 
                color: 'white',
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                border: '2px solid transparent',
                minWidth: 'fit-content',
                boxShadow: '0 2px 8px rgba(26, 35, 126, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.setProperty('background', 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', 'important');
                e.target.style.setProperty('color', 'white', 'important');
                e.target.style.boxShadow = '0 4px 12px rgba(26, 35, 126, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)';
                e.target.style.color = 'white';
                e.target.style.boxShadow = '0 2px 8px rgba(26, 35, 126, 0.3)';
              }}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Room Type Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 overflow-visible" style={{ border: '2px solid #e0e0e0' }}>
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="w-5 h-5" style={{ color: '#1a237e' }} />
            <span className="font-semibold whitespace-nowrap" style={{ color: '#495057' }}>Filter by Room Type:</span>
          </div>
          <div className="flex-1 min-w-0">
            <SearchableDropdown
              value={selectedRoomType}
              onChange={(value) => setSelectedRoomType(value || '')}
              options={roomTypeOptions}
              placeholder="All Room Types"
              className="w-full"
              hideSearch={roomTypeOptions.length <= 6}
              displayKey="name"
              valueKey="room_type_id"
              searchKeys={['name']}
              renderOption={(roomType) => roomType.name}
              buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
              dropdownClassName="!border-gray-300"
            />
          </div>
          {selectedRoomType && (
            <button
              onClick={() => setSelectedRoomType('')}
              className="dropdown-option-button text-sm font-semibold transition-all whitespace-nowrap shrink-0 px-4 py-2 rounded-lg"
              style={{ 
                color: 'white',
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                border: '2px solid transparent',
                minWidth: 'fit-content',
                boxShadow: '0 2px 8px rgba(26, 35, 126, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.setProperty('background', 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', 'important');
                e.target.style.setProperty('color', 'white', 'important');
                e.target.style.boxShadow = '0 4px 12px rgba(26, 35, 126, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)';
                e.target.style.color = 'white';
                e.target.style.boxShadow = '0 2px 8px rgba(26, 35, 126, 0.3)';
              }}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: '#1a237e' }} />
          <span className="font-semibold" style={{ color: '#495057' }}>Filter by Date Range:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
              Start Date
              <span className="block text-xs font-normal mt-0.5" style={{ color: '#6c757d' }}>
                {dateFilters.end_date ? 'Pre-bookings from this date...' : 'Pre-bookings from this date onwards'}
              </span>
            </label>
            <input
              type="date"
              value={dateFilters.start_date}
              onChange={(e) => {
                console.log('Start date changed to:', e.target.value);
                setDateFilters({...dateFilters, start_date: e.target.value});
              }}
              className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: '#dee2e6',
                background: 'white',
                color: '#495057',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a237e';
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
              End Date
              <span className="block text-xs font-normal mt-0.5" style={{ color: '#6c757d' }}>
                {dateFilters.start_date ? '...to this date' : 'Pre-bookings up to this date'}
              </span>
            </label>
            <input
              type="date"
              value={dateFilters.end_date}
              onChange={(e) => {
                console.log('End date changed to:', e.target.value);
                setDateFilters({...dateFilters, end_date: e.target.value});
              }}
              className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
              style={{
                borderColor: '#dee2e6',
                background: 'white',
                color: '#495057',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1a237e';
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dee2e6';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
        {/* Clear Date Filters Button */}
        {(dateFilters.start_date || dateFilters.end_date) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setDateFilters({start_date: '', end_date: ''})}
              className="px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105 border-0 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)',
                boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
              }}
            >
              Clear Date Filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1a237e' }}></div>
            <p className="mt-4" style={{ color: '#495057' }}>Loading pre-bookings...</p>
          </div>
        ) : preBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#adb5bd' }} />
            <p style={{ color: '#495057' }}>No pre-bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {preBookings.map(preBooking => (
              <div key={preBooking.pre_booking_id} className="rounded-lg p-6 hover:shadow-md transition-shadow" style={{ border: '2px solid #e0e0e0', background: 'white' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: '#1a237e' }}>
                        {preBooking.prebooking_code || `Pre-Booking #${preBooking.pre_booking_id}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        preBooking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        preBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {preBooking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p style={{ color: '#6c757d' }}>Customer</p>
                        <p className="font-medium" style={{ color: '#212529' }}>{preBooking.customer_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Room Type</p>
                        <p className="font-medium" style={{ color: '#212529' }}>{preBooking.room_type_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Rooms</p>
                        <p className="font-medium" style={{ color: '#212529' }}>{preBooking.number_of_rooms || 1}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Branch</p>
                        <p className="font-medium" style={{ color: '#212529' }}>{preBooking.branch_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Reserved Now</p>
                        <div className="font-semibold inline-flex items-center px-3 py-1 rounded-full text-xs"
                          style={{ background: '#e3f2fd', color: '#0d47a1', border: '2px solid #64b5f6', width: 'fit-content' }}>
                          {reservedByTypeBranch.get(`${preBooking.room_type_id}-${preBooking.branch_id}`) || 0}
                        </div>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Last Allocation</p>
                        {(function(){
                          const d = allocationDetailsMap.get(Number(preBooking.pre_booking_id));
                          if (!d) return <span className="text-xs" style={{ color: '#adb5bd' }}>—</span>;
                          return (
                            <div className="text-xs">
                              <span className="font-medium" style={{ color: '#1a237e' }}>reserved {d.reserved || 0}</span>
                              {d.reason && (
                                <div className="mt-1 px-2 py-0.5 rounded-full inline-block" style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }}>
                                  {d.reason}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Check In</p>
                        <p className="font-medium" style={{ color: '#212529' }}>
                          {preBooking.check_in_date ? format(new Date(preBooking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Check Out</p>
                        <p className="font-medium" style={{ color: '#212529' }}>
                          {preBooking.check_out_date ? format(new Date(preBooking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Guests</p>
                        <p className="font-medium" style={{ color: '#212529' }}>{preBooking.number_of_guests || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Auto-Cancel</p>
                        <p className="font-medium" style={{ color: '#212529' }}>
                          {preBooking.auto_cancel_date ? format(new Date(preBooking.auto_cancel_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleEditPreBooking(preBooking)}
                      className="px-4 py-2 rounded-xl font-bold text-white transition-all hover:scale-105 border-0 flex items-center gap-2 text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePreBooking(preBooking)}
                      className="px-4 py-2 rounded-xl font-bold text-white transition-all hover:scale-105 border-0 flex items-center gap-2 text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)',
                        boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => handleConvertToBooking(preBooking)}
                      className="px-4 py-2 rounded-xl font-bold text-white transition-all hover:scale-105 border-0 flex items-center gap-2 text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Convert to Booking
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMorePreBookings && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadPreBookings((pagination.page || 1) + 1, true)}
            disabled={loading}
            className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
            style={{
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
            }}
          >
            {loading ? 'Loading...' : `Load More Pre-Bookings (${allPreBookings.length} loaded)`}
          </button>
          <p className="text-sm mt-2" style={{ color: '#6c757d' }}>
            Load more pre-bookings for better search results
          </p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm" style={{ color: '#495057' }}>
            Showing {preBookings.length} filtered results from {allPreBookings.length} loaded pre-bookings
            {selectedBranch && <span style={{ color: '#1a237e', fontWeight: 'bold' }}> (filtered by branch)</span>}
            {(dateFilters.start_date || dateFilters.end_date) && (
              <span style={{ color: '#1a237e', fontWeight: 'bold' }}>
                {' '}(filtered by dates: 
                {dateFilters.start_date && dateFilters.end_date 
                  ? ` ${dateFilters.start_date} to ${dateFilters.end_date}` 
                  : dateFilters.start_date 
                  ? ` from ${dateFilters.start_date} onwards`
                  : ` up to ${dateFilters.end_date}`})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadPreBookings((pagination.page || 1) - 1)}
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
                    onClick={() => loadPreBookings(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      pageNum === (pagination.page || 1)
                        ? 'bg-luxury-gold text-white border-luxury-gold'
                        : 'border-border dark:border-slate-600 hover:bg-surface-tertiary dark:hover:bg-slate-700/30'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => loadPreBookings((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
              className="px-3 py-2 text-sm border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreatePreBookingModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPreBookings(pagination.page);
          }}
        />
      )}

      {showConvertModal && selectedPreBooking && (
        <ConvertPreBookingModal
          preBooking={selectedPreBooking}
          onClose={() => {
            setShowConvertModal(false);
            setSelectedPreBooking(null);
          }}
          onSuccess={() => {
            setShowConvertModal(false);
            setSelectedPreBooking(null);
            loadPreBookings(pagination.page);
          }}
        />
      )}
      {showEditModal && selectedPreBooking && (
        <EditPreBookingModal
          preBooking={selectedPreBooking}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPreBooking(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedPreBooking(null);
            loadPreBookings(pagination.page);
          }}
        />
      )}
      </div>
    </div>
  );
};

// Create Pre-Booking Modal
const CreatePreBookingModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    room_type_id: '',      // NEW: Required - what type of room needed
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    number_of_rooms: 1,    // NEW: Number of rooms needed
    special_requests: '',
  });
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Fetch customers and room types on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, roomTypesData, branchesData] = await Promise.all([
          api.request('/api/customers'),          // Get customers (not guests)
          api.getRoomTypes(),                     // Get room types
          api.getBranches()                       // Get branches
        ]);
        setCustomers(customersData || []);
        setRoomTypes(roomTypesData || []);
        setBranches(branchesData || []);
        console.log('✅ Loaded real data:', { customers: customersData?.length, roomTypes: roomTypesData?.length, branches: branchesData?.length });
      } catch (error) {
        console.error('Failed to load data:', error);
        setCustomers([]);
        setRoomTypes([]);
        setBranches([]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customer_id || !formData.room_type_id || !formData.check_in_date || !formData.check_out_date || !selectedBranch) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check availability before creating pre-booking
    try {
      console.log('🔍 Checking availability before creating pre-booking...');
      const availabilityData = await api.checkRoomAvailability({
        room_type_id: formData.room_type_id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        quantity: formData.number_of_rooms,
        capacity: formData.number_of_guests,
        branch_id: selectedBranch
      });
      
      console.log('📊 Availability check result:', availabilityData);
      
      // Check if enough rooms are available
      if (availabilityData.summary.available_rooms < formData.number_of_rooms) {
        alert(`❌ Not enough rooms available!\n\nRequested: ${formData.number_of_rooms} rooms\nAvailable: ${availabilityData.summary.available_rooms} rooms\nReserved: ${availabilityData.summary.reserved_rooms} rooms\n\nPlease select different dates or reduce the number of rooms.`);
        return;
      }
      
      console.log('✅ Availability check passed, proceeding with pre-booking creation...');
      
    } catch (error) {
      console.error('Availability check failed:', error);
      alert('Failed to check room availability: ' + error.message);
      return;
    }
    
    setLoading(true);
    try {
      const preBookingData = {
        customer_id: Number(formData.customer_id),      // Who is making the booking
        room_type_id: Number(formData.room_type_id),    // What type of room needed
        capacity: Number(formData.number_of_guests),
        number_of_rooms: Number(formData.number_of_rooms), // NEW: Number of rooms
        prebooking_method: 'Walk-in',                   // Default method
        expected_check_in: formData.check_in_date,
        expected_check_out: formData.check_out_date,
        room_id: null,                                   // Room not assigned yet
        branch_id: Number(selectedBranch),               // Branch for this pre-booking
        special_requests: formData.special_requests,     // NEW: Special requests
        is_group_booking: Number(formData.number_of_rooms) > 1, // NEW: Auto-detect group booking
      };
      await api.createPreBooking(preBookingData);
      alert('Pre-booking created successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to create pre-booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canQuote = formData.room_type_id && formData.check_in_date && formData.check_out_date;
  const getQuote = async () => {
    if (!canQuote) return;
    setQuoteLoading(true);
    setQuote(null);
    try {
      const data = await api.getRateQuote({
        room_type_id: formData.room_type_id,
        check_in: formData.check_in_date,
        check_out: formData.check_out_date,
      });
      setQuote(data);
    } catch (e) {
      alert('Failed to get rate quote: ' + e.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!formData.room_type_id || !formData.check_in_date || !formData.check_out_date || !selectedBranch) {
      alert('Please select room type, dates, and branch first');
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityResult(null);
    
    try {
      const data = await api.checkRoomAvailability({
        room_type_id: formData.room_type_id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        quantity: formData.number_of_rooms,
        capacity: formData.number_of_guests,
        branch_id: selectedBranch  // Add branch filtering
      });
      
      setAvailabilityResult(data);
    } catch (error) {
      console.error('Availability check failed:', error);
      alert('Failed to check availability: ' + error.message);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden" style={{minWidth: '600px', border: '2px solid #e0e0e0'}}>
        {/* Fixed Header */}
        <div className="px-6 py-5 flex-shrink-0 sticky top-0 z-10 rounded-t-2xl" style={{
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
        }}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white">New Pre-Booking</h2>
            <button 
              onClick={onClose} 
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#f8f9fa' }}>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5" style={{width: '100%'}}>
          {loadingData ? (
            <div className="text-center py-8" style={{ color: '#495057' }}>Loading...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
                  Branch <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={branches}
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  placeholder="Select a branch"
                  searchPlaceholder="Search branches..."
                  displayKey="branch_name"
                  valueKey="branch_id"
                  searchKeys={['branch_name', 'branch_code']}
                  renderOption={(branch) => `${branch.branch_name} (${branch.branch_code})`}
                  required
                  buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                  dropdownClassName="!border-gray-300"
                />
                <p className="text-xs mt-1" style={{ color: '#6c757d' }}>
                  Select the hotel branch for this pre-booking
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
                  Customer (Who is booking) <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={customers}
                  value={formData.customer_id}
                  onChange={(value) => setFormData({...formData, customer_id: value})}
                  placeholder="Select customer"
                  searchPlaceholder="Search customers..."
                  displayKey="full_name"
                  valueKey="customer_id"
                  searchKeys={['full_name', 'guest_name', 'email', 'phone']}
                  renderOption={(customer) => `${customer.guest_name || customer.full_name} - ${customer.email || customer.phone || `ID: ${customer.customer_id}`}`}
                  required
                  buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                  dropdownClassName="!border-gray-300"
                />
                <p className="text-xs mt-1" style={{ color: '#6c757d' }}>
                  The person making the booking (may differ from guest who stays)
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
                  Room Type Needed <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={roomTypes}
                  value={formData.room_type_id}
                  onChange={(value) => setFormData({...formData, room_type_id: value})}
                  placeholder="Select room type"
                  searchPlaceholder="Search room types..."
                  displayKey="name"
                  valueKey="room_type_id"
                  searchKeys={['name', 'type_name']}
                  renderOption={(type) => `${type.name || type.type_name} - Rs.${parseFloat(type.daily_rate || 0).toFixed(2)}/night`}
                  required
                  buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                  dropdownClassName="!border-gray-300"
                />
                <p className="text-xs mt-1" style={{ color: '#6c757d' }}>
                  Required: What type of room is needed for this booking
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
                    Check In Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={{
                      borderColor: '#dee2e6',
                      background: 'white',
                      color: '#495057',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1a237e';
                      e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#dee2e6';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
                    Check Out Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: '#dee2e6',
                    background: 'white',
                    color: '#495057',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1a237e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#dee2e6';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
                  Number of Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.number_of_guests}
                  onChange={(e) => setFormData({...formData, number_of_guests: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: '#dee2e6',
                    background: 'white',
                    color: '#495057',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1a237e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#dee2e6';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>
                  Number of Rooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.number_of_rooms}
                  onChange={(e) => setFormData({...formData, number_of_rooms: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: '#dee2e6',
                    background: 'white',
                    color: '#495057',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1a237e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#dee2e6';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
                <p className="text-xs mt-1" style={{ color: '#6c757d' }}>
                  How many rooms of this type do you need?
                </p>
              </div>

              {/* Room Availability Check */}
              {formData.room_type_id && formData.check_in_date && formData.check_out_date && selectedBranch && (
                <div className="rounded-xl p-4 shadow-lg" style={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold flex items-center gap-2" style={{ color: '#059669' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }}></span>
                      Room Availability
                    </h4>
                    <button
                      type="button"
                      onClick={checkAvailability}
                      disabled={availabilityLoading}
                      className="px-4 py-2 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      }}
                      onMouseEnter={(e) => !availabilityLoading && (e.target.style.transform = 'scale(1.02)')}
                      onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                    >
                      {availabilityLoading ? 'Checking...' : 'Check Availability'}
                    </button>
                  </div>
                  
                  {availabilityResult && (
                    <div className="text-sm">
                      {availabilityResult.available ? (
                        <div style={{ color: '#059669' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }}></div>
                            <span className="font-medium">Rooms Available</span>
                          </div>
                          <p className="text-xs" style={{ color: '#6c757d' }}>
                            {availabilityResult.summary.available_rooms} of {availabilityResult.summary.total_rooms} rooms available
                            {availabilityResult.summary.reserved_rooms > 0 && (
                              <span className="ml-1" style={{ color: '#1a237e' }}>
                                ({availabilityResult.summary.reserved_rooms} reserved)
                              </span>
                            )}
                          </p>
                          {availabilityResult.summary.available_rooms >= formData.number_of_rooms ? (
                            <p className="text-xs font-medium mt-1" style={{ color: '#059669' }}>
                              ✓ Sufficient rooms for your request
                            </p>
                          ) : (
                            <p className="text-xs font-medium mt-1" style={{ color: '#dc2626' }}>
                              ⚠ Only {availabilityResult.summary.available_rooms} rooms available (need {formData.number_of_rooms})
                            </p>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#dc2626' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }}></div>
                            <span className="font-medium">No Rooms Available</span>
                          </div>
                          <p className="text-xs" style={{ color: '#6c757d' }}>
                            All rooms of this type are booked for the selected dates
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Helpful message */}
                  <div className="mt-3 p-3 rounded-lg" style={{ 
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)'
                  }}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div className="text-sm">
                        <span className="font-bold" style={{ color: '#d97706' }}>Tip:</span>
                        <span className="ml-1" style={{ color: '#6c757d' }}>The system will automatically check availability before creating your pre-booking. If no rooms are available, the creation will be blocked.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={getQuote} 
                  disabled={!canQuote || quoteLoading} 
                  className="px-4 py-2 rounded-xl font-semibold text-white transition-all hover:scale-105 border-0"
                  style={{
                    background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                    opacity: (!canQuote || quoteLoading) ? 0.5 : 1,
                    cursor: (!canQuote || quoteLoading) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {quoteLoading ? 'Getting Quote...' : 'Get Rate Quote'}
                </button>
                {quote && (
                  <div className="text-sm" style={{ color: '#495057' }}>
                    <span className="font-medium">Quote:</span> {quote.nights} night{quote.nights>1?'s':''} · Total Rs {parseFloat(quote.total).toFixed(2)}
                  </div>
                )}
              </div>
              {quote && quote.nightly?.length > 0 && (
                <div className="rounded-xl p-4" style={{ 
                  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.05) 0%, rgba(13, 71, 161, 0.05) 100%)',
                  border: '2px solid rgba(26, 35, 126, 0.2)'
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#1a237e' }}></span>
                    <div className="text-sm font-bold" style={{ color: '#1a237e' }}>Nightly Rates Breakdown</div>
                  </div>
                  <div className="space-y-2">
                    {quote.nightly.map((n, index) => (
                      <div key={n.date} className="flex justify-between items-center py-2 px-3 rounded-lg" style={{ 
                        background: 'white',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium" style={{ color: '#6c757d' }}>Day {index + 1}</span>
                          <span className="font-medium" style={{ color: '#495057' }}>{new Date(n.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <span className="font-bold" style={{ color: '#1a237e' }}>Rs {parseFloat(n.rate).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(26, 35, 126, 0.2)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold" style={{ color: '#1a237e' }}>Total Nights:</span>
                      <span className="font-bold" style={{ color: '#1a237e' }}>{quote.nightly.length} nights</span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Special Requests</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all"
                  style={{
                    borderColor: '#dee2e6',
                    background: 'white',
                    color: '#495057',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1a237e';
                    e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#dee2e6';
                    e.target.style.boxShadow = 'none';
                  }}
                  rows="3"
                  placeholder="Any special requirements..."
                />
              </div>
            </>
          )}
          </form>
        </div>
        
        {/* Fixed Footer */}
        <div className="p-4 sm:p-6 flex-shrink-0 sticky bottom-0 z-10 rounded-b-2xl" style={{ 
          background: 'white',
          borderTop: '2px solid #e0e0e0'
        }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              type="button" 
              onClick={onClose} 
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
              disabled={loading || loadingData} 
              onClick={handleSubmit}
              className="dropdown-option-button px-6 py-3 font-bold rounded-xl transition-all flex-1"
              style={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                color: 'white',
                border: '2px solid transparent',
                boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                opacity: (loading || loadingData) ? 0.5 : 1,
                cursor: (loading || loadingData) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create Pre-Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Convert Pre-Booking to Booking Modal
const ConvertPreBookingModal = ({ preBooking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    guest_id: '',         // Who will actually stay (can be different from customer)
    room_id: '',          // For individual bookings
    room_type_id: '',     // For group bookings
    room_quantity: 1,     // For group bookings
    booked_rate: '',
    tax_rate_percent: 0,
    advance_payment: 0,
    group_name: '',       // For group bookings
  });
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const guestOptions = useMemo(
    () =>
      (Array.isArray(guests) ? guests : []).map((guest) => ({
        id: String(guest.guest_id ?? guest.id ?? ''),
        name: guest.full_name || guest.name || `Guest ${guest.guest_id}`,
        subtitle: guest.email || guest.phone || '',
      })),
    [guests],
  );

  const roomTypeOptions = useMemo(
    () =>
      (Array.isArray(roomTypes) ? roomTypes : []).map((roomType) => ({
        id: String(roomType.room_type_id ?? roomType.id ?? ''),
        name: roomType.name || `Room Type ${roomType.room_type_id}`,
        rate: roomType.daily_rate,
      })),
    [roomTypes],
  );

  const roomOptions = useMemo(
    () =>
      (Array.isArray(rooms) ? rooms : []).map((room) => ({
        id: String(room.room_id ?? room.id ?? ''),
        name: `${room.room_number} - ${room.room_type_name || room.room_type}`,
        floor: room.floor,
        status: room.status,
        rate: room.price_per_night || room.daily_rate || room.base_rate,
      })),
    [rooms],
  );

  // Determine if this is a group booking
  const isGroupBooking = preBooking.number_of_rooms > 1;

  useEffect(() => {
    loadData();
  }, [preBooking]);

  // Recalculate when room type or quantity changes
  useEffect(() => {
    if (formData.room_type_id && roomTypes.length > 0) {
      calculateBookingDetails(formData.room_type_id, formData.room_quantity);
    }
  }, [formData.room_type_id, formData.room_quantity, roomTypes]);

  // Auto-calculate on initial load when room types are available
  useEffect(() => {
    if (preBooking.room_type_id && roomTypes.length > 0 && !formData.booked_rate) {
      calculateBookingDetails(preBooking.room_type_id, preBooking.number_of_rooms || 1);
    }
  }, [roomTypes, preBooking.room_type_id, preBooking.number_of_rooms, formData.booked_rate]);

  const calculateBookingDetails = (roomTypeId, roomQuantity = 1) => {
    console.log('=== CALCULATING BOOKING DETAILS ===');
    console.log('roomTypeId:', roomTypeId);
    console.log('roomQuantity:', roomQuantity);
    console.log('roomTypes.length:', roomTypes.length);
    console.log('preBooking:', preBooking);
    
    if (!roomTypeId || !roomTypes.length) {
      console.log('Missing roomTypeId or roomTypes');
      return;
    }
    
    const selectedRoomType = roomTypes.find(rt => rt.room_type_id == roomTypeId);
    console.log('selectedRoomType:', selectedRoomType);
    
    if (!selectedRoomType) {
      console.log('Room type not found');
      return;
    }
    
    const dailyRate = parseFloat(selectedRoomType.daily_rate || 0);
    console.log('dailyRate:', dailyRate);
    
    // Calculate number of nights from pre-booking dates
    const checkIn = new Date(preBooking.check_in_date || preBooking.expected_check_in);
    const checkOut = new Date(preBooking.check_out_date || preBooking.expected_check_out);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    console.log('checkIn:', checkIn);
    console.log('checkOut:', checkOut);
    console.log('nights:', nights);
    
    // Calculate total stay cost and advance payment (10% of total)
    const totalStayCost = dailyRate * roomQuantity * nights;
    const advancePayment = Math.round(totalStayCost * 0.1);
    
    console.log('totalStayCost:', totalStayCost);
    console.log('advancePayment:', advancePayment);
    console.log('=== END CALCULATION ===');
    
    // Only update if we have valid numbers
    if (!isNaN(dailyRate) && !isNaN(advancePayment) && advancePayment > 0) {
      setFormData(prev => ({
        ...prev,
        booked_rate: dailyRate,
        advance_payment: advancePayment,
      }));
    } else {
      console.log('Skipping form update due to invalid values');
    }
  };

  const loadData = async () => {
    try {
      const [guestsData, roomsData, roomTypesData] = await Promise.all([
        api.getGuests(),
        api.request('/api/catalog/rooms'),
        api.getRoomTypes()
      ]);
      
      console.log('=== DEBUGGING CONVERT MODAL DATA ===');
      console.log('guestsData:', guestsData);
      console.log('guestsData type:', typeof guestsData);
      console.log('guestsData isArray:', Array.isArray(guestsData));
      console.log('=== END DEBUGGING ===');
      
      // Extract guests array from response object
      const guestsArray = guestsData?.guests || guestsData || [];
      const roomTypesArray = roomTypesData || [];
      
      setGuests(Array.isArray(guestsArray) ? guestsArray : []);
      setRoomTypes(Array.isArray(roomTypesArray) ? roomTypesArray : []);
      
      // Filter rooms by the room type requested in pre-booking
      const filteredRooms = roomsData.filter(r => {
        const isAvailable = r.status === 'Available';
        const matchesType = preBooking.room_type_id 
          ? r.room_type_id == preBooking.room_type_id 
          : true;
        return isAvailable && matchesType;
      });
      
      setRooms(filteredRooms);
      
      // Set initial form data based on pre-booking
      setFormData(prev => ({
        ...prev,
        room_type_id: preBooking.room_type_id || '',
        room_quantity: preBooking.number_of_rooms || 1,
        group_name: preBooking.group_name || `Group ${preBooking.pre_booking_id}`,
      }));
      
      // Manually trigger calculation after setting form data and room types
      setTimeout(() => {
        if (preBooking.room_type_id && roomTypesArray.length > 0) {
          console.log('Manual calculation trigger with room types:', roomTypesArray.length);
          calculateBookingDetails(preBooking.room_type_id, preBooking.number_of_rooms || 1);
        } else {
          console.log('Manual calculation skipped - roomTypeId:', preBooking.room_type_id, 'roomTypes:', roomTypesArray.length);
        }
      }, 200);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load guests and rooms');
      // Ensure arrays are set even on error
      setGuests([]);
      setRooms([]);
      setRoomTypes([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRoomSelect = (roomId) => {
    // Auto-fill the booked rate based on room's daily rate
    const selectedRoom = rooms.find(r => r.room_id == roomId);
    
    console.log('Selected room:', selectedRoom); // Debug log
    
    // Try multiple possible field names for the rate
    const rate = selectedRoom?.price_per_night || 
                 selectedRoom?.daily_rate || 
                 selectedRoom?.base_rate || 
                 '';
    
    setFormData(prev => ({
      ...prev,
      room_id: roomId,
      booked_rate: rate
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation based on booking type
    if (!formData.guest_id || !formData.booked_rate) {
      alert('Please select a guest and enter the booking rate');
      return;
    }
    
    if (isGroupBooking) {
      // Group booking validation
      if (!formData.room_type_id || !formData.room_quantity) {
        alert('Please select room type and quantity for group booking');
        return;
      }
    } else {
      // Individual booking validation
      if (!formData.room_id) {
        alert('Please select a room for individual booking');
        return;
      }
    }
    
    setLoading(true);
    try {
      const bookingData = {
        guest_id: Number(formData.guest_id),
        booked_rate: Number(formData.booked_rate),
        tax_rate_percent: Number(formData.tax_rate_percent),
        advance_payment: Number(formData.advance_payment),
        is_group_booking: isGroupBooking,
      };
      
      if (isGroupBooking) {
        // Group booking data
        bookingData.room_type_id = Number(formData.room_type_id);
        bookingData.room_quantity = Number(formData.room_quantity);
        bookingData.group_name = formData.group_name;
      } else {
        // Individual booking data
        bookingData.room_id = Number(formData.room_id);
      }
      
      console.log('=== CONVERT PRE-BOOKING DEBUG ===');
      console.log('preBooking.pre_booking_id:', preBooking.pre_booking_id);
      console.log('bookingData:', bookingData);
      console.log('formData:', formData);
      console.log('=== END CONVERT DEBUG ===');
      
      await api.convertPreBookingToBooking(preBooking.pre_booking_id, bookingData);
      alert(`Pre-booking successfully converted to ${isGroupBooking ? 'group' : 'individual'} booking!`);
      onSuccess();
    } catch (error) {
      alert('Failed to convert pre-booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-white">
            Convert Pre-Booking to Booking
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Pre-Booking Details */}
        <div className="p-6 bg-surface-tertiary border-b border-border">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Pre-Booking Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-300">Booked By (Customer)</p>
              <p className="font-medium text-white">{preBooking.customer_name}</p>
            </div>
            <div>
              <p className="text-slate-300">Room Type Requested</p>
              <p className="font-medium text-white">{preBooking.room_type_name || 'Any'}</p>
            </div>
            <div>
              <p className="text-slate-300">Check In</p>
              <p className="font-medium text-white">
                {format(new Date(preBooking.check_in_date), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-slate-300">Check Out</p>
              <p className="font-medium text-white">
                {format(new Date(preBooking.check_out_date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loadingData ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : (
            <>
              <div className="bg-blue-900/20 dark:bg-blue-900/200/15 border border-blue-700 dark:border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-200">
                  <strong>Note:</strong> Select the guest who will actually stay in the hotel. 
                  This can be the same as the customer who booked, or a different person.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Guest (Who will stay) <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  value={formData.guest_id}
                  onChange={(value) => setFormData({ ...formData, guest_id: value })}
                  options={guestOptions}
                  placeholder="Select the guest who will stay"
                  searchPlaceholder="Search guests..."
                  className="w-full"
                  clearable={false}
                  renderOption={(option) => (
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{option.name}</span>
                      {option.subtitle && (
                        <span className="text-xs text-slate-300">{option.subtitle}</span>
                      )}
                    </div>
                  )}
                  renderSelected={(option) =>
                    option ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{option.name}</span>
                        {option.subtitle && (
                          <span className="text-xs text-slate-300">{option.subtitle}</span>
                        )}
                      </div>
                    ) : (
                      'Select the guest who will stay'
                    )
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  The person who will actually stay in the room (may differ from customer)
                </p>
              </div>

              {isGroupBooking ? (
                // Group Booking Form
                <>
                  <div className="bg-green-900/20 dark:bg-emerald-900/200/15 border border-green-700 dark:border-emerald-500/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-200">
                      <strong>Group Booking:</strong> This pre-booking requires {preBooking.number_of_rooms} rooms of type {preBooking.room_type_name}.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Room Type <span className="text-red-500">*</span>
                    </label>
                    <SearchableDropdown
                      value={formData.room_type_id}
                      onChange={(value) => setFormData({ ...formData, room_type_id: value })}
                      options={roomTypeOptions}
                      placeholder="Select room type"
                      searchPlaceholder="Search room types..."
                      className="w-full"
                      clearable={false}
                      renderOption={(option) => (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{option.name}</span>
                          {option.rate && (
                            <span className="text-xs text-slate-300">
                              Rs {parseFloat(option.rate || 0).toFixed(2)}/night
                            </span>
                          )}
                        </div>
                      )}
                      renderSelected={(option) =>
                        option ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-white">{option.name}</span>
                            {option.rate && (
                              <span className="text-xs text-slate-300">
                                Rs {parseFloat(option.rate || 0).toFixed(2)}/night
                              </span>
                            )}
                          </div>
                        ) : (
                          'Select room type'
                        )
                      }
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Rooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.room_quantity}
                      onChange={(e) => setFormData({...formData, room_quantity: e.target.value})}
                      className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                      className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                      placeholder="Enter group name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Booking Rate (per night) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.booked_rate}
                      onChange={(e) => setFormData({...formData, booked_rate: e.target.value})}
                      className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_rate_percent}
                      onChange={(e) => setFormData({...formData, tax_rate_percent: e.target.value})}
                      className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Advance Payment
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.advance_payment}
                      onChange={(e) => setFormData({...formData, advance_payment: e.target.value})}
                      className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                      placeholder="0.00"
                    />
                  </div>
                </>
              ) : (
                // Individual Booking Form
                <>
                  {rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 font-medium">
                        No {preBooking.room_type_name || ''} rooms available
                      </p>
                      <p className="text-sm text-slate-300 mt-1">Please check back later</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Select Room ({preBooking.room_type_name}) <span className="text-red-500">*</span>
                        </label>
                        <SearchableDropdown
                          value={formData.room_id}
                          onChange={(value) => handleRoomSelect(value)}
                          options={roomOptions}
                          placeholder="Choose an available room"
                          searchPlaceholder="Search rooms..."
                          className="w-full"
                          clearable={false}
                          renderOption={(option) => (
                            <div className="flex flex-col">
                              <span className="font-medium text-white">{option.name}</span>
                              <span className="text-xs text-slate-300">
                                {option.floor ? `Floor ${option.floor} · ` : ''}
                                {option.rate ? `Rs ${parseFloat(option.rate || 0).toFixed(2)}/night` : 'Rate unavailable'}
                              </span>
                            </div>
                          )}
                          renderSelected={(option) =>
                            option ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-white">{option.name}</span>
                                <span className="text-xs text-slate-300">
                                  {option.floor ? `Floor ${option.floor} · ` : ''}
                                  {option.rate ? `Rs ${parseFloat(option.rate || 0).toFixed(2)}/night` : 'Rate unavailable'}
                                </span>
                              </div>
                            ) : (
                              'Choose an available room'
                            )
                          }
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Showing {rooms.length} available {preBooking.room_type_name || ''} room(s)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Booking Rate (per night) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.booked_rate}
                          onChange={(e) => setFormData({...formData, booked_rate: e.target.value})}
                          className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.tax_rate_percent}
                          onChange={(e) => setFormData({...formData, tax_rate_percent: e.target.value})}
                          className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                          placeholder="10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Advance Payment
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.advance_payment}
                          onChange={(e) => setFormData({...formData, advance_payment: e.target.value})}
                          className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                          placeholder="0.00"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || loadingData || rooms.length === 0} 
              className="btn-primary flex-1"
            >
              {loading ? 'Converting...' : 'Convert to Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreBookingsPage;

// Edit Pre-Booking Modal
const EditPreBookingModal = ({ preBooking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_id: preBooking.customer_id || '',
    room_type_id: preBooking.room_type_id || '',
    check_in_date: preBooking.expected_check_in || '',
    check_out_date: preBooking.expected_check_out || '',
    number_of_guests: preBooking.capacity || 1,
    number_of_rooms: preBooking.number_of_rooms || 1,
    special_requests: preBooking.special_requests || '',
  });
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(preBooking.branch_id || '');
  const [customers, setCustomers] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, roomTypesData, branchesData] = await Promise.all([
          api.request('/api/customers'),
          api.getRoomTypes(),
          api.getBranches()
        ]);
        console.log('=== DEBUGGING ROOM TYPES ===');
        console.log('Room types data received:', roomTypesData);
        console.log('First room type:', roomTypesData?.[0]);
        console.log('Room type daily_rate field:', roomTypesData?.[0]?.daily_rate);
        console.log('=== END DEBUGGING ===');
        setCustomers(customersData || []);
        setRoomTypes(roomTypesData || []);
        setBranches(branchesData || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const preBookingData = {
        customer_id: Number(formData.customer_id),
        room_type_id: Number(formData.room_type_id),
        capacity: Number(formData.number_of_guests),
        number_of_rooms: Number(formData.number_of_rooms),
        prebooking_method: 'Walk-in',
        expected_check_in: formData.check_in_date,
        expected_check_out: formData.check_out_date,
        room_id: null,
        branch_id: Number(selectedBranch),
        special_requests: formData.special_requests,
        is_group_booking: Number(formData.number_of_rooms) > 1,
      };
      await api.updatePreBooking(preBooking.pre_booking_id, preBookingData);
      alert('Pre-booking updated successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to update pre-booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-2 sm:p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Edit Pre-Booking</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {loadingData ? (
              <div className="text-center py-8 text-slate-400">Loading...</div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Customer (Who is booking) <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={customers}
                    value={formData.customer_id}
                    onChange={(value) => setFormData({...formData, customer_id: value})}
                    placeholder="Select customer"
                    searchPlaceholder="Search customers..."
                    displayKey="full_name"
                    valueKey="customer_id"
                    searchKeys={['full_name', 'guest_name', 'email', 'phone']}
                    renderOption={(customer) => `${customer.guest_name || customer.full_name} - ${customer.email || customer.phone || `ID: ${customer.customer_id}`}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={branches}
                    value={selectedBranch}
                    onChange={setSelectedBranch}
                    placeholder="Select a branch"
                    searchPlaceholder="Search branches..."
                    displayKey="branch_name"
                    valueKey="branch_id"
                    searchKeys={['branch_name', 'branch_code']}
                    renderOption={(branch) => `${branch.branch_name} (${branch.branch_code})`}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Select the hotel branch for this pre-booking
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Room Type Needed <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={roomTypes}
                    value={formData.room_type_id}
                    onChange={(value) => setFormData({...formData, room_type_id: value})}
                    placeholder="Select room type"
                    searchPlaceholder="Search room types..."
                    displayKey="name"
                    valueKey="room_type_id"
                    searchKeys={['name', 'type_name']}
                    renderOption={(type) => `${type.name || type.type_name} - Rs.${parseFloat(type.daily_rate || 0).toFixed(2)}/night`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Check In Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                    className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Check Out Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
                    className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_guests}
                    onChange={(e) => setFormData({...formData, number_of_guests: e.target.value})}
                    className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_rooms}
                    onChange={(e) => setFormData({...formData, number_of_rooms: e.target.value})}
                    className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Special Requests</label>
                  <textarea
                    value={formData.special_requests}
                    onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                    className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                    rows="3"
                    placeholder="Any special requirements..."
                  />
                </div>
              </>
            )}
          </form>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-border flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || loadingData} className="btn-primary flex-1" onClick={handleSubmit}>
              {loading ? 'Updating...' : 'Update Pre-Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
