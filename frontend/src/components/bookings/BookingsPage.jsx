import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Download, AlertCircle, Clock, Building2, Plus, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import api from '../../utils/api';
import { CreateBookingModal } from './CreateBookingModal';
import { BookingDetailsModal } from './BookingDetailsModal';
import { CheckoutModal } from '../checkout/CheckoutModal';
import OptimizedBookingStatusFilter from '../common/OptimizedBookingStatusFilter';
import { LuxuryPageHeader, LoadingSpinner, SearchableDropdown } from '../common';

export const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestAbortController, setRequestAbortController] = useState(null);
  const [filter, setFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  
  // Branch filtering state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [allBookings, setAllBookings] = useState([]);
  const [hasMoreBookings, setHasMoreBookings] = useState(true);
  const [advancedFilters, setAdvancedFilters] = useState({
    searchCustomer: '',
    searchBookingId: '',
    startDate: '',
    endDate: '',
    roomNumber: '',
  });

  const branchOptions = useMemo(() => {
    const baseOptions = [{ id: '', name: 'All branches' }];
    if (!Array.isArray(branches) || branches.length === 0) {
      return baseOptions;
    }
    return [
      ...baseOptions,
      ...branches.map((branch) => ({
        id: String(branch.branch_id),
        name: branch.branch_name || `Branch ${branch.branch_id}`,
      })),
    ];
  }, [branches]);

  const pageSizeOptions = useMemo(
    () => [
      { id: '2', name: '2 per page' },
      { id: '10', name: '10 per page' },
      { id: '25', name: '25 per page' },
      { id: '50', name: '50 per page' },
      { id: '100', name: '100 per page' },
    ],
    [],
  );

  // Create dropdown options from bookings data
  const customerOptions = useMemo(() => {
    const baseOptions = [{ id: '', name: 'All Customers' }];
    if (!Array.isArray(allBookings) || allBookings.length === 0) {
      return baseOptions;
    }
    const uniqueCustomers = new Map();
    allBookings.forEach((booking) => {
      const customerId = booking.customer_id || booking.guest_id;
      const customerName = booking.customer_name || booking.guest_name || 'Unknown';
      if (customerId && !uniqueCustomers.has(customerId)) {
        uniqueCustomers.set(customerId, customerName);
      }
    });
    return [
      ...baseOptions,
      ...Array.from(uniqueCustomers.entries()).map(([id, name]) => ({
        id: String(id),
        name,
      })),
    ];
  }, [allBookings]);

  const bookingIdOptions = useMemo(() => {
    const baseOptions = [{ id: '', name: 'All Bookings' }];
    if (!Array.isArray(allBookings) || allBookings.length === 0) {
      return baseOptions;
    }
    return [
      ...baseOptions,
      ...allBookings.map((booking) => ({
        id: String(booking.booking_id),
        name: `Booking #${booking.booking_id}`,
      })),
    ];
  }, [allBookings]);

  const roomNumberOptions = useMemo(() => {
    const baseOptions = [{ id: '', name: 'All Rooms' }];
    if (!Array.isArray(allBookings) || allBookings.length === 0) {
      return baseOptions;
    }
    const uniqueRooms = new Set();
    allBookings.forEach((booking) => {
      if (booking.room_number) {
        uniqueRooms.add(booking.room_number);
      }
    });
    return [
      ...baseOptions,
      ...Array.from(uniqueRooms)
        .sort((a, b) => {
          // Sort numerically if possible, otherwise alphabetically
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return String(a).localeCompare(String(b));
        })
        .map((room) => ({
          id: String(room),
          name: `Room ${room}`,
        })),
    ];
  }, [allBookings]);

  // Helper function to get current filters
  const getCurrentFilters = (additionalFilters = {}) => {
    const filters = { ...additionalFilters };
    
    // Apply status filter
    if (filter && filter !== 'All') {
      filters.status = filter;
    }
    
    // Apply date filters - backend expects 'from' and 'to'
    if (advancedFilters.startDate) {
      filters.from = advancedFilters.startDate;
      console.log('Adding start date filter (from):', advancedFilters.startDate);
    }
    if (advancedFilters.endDate) {
      filters.to = advancedFilters.endDate;
      console.log('Adding end date filter (to):', advancedFilters.endDate);
    }
    
    console.log('Current filters being applied:', filters);
    return filters;
  };

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId || '');
  };

  const handlePageSizeChange = (pageSizeId) => {
    const size = Number(pageSizeId);
    const limit = Number.isNaN(size) ? pagination.limit : size;
    setPagination({ ...pagination, limit, page: 1 });
    loadBookings(1, getCurrentFilters({ limit }));
  };

  useEffect(() => {
    loadBranches();
    loadBookings();
  }, []);

  // Apply server-side filters when they change (status and dates only)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300); // Debounce filter changes

    return () => clearTimeout(timeoutId);
  }, [filter, advancedFilters.startDate, advancedFilters.endDate]);

  // Reload bookings when branch filter changes (reset to page 1)
  useEffect(() => {
    if (branches.length > 0) {
      setPagination(prev => ({ ...prev, page: 1 }));
      loadBookings(1, getCurrentFilters());
    }
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      console.log('Loading branches...');
      const branchesData = await api.getBranches();
      console.log('Branches data received:', branchesData);
      console.log('Branches data type:', typeof branchesData, Array.isArray(branchesData));
      const branchList = Array.isArray(branchesData) ? branchesData : branchesData?.branches || [];
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };


  const applyFilters = () => {
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    loadBookings(1, getCurrentFilters());
  };

  const loadBookings = async (page = 1, filters = {}, append = false) => {
    // Cancel any existing request
    if (requestAbortController) {
      requestAbortController.abort();
    }
    
    const abortController = new AbortController();
    setRequestAbortController(abortController);
    
    try {
      setError(null);
      setLoading(true);
      
      const params = {
        page,
        limit: filters.limit || pagination.limit,
        ...filters
      };
      
      // Add branch filter if selected
      if (selectedBranch) {
        params.branch_id = selectedBranch;
      }
      
      console.log('Loading bookings with params:', params);
      const data = await api.getBookings(params);
      
      // Handle both paginated and non-paginated responses
      const bookingsList = data?.bookings || data || [];
      const total = data?.total || bookingsList.length;
      const totalPages = Math.ceil((total || 0) / (pagination.limit || 200));
      
      console.log('Loaded bookings data:', {
        bookings: bookingsList.length,
        total,
        page,
        totalPages
      });
      
      if (append) {
        // Append to existing bookings for better search coverage
        setAllBookings(prev => [...prev, ...bookingsList]);
        setBookings(prev => [...prev, ...bookingsList]);
      } else {
        // Replace bookings
        setAllBookings(bookingsList);
        setBookings(bookingsList);
      }
      
      setPagination(prev => ({
        ...prev,
        page,
        total,
        totalPages
      }));

      // Check if there are more bookings to load
      setHasMoreBookings((page || 1) < (totalPages || 1));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Failed to load bookings:', error);
      setError(error.message);
      setBookings([]);
    } finally {
      setLoading(false);
      setRequestAbortController(null);
    }
  };




  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ background: '#f8f9fa' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold" style={{ color: '#1a237e' }}>Bookings</h1>
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #ffcdd2' }}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" style={{ color: '#d32f2f' }} />
              <div>
                <p className="font-semibold" style={{ color: '#c62828' }}>Error loading bookings</p>
                <p className="text-sm" style={{ color: '#6c757d' }}>{error}</p>
                <button 
                  type="button"
                  onClick={loadBookings} 
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

  const handleCheckIn = async (bookingId) => {
    try {
      await api.request(`/api/bookings/${bookingId}/checkin`, { method: 'POST' });
      loadBookings(pagination.page, getCurrentFilters());
    } catch (error) {
      alert('Failed to check in: ' + error.message);
    }
  };

  const handleCheckOut = (booking) => {
    console.log('Checkout booking data:', booking);
    setCheckoutBooking(booking);
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckoutModal(false);
    setCheckoutBooking(null);
    loadBookings(pagination.page, getCurrentFilters()); // Refresh the bookings list
  };

  const handleAutoCheckout = async () => {
    if (!confirm('This will automatically check out all past bookings that are still in "Checked-In" status. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.autoCheckoutPastBookings();
      
      if (result.success) {
        alert(`Successfully checked out ${result.processed_count} past bookings`);
        loadBookings(pagination.page, getCurrentFilters()); // Refresh the bookings list
      } else {
        alert('Auto checkout failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Auto checkout error:', error);
      alert('Failed to auto checkout past bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    const note = prompt('Add a cancellation note (optional):');
    try {
      await api.updateBookingStatus(bookingId, 'Cancelled');
      loadBookings(pagination.page, getCurrentFilters());
      alert('Booking cancelled');
    } catch (error) {
      alert('Failed to cancel booking: ' + error.message);
    }
  };

  const exportToExcel = () => {
    const data = filteredBookings.map(b => ({
      'Booking ID': b.booking_id,
      'Customer': b.customer_name,
      'Room': b.room_number,
      'Check In': b.check_in_date,
      'Check Out': b.check_out_date,
      'Status': b.status,
      'Amount': b.total_amount
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Optimized filter handlers using new API methods
  const handleStatusFilter = async (status) => {
    setFilter(status);
    setLoading(true);
    
    try {
      let bookingsData = [];
      
      if (status === 'All') {
        bookingsData = await api.getBookings({ limit: 200 });
      } else {
        bookingsData = await api.getBookingsByStatus(status);
      }
      
      const bookingsList = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || []);
      setBookings(bookingsList);
      
      setPagination(prev => ({
        ...prev,
        total: bookingsList.length,
        totalPages: Math.ceil(bookingsList.length / prev.limit)
      }));
    } catch (error) {
      console.error('Error filtering by status:', error);
      setError('Failed to filter bookings by status');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeFilter = async (dateRange) => {
    setLoading(true);
    
    try {
      const bookingsData = await api.getBookingsByDateRange(
        dateRange.startDate, 
        dateRange.endDate
      );
      
      const bookingsList = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || []);
      setBookings(bookingsList);
      
      setPagination(prev => ({
        ...prev,
        total: bookingsList.length,
        totalPages: Math.ceil(bookingsList.length / prev.limit)
      }));
    } catch (error) {
      console.error('Error filtering by date range:', error);
      setError('Failed to filter bookings by date range');
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filtering for dropdown selections using all loaded bookings
  const filteredBookings = bookings.filter(booking => {
    // Customer/Guest filter
    if (advancedFilters.searchCustomer) {
      const customerId = String(booking.customer_id || booking.guest_id || '');
      if (customerId !== advancedFilters.searchCustomer) {
        return false;
      }
    }
    
    // Booking ID filter
    if (advancedFilters.searchBookingId) {
      const bookingId = String(booking.booking_id || '');
      if (bookingId !== advancedFilters.searchBookingId) {
        return false;
      }
    }
    
    // Room number filter
    if (advancedFilters.roomNumber) {
      const roomNumber = String(booking.room_number || '');
      if (roomNumber !== advancedFilters.roomNumber) {
        return false;
      }
    }
    
    return true;
  });

  const statuses = ['All', 'Booked', 'Checked-In', 'Checked-Out', 'Cancelled'];

  // Calculate stats for header
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Booked').length;
  const checkedInBookings = bookings.filter(b => b.status === 'Checked-In').length;
  const todayArrivals = bookings.filter(b => {
    if (!b.check_in_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return b.check_in_date.split('T')[0] === today;
  }).length;

  const headerStats = [
    { label: 'Total Bookings', value: bookings.length },
    { label: 'Confirmed', value: confirmedBookings },
    { label: 'Checked In', value: checkedInBookings },
    { label: 'Arrivals Today', value: todayArrivals }
  ];

  if (loading && bookings.length === 0) {
    return (
      <LoadingSpinner 
        icon={Calendar}
        message="Loading bookings..."
        submessage="Fetching reservation data"
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
                  <Calendar className="w-12 h-12 text-white" />
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Bookings Management</h1>
                    <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Track and manage hotel reservations across all properties
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
              New Booking
            </button>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Action Buttons Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAutoCheckout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
              style={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
              }}
              disabled={loading}
            >
              <Clock className="w-4 h-4" />
              Auto Checkout Past
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={exportToExcel} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
              style={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
              }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Filters */}
      <div className="bg-white rounded-2xl shadow-xl overflow-visible" style={{ border: '2px solid #e0e0e0' }}>
        <div className="p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Advanced Search Filters</h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Select customer, booking, room, or date range (all filters are optional)</p>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <div className="h-10 flex items-center">
                <label className="block text-sm font-semibold" style={{ color: '#495057' }}>Customer Name</label>
              </div>
              <SearchableDropdown
                value={advancedFilters.searchCustomer}
                onChange={(customerId) => setAdvancedFilters({...advancedFilters, searchCustomer: customerId || ''})}
                options={customerOptions}
                placeholder="Search customer..."
                searchPlaceholder="Type to search customers..."
                className="w-full"
                buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                dropdownClassName="!border-gray-300"
              />
            </div>
            <div>
              <div className="h-10 flex items-center">
                <label className="block text-sm font-semibold" style={{ color: '#495057' }}>Booking ID</label>
              </div>
              <SearchableDropdown
                value={advancedFilters.searchBookingId}
                onChange={(bookingId) => setAdvancedFilters({...advancedFilters, searchBookingId: bookingId || ''})}
                options={bookingIdOptions}
                placeholder="Booking ID..."
                searchPlaceholder="Type to search bookings..."
                className="w-full"
                buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                dropdownClassName="!border-gray-300"
              />
            </div>
            <div>
              <div className="h-10 flex items-center">
                <label className="block text-sm font-semibold" style={{ color: '#495057' }}>Room Number</label>
              </div>
              <SearchableDropdown
                value={advancedFilters.roomNumber}
                onChange={(roomNumber) => setAdvancedFilters({...advancedFilters, roomNumber: roomNumber || ''})}
                options={roomNumberOptions}
                placeholder="Room number..."
                searchPlaceholder="Type to search rooms..."
                className="w-full"
                buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 hover:!border-blue-700"
                dropdownClassName="!border-gray-300"
              />
            </div>
            <div>
              <div className="h-10 flex items-center">
                <label className="block text-sm font-semibold" style={{ color: '#495057' }}>
                  Start Date
                  <span className="block text-xs font-normal" style={{ color: '#6c757d' }}>
                    From this date onwards
                  </span>
                </label>
              </div>
              <input
                type="date"
                value={advancedFilters.startDate}
                onChange={(e) => {
                  console.log('Start date changed to:', e.target.value);
                  setAdvancedFilters({...advancedFilters, startDate: e.target.value});
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
              <div className="h-10 flex items-center">
                <label className="block text-sm font-semibold" style={{ color: '#495057' }}>
                  End Date
                  <span className="block text-xs font-normal" style={{ color: '#6c757d' }}>
                    Up to this date
                  </span>
                </label>
              </div>
              <input
                type="date"
                value={advancedFilters.endDate}
                onChange={(e) => {
                  console.log('End date changed to:', e.target.value);
                  setAdvancedFilters({...advancedFilters, endDate: e.target.value});
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
          {(advancedFilters.startDate || advancedFilters.endDate) && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAdvancedFilters({...advancedFilters, startDate: '', endDate: ''})}
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
      </div>

      {/* Branch Filter */}
      <div className="bg-white rounded-2xl shadow-xl overflow-visible" style={{ border: '2px solid #e0e0e0' }}>
        <div className="p-6 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Branch Location</h3>
                <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Filter bookings by hotel branch</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-visible">
          <div className="flex items-center gap-4 relative">
            <SearchableDropdown
              value={selectedBranch}
              onChange={handleBranchChange}
              options={branchOptions}
              placeholder="All branches"
              searchPlaceholder="Search branches..."
              className="flex-1"
              buttonClassName="!px-4 !py-3 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 !font-medium focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 focus-visible:!ring-offset-0 hover:!border-blue-700"
              dropdownClassName="!border-gray-300"
            />
            {selectedBranch && (
              <button
                type="button"
                onClick={() => setSelectedBranch('')}
                className="px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105 border-0 flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)',
                  boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {statuses.map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className="px-5 py-2.5 rounded-xl font-bold transition-all border-0"
            style={
              filter === status
                ? {
                    background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                    transform: 'scale(1)',
                  }
                : {
                    background: 'white',
                    color: '#495057',
                    border: '2px solid #e0e0e0',
                    transform: 'scale(1)',
                  }
            }
            ref={(el) => {
              if (el) {
                // Force apply initial styles
                if (filter === status) {
                  el.style.setProperty('background', 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', 'important');
                  el.style.setProperty('color', '#ffffff', 'important');
                  el.style.setProperty('box-shadow', '0 4px 12px rgba(26, 35, 126, 0.3)', 'important');
                } else {
                  el.style.setProperty('background', 'white', 'important');
                  el.style.setProperty('color', '#495057', 'important');
                  el.style.setProperty('border', '2px solid #e0e0e0', 'important');
                }
              }
            }}
            onMouseEnter={(e) => {
              if (filter !== status) {
                e.currentTarget.style.setProperty('background', 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 'important');
                e.currentTarget.style.setProperty('color', '#1a237e', 'important');
                e.currentTarget.style.setProperty('border', '2px solid #1a237e', 'important');
                e.currentTarget.style.setProperty('transform', 'scale(1.05)', 'important');
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== status) {
                e.currentTarget.style.setProperty('background', 'white', 'important');
                e.currentTarget.style.setProperty('color', '#495057', 'important');
                e.currentTarget.style.setProperty('border', '2px solid #e0e0e0', 'important');
                e.currentTarget.style.setProperty('transform', 'scale(1)', 'important');
              }
            }}
          >
            {status}
          </button>
        ))}
      </div>



      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        {loading ? (
          <div className="text-center py-12">
            <div 
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{
                borderWidth: '4px',
                borderStyle: 'solid',
                borderColor: '#e9ecef',
                borderTopColor: '#1a237e',
              }}
            ></div>
            <p className="mt-4" style={{ color: '#495057' }}>Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#adb5bd' }} />
            <p style={{ color: '#495057' }}>No bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking, index) => (
              <div key={booking.booking_id || `booking-${index}`} className="rounded-lg p-6 hover:shadow-lg transition-all" style={{ border: '2px solid #e9ecef', background: '#f8f9fa' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: '#1a237e' }}>
                        {booking.guest_name || 'Guest'}
                      </h3>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={
                          booking.status === 'Checked-In'
                            ? { background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', color: '#2e7d32', border: '2px solid #81c784' }
                            : booking.status === 'Booked'
                              ? { background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)', color: '#0d47a1', border: '2px solid #64b5f6' }
                              : booking.status === 'Checked-Out'
                                ? { background: 'linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)', color: '#6a1b9a', border: '2px solid #ba68c8' }
                                : { background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)', color: '#c62828', border: '2px solid #e57373' }
                        }
                      >
                        {booking.status}
                      </span>
                      {(() => {
                        const s = booking.payment_status;
                        let style = {};
                        if (s === 'Paid') {
                          style = { background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', color: '#2e7d32', border: '2px solid #81c784' };
                        } else if (s === 'Partial') {
                          style = { background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', color: '#f57f17', border: '2px solid #ffee58' };
                        } else {
                          style = { background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)', color: '#c62828', border: '2px solid #e57373' };
                        }
                        return (
                          <span className="px-3 py-1 rounded-full text-xs font-bold" style={style}>
                            {s || 'Unpaid'}
                          </span>
                        );
                      })()}
                      <PaidPill booking={booking} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p style={{ color: '#6c757d' }}>Room</p>
                        <p className="font-medium" style={{ color: '#1a237e' }}>{booking.room_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Check In</p>
                        <p className="font-medium" style={{ color: '#1a237e' }}>
                          {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Check Out</p>
                        <p className="font-medium" style={{ color: '#1a237e' }}>
                          {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Total Amount</p>
                        <p className="font-bold" style={{ color: '#1a237e' }}>
                          Rs {parseFloat(booking.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Paid</p>
                        <p className="font-bold" style={{ color: '#2e7d32' }}>
                          Rs {(
                            Number(booking.advance_payment||0) +
                            Number(booking.payments_total||0) +
                            Number(booking.adjustments_total||0)
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#6c757d' }}>Balance Due</p>
                        <p
                          className="font-bold"
                          style={{ color: '#1a237e' }}
                          title={`Total: Rs ${parseFloat(booking.total_amount||0).toFixed(2)} | Paid: Rs ${(
                            parseFloat(booking.advance_payment||0)
                            + parseFloat(booking.payments_total||0)
                            + parseFloat(booking.adjustments_total||0)
                          ).toFixed(2)}`}
                        >
                          Rs {parseFloat(booking.balance_due ?? booking.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {booking.meta && (
                      <div className="mt-4 rounded-lg p-3 text-sm space-y-1" style={{ border: '2px solid #e9ecef', background: 'white' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6c757d' }}>
                          Guest context
                        </p>
                        {booking.meta.specialRequests && (
                          <p style={{ color: '#495057' }}>
                            <span className="font-semibold" style={{ color: '#1a237e' }}>Requests:</span>{' '}
                            {booking.meta.specialRequests}
                          </p>
                        )}
                        {booking.meta.guestAlerts && (
                          <p style={{ color: '#c62828' }}>
                            <span className="font-semibold">Alerts:</span> {booking.meta.guestAlerts}
                          </p>
                        )}
                        {Array.isArray(booking.meta.preferences) && booking.meta.preferences.length > 0 && (
                          <p style={{ color: '#495057' }}>
                            <span className="font-semibold" style={{ color: '#1a237e' }}>Preferences:</span>{' '}
                            {booking.meta.preferences.join(', ')}
                          </p>
                        )}
                        {booking.meta.loyaltyId && (
                          <p style={{ color: '#495057' }}>
                            <span className="font-semibold" style={{ color: '#1a237e' }}>Loyalty ID:</span>{' '}
                            {booking.meta.loyaltyId}
                          </p>
                        )}
                        {booking.meta.travelAgentCode && (
                          <p style={{ color: '#495057' }}>
                            <span className="font-semibold" style={{ color: '#1a237e' }}>Travel agent:</span>{' '}
                            {booking.meta.travelAgentCode}
                          </p>
                        )}
                        {/* guaranteeType removed - guarantee feature not in schema */}
                        {booking.meta.travelReason && (
                          <p style={{ color: '#495057' }}>
                            <span className="font-semibold" style={{ color: '#1a237e' }}>Travel reason:</span>{' '}
                            {booking.meta.travelReason}
                          </p>
                        )}
                        {booking.meta.notes && (
                          <p style={{ color: '#495057' }}>
                            <span className="font-semibold" style={{ color: '#1a237e' }}>Internal notes:</span>{' '}
                            {booking.meta.notes}
                          </p>
                        )}
                        {Array.isArray(booking.meta.attachments) && booking.meta.attachments.length > 0 && (
                          <p style={{ color: '#495057' }}>
                            <span className="font-semibold" style={{ color: '#1a237e' }}>Attachments:</span>{' '}
                            {booking.meta.attachments.join(', ')}
                          </p>
                        )}
                        {booking.meta.group && (booking.meta.group.code || booking.meta.group.name || booking.meta.group.notes) && (
                          <div className="pt-2 mt-2 text-sm space-y-1" style={{ borderTop: '2px solid #e9ecef', color: '#495057' }}>
                            <p className="font-semibold" style={{ color: '#1a237e' }}>Group / block</p>
                            {booking.meta.group.code && <p>Code: {booking.meta.group.code}</p>}
                            {booking.meta.group.name && <p>Name: {booking.meta.group.name}</p>}
                            {booking.meta.group.notes && <p>Notes: {booking.meta.group.notes}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    {booking.status === 'Booked' && (
                      <button 
                        type="button"
                        onClick={() => handleCheckIn(booking.booking_id)}
                        className="px-4 py-2 text-sm rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
                        style={{
                          background: 'linear-gradient(135deg, #43a047 0%, #388e3c 100%)',
                          boxShadow: '0 4px 12px rgba(67, 160, 71, 0.3)',
                        }}
                      >
                        Check In
                      </button>
                    )}
                    {booking.status === 'Booked' && (
                      <button 
                        type="button"
                        onClick={() => handleCancel(booking.booking_id)}
                        className="px-4 py-2 text-sm rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
                        style={{
                          background: 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)',
                          boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status === 'Checked-In' && (
                      <button 
                        type="button"
                        onClick={() => handleCheckOut(booking)}
                        className="px-4 py-2 text-sm rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
                        style={{
                          background: 'linear-gradient(135deg, #fb8c00 0%, #f57c00 100%)',
                          boxShadow: '0 4px 12px rgba(251, 140, 0, 0.3)',
                        }}
                      >
                        Check Out
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const url = await api.getInvoiceHtmlUrlWithToken(booking.booking_id);
                          window.open(url, '_blank');
                        } catch (error) {
                          console.error('Error opening invoice:', error);
                          alert('Failed to open invoice. Please try again.');
                        }
                      }}
                      className="px-4 py-2 text-sm rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
                      style={{
                        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                      }}
                    >
                      Invoice
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="px-4 py-2 text-sm rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
                      style={{
                        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load More Button */}
        {hasMoreBookings && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => loadBookings((pagination.page || 1) + 1, getCurrentFilters(), true)}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 border-0"
              style={{
                background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
              }}
            >
              {loading ? 'Loading...' : `Load More Bookings (${allBookings.length} loaded)`}
            </button>
            <p className="text-sm mt-2" style={{ color: '#6c757d' }}>
              Load more bookings for better search results
            </p>
          </div>
        )}
        
        {/* Pagination Controls & Info */}
        <div className="mt-8 pt-6" style={{ borderTop: '2px solid #e9ecef' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm" style={{ color: '#495057' }}>
              Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> bookings
              {selectedBranch && <span style={{ color: '#1a237e', fontWeight: 600 }}> (filtered by branch)</span>}
              {(advancedFilters.startDate || advancedFilters.endDate) && (
                <span style={{ color: '#1a237e', fontWeight: 600 }}>
                  {' '}(filtered by dates: 
                  {advancedFilters.startDate && advancedFilters.endDate 
                    ? ` ${advancedFilters.startDate} to ${advancedFilters.endDate}` 
                    : advancedFilters.startDate 
                    ? ` from ${advancedFilters.startDate} onwards`
                    : ` up to ${advancedFilters.endDate}`})
                </span>
              )}
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm relative" style={{ color: '#495057' }}>
              <label htmlFor="pageSize">Per page:</label>
              <SearchableDropdown
                value={String(pagination.limit)}
                onChange={handlePageSizeChange}
                options={pageSizeOptions}
                hideSearch
                clearable={false}
                className="min-w-[140px]"
                buttonClassName="!px-3 !py-2 !rounded-xl !border-2 !border-gray-300 !bg-white !text-gray-900 focus-visible:!ring-2 focus-visible:!ring-blue-900 focus-visible:!border-blue-900 focus-visible:!ring-offset-0 hover:!border-blue-700"
                id="pageSize"
              />
            </div>
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => loadBookings((pagination.page || 1) - 1, getCurrentFilters())}
                disabled={(pagination.page || 1) <= 1}
                className="px-4 py-2 text-sm font-medium border-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: '#e0e0e0',
                  background: 'white',
                  color: '#495057',
                }}
                onMouseEnter={(e) => {
                  if ((pagination.page || 1) > 1) {
                    e.currentTarget.style.borderColor = '#1a237e';
                    e.currentTarget.style.color = '#1a237e';
                  }
                }}
                onMouseLeave={(e) => {
                  if ((pagination.page || 1) > 1) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.color = '#495057';
                  }
                }}
              >
                ← Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(7, pagination.totalPages || 1) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min((pagination.totalPages || 1) - 6, (pagination.page || 1) - 3)) + i;
                  if (pageNum > (pagination.totalPages || 1)) return null;
                  
                  const isActive = pageNum === (pagination.page || 1);
                  
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => loadBookings(pageNum, getCurrentFilters())}
                      className="min-w-[40px] px-3 py-2 text-sm font-bold rounded-xl transition-all border-0"
                      style={
                        isActive
                          ? {
                              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                              color: '#ffffff',
                              boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                              transform: 'scale(1.05)',
                            }
                          : {
                              background: 'white',
                              color: '#495057',
                              border: '2px solid #e0e0e0',
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = '#1a237e';
                          e.currentTarget.style.color = '#1a237e';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.color = '#495057';
                        }
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                type="button"
                onClick={() => loadBookings((pagination.page || 1) + 1, getCurrentFilters())}
                disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
                className="px-4 py-2 text-sm font-medium border-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: '#e0e0e0',
                  background: 'white',
                  color: '#495057',
                }}
                onMouseEnter={(e) => {
                  if ((pagination.page || 1) < (pagination.totalPages || 1)) {
                    e.currentTarget.style.borderColor = '#1a237e';
                    e.currentTarget.style.color = '#1a237e';
                  }
                }}
                onMouseLeave={(e) => {
                  if ((pagination.page || 1) < (pagination.totalPages || 1)) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.color = '#495057';
                  }
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            loadBookings(pagination.page, getCurrentFilters());
          }}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal 
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && checkoutBooking && checkoutBooking.booking_id && typeof checkoutBooking.booking_id === 'number' && checkoutBooking.booking_id > 0 && (
        <CheckoutModal 
          booking={checkoutBooking}
          onClose={() => setShowCheckoutModal(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
      </div>
    </div>
  );
};

const PaidPill = ({ booking }) => {
  const adv = Number(booking.advance_payment || 0);
  const pay = Number(booking.payments_total || 0);
  const adj = Number(booking.adjustments_total || 0);
  const paid = adv + pay + adj;
  const total = Number(booking.total_amount || 0);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const status = booking.payment_status;
  
  let pillStyle = {};
  if (status === 'Paid') {
    pillStyle = { background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', color: '#2e7d32', border: '2px solid #81c784' };
  } else if (status === 'Partial') {
    pillStyle = { background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', color: '#f57f17', border: '2px solid #ffee58' };
  } else {
    pillStyle = { background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)', color: '#c62828', border: '2px solid #e57373' };
  }

  const containerRef = useRef(null);
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState('below');

  const handleShow = () => {
    if (containerRef.current && typeof window !== 'undefined') {
      const rect = containerRef.current.getBoundingClientRect();
      const estimatedHeight = 140;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < estimatedHeight ? 'above' : 'below');
    }
    setShow(true);
  };

  const handleHide = () => setShow(false);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      tabIndex={0}
    >
      <span className="px-3 py-1 rounded-full text-xs font-bold" style={pillStyle}>
        Paid Rs {paid.toFixed(2)}{total > 0 ? ` (${pct}%)` : ''}
      </span>
      {show && (
        <div
          className={`absolute right-0 w-64 shadow-lg rounded-xl p-3 text-xs z-50 ${
            position === 'below' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
          style={{
            background: 'white',
            border: '2px solid #e9ecef',
          }}
        >
          <div className="flex justify-between font-semibold" style={{ color: '#1a237e' }}>
            <span>Total</span>
            <span>Rs {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between" style={{ color: '#495057' }}>
            <span>Paid</span>
            <span>Rs {paid.toFixed(2)}</span>
          </div>
          <div className="mt-2 space-y-1" style={{ color: '#495057' }}>
            <div className="flex justify-between"><span>Advance</span><span>Rs {adv.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Payments</span><span>Rs {pay.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Adjustments</span><span>Rs {adj.toFixed(2)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
