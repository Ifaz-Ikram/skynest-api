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

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId || '');
  };

  const handlePageSizeChange = (pageSizeId) => {
    const size = Number(pageSizeId);
    const limit = Number.isNaN(size) ? pagination.limit : size;
    setPagination({ ...pagination, limit, page: 1 });
    loadBookings(1, { limit });
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
      loadBookings(1);
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
    const filters = {};
    
    // Apply status filter
    if (filter && filter !== 'All') {
      filters.status = filter;
    }
    
    // Apply date filters
    if (advancedFilters.startDate) {
      filters.start_date = advancedFilters.startDate;
    }
    if (advancedFilters.endDate) {
      filters.end_date = advancedFilters.endDate;
    }
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    loadBookings(1, filters);
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Bookings</h1>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Error loading bookings</p>
              <p className="text-sm">{error}</p>
              <button onClick={loadBookings} className="btn-secondary mt-3 text-sm">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await api.request(`/api/bookings/${bookingId}/checkin`, { method: 'POST' });
      loadBookings(pagination.page);
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
    loadBookings(pagination.page); // Refresh the bookings list
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
        loadBookings(pagination.page); // Refresh the bookings list
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
      loadBookings(pagination.page);
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

  // Apply client-side filtering for text searches using all loaded bookings
  const filteredBookings = bookings.filter(booking => {
    // Customer name search
    if (advancedFilters.searchCustomer) {
      const guestName = booking.guest_name || '';
      if (!guestName.toLowerCase().includes(advancedFilters.searchCustomer.toLowerCase())) {
        return false;
      }
    }
    
    // Booking ID search
    if (advancedFilters.searchBookingId) {
      const bookingId = String(booking.booking_id || '');
      if (!bookingId.includes(advancedFilters.searchBookingId)) {
        return false;
      }
    }
    
    // Room number search
    if (advancedFilters.roomNumber) {
      const roomNumber = String(booking.room_number || '');
      if (!roomNumber.includes(advancedFilters.roomNumber)) {
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
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Bookings Management"
          description="Track and manage hotel reservations across all properties"
          icon={Calendar}
          stats={headerStats}
          action={
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Booking
            </button>
          }
        />

      {/* Action Buttons Bar */}
      <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleAutoCheckout}
              className="btn-secondary flex items-center bg-orange-600 hover:bg-orange-700 text-white"
              disabled={loading}
            >
              <Clock className="w-4 h-4 mr-2" />
              Auto Checkout Past
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Filters */}
      <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-luxury-navy to-indigo-900 p-6">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold">Advanced Search Filters</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Customer Name</label>
              <input
                type="text"
                value={advancedFilters.searchCustomer}
                onChange={(e) => setAdvancedFilters({...advancedFilters, searchCustomer: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
                placeholder="Search customer..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Booking ID</label>
              <input
                type="text"
                value={advancedFilters.searchBookingId}
                onChange={(e) => setAdvancedFilters({...advancedFilters, searchBookingId: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
                placeholder="Booking ID..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Room Number</label>
              <input
                type="text"
                value={advancedFilters.roomNumber}
                onChange={(e) => setAdvancedFilters({...advancedFilters, roomNumber: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
                placeholder="Room number..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Start Date</label>
              <input
                type="date"
                value={advancedFilters.startDate}
                onChange={(e) => setAdvancedFilters({...advancedFilters, startDate: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">End Date</label>
              <input
                type="date"
                value={advancedFilters.endDate}
                onChange={(e) => setAdvancedFilters({...advancedFilters, endDate: e.target.value})}
                className="w-full px-4 py-3 border-2 border-border dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branch Filter */}
      <div className="bg-surface-secondary rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Branch Location</h3>
                <p className="text-purple-200 text-sm mt-1">Filter bookings by hotel branch</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <SearchableDropdown
              value={selectedBranch}
              onChange={handleBranchChange}
              options={branchOptions}
              placeholder="All branches"
              searchPlaceholder="Search branches..."
              className="flex-1"
            buttonclassName="!px-4 !py-3 !rounded-xl !border-2 !border-border dark:border-slate-600 !bg-surface-secondary dark:!bg-slate-800 !font-medium !text-text-secondary dark:!text-slate-200 focus-visible:!ring-purple-500 focus-visible:!ring-offset-0 focus-visible:!border-purple-500 hover:!border-purple-400"
              dropdownClassName="!border-border"
            />
            {selectedBranch && (
              <button
                onClick={() => setSelectedBranch('')}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
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
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-luxury-gold text-white'
                : 'bg-surface-secondary dark:bg-slate-800 text-text-primary dark:text-slate-200 hover:bg-surface-tertiary dark:hover:bg-slate-700/30 border border-border dark:border-slate-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>



      {/* Bookings List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-text-secondary">No bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking, index) => (
              <div key={booking.booking_id || `booking-${index}`} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {booking.guest_name || 'Guest'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'Checked-In'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : booking.status === 'Booked'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-slate-700/40 dark:text-slate-200'
                      }`}>
                        {booking.status}
                      </span>
                      {(() => {
                        const s = booking.payment_status;
                        const cls =
                          s === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/25'
                            : s === 'Partial'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200 border border-amber-200 dark:border-amber-500/25'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200 border border-rose-200 dark:border-rose-500/25';
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
                            {s || 'Unpaid'}
                          </span>
                        );
                      })()}
                      <PaidPill booking={booking} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary">Room</p>
                        <p className="font-medium text-text-primary">{booking.room_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Check In</p>
                        <p className="font-medium text-text-primary">
                          {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Check Out</p>
                        <p className="font-medium text-text-primary">
                          {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Total Amount</p>
                        <p className="font-bold text-luxury-gold">
                          Rs {parseFloat(booking.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Paid</p>
                        <p className="font-bold text-emerald-700">
                          Rs {(
                            Number(booking.advance_payment||0) +
                            Number(booking.payments_total||0) +
                            Number(booking.adjustments_total||0)
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Balance Due</p>
                        <p
                          className="font-bold text-text-primary"
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
                      <div className="mt-4 rounded-lg border border-border bg-surface-tertiary p-3 text-sm text-text-secondary space-y-1">
                        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                          Guest context
                        </p>
                        {booking.meta.specialRequests && (
                          <p>
                            <span className="font-semibold text-text-primary">Requests:</span>{' '}
                            {booking.meta.specialRequests}
                          </p>
                        )}
                        {booking.meta.guestAlerts && (
                          <p className="text-red-600">
                            <span className="font-semibold">Alerts:</span> {booking.meta.guestAlerts}
                          </p>
                        )}
                        {Array.isArray(booking.meta.preferences) && booking.meta.preferences.length > 0 && (
                          <p>
                            <span className="font-semibold text-text-primary">Preferences:</span>{' '}
                            {booking.meta.preferences.join(', ')}
                          </p>
                        )}
                        {booking.meta.loyaltyId && (
                          <p>
                            <span className="font-semibold text-text-primary">Loyalty ID:</span>{' '}
                            {booking.meta.loyaltyId}
                          </p>
                        )}
                        {booking.meta.travelAgentCode && (
                          <p>
                            <span className="font-semibold text-text-primary">Travel agent:</span>{' '}
                            {booking.meta.travelAgentCode}
                          </p>
                        )}
                        {/* guaranteeType removed - guarantee feature not in schema */}
                        {booking.meta.travelReason && (
                          <p>
                            <span className="font-semibold text-text-primary">Travel reason:</span>{' '}
                            {booking.meta.travelReason}
                          </p>
                        )}
                        {booking.meta.notes && (
                          <p>
                            <span className="font-semibold text-text-primary">Internal notes:</span>{' '}
                            {booking.meta.notes}
                          </p>
                        )}
                        {Array.isArray(booking.meta.attachments) && booking.meta.attachments.length > 0 && (
                          <p>
                            <span className="font-semibold text-text-primary">Attachments:</span>{' '}
                            {booking.meta.attachments.join(', ')}
                          </p>
                        )}
                        {booking.meta.group && (booking.meta.group.code || booking.meta.group.name || booking.meta.group.notes) && (
                          <div className="pt-2 border-t border-border mt-2 text-sm text-text-secondary space-y-1">
                            <p className="font-semibold text-text-primary">Group / block</p>
                            {booking.meta.group.code && <p>Code: {booking.meta.group.code}</p>}
                            {booking.meta.group.name && <p>Name: {booking.meta.group.name}</p>}
                            {booking.meta.group.notes && <p>Notes: {booking.meta.group.notes}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {booking.status === 'Booked' && (
                      <button 
                        onClick={() => handleCheckIn(booking.booking_id)}
                        className="btn-primary text-sm"
                      >
                        Check In
                      </button>
                    )}
                    {booking.status === 'Booked' && (
                      <button 
                        onClick={() => handleCancel(booking.booking_id)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status === 'Checked-In' && (
                      <button 
                        onClick={() => handleCheckOut(booking)}
                        className="btn-secondary text-sm"
                      >
                        Check Out
                      </button>
                    )}
                    <button
                      onClick={() => window.open(api.getInvoiceHtmlUrl(booking.booking_id), '_blank')}
                      className="btn-secondary text-sm"
                    >
                      Invoice
                    </button>
                    <button 
                      onClick={() => setSelectedBooking(booking)}
                      className="btn-secondary text-sm"
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
              onClick={() => loadBookings((pagination.page || 1) + 1, {}, true)}
              disabled={loading}
              className="btn-primary px-6 py-2"
            >
              {loading ? 'Loading...' : `Load More Bookings (${allBookings.length} loaded)`}
            </button>
            <p className="text-sm text-text-secondary mt-2">
              Load more bookings for better search results
            </p>
          </div>
        )}
        
        {/* Pagination Controls & Info */}
        <div className="mt-8 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-text-secondary">
              Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> bookings
              {selectedBranch && <span className="text-luxury-gold"> (filtered by branch)</span>}
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <label htmlFor="pageSize">Per page:</label>
              <SearchableDropdown
                value={String(pagination.limit)}
                onChange={handlePageSizeChange}
                options={pageSizeOptions}
                hideSearch
                clearable={false}
                className="min-w-[140px]"
                buttonClassName="!px-3 !py-1 !rounded-md !border border-border dark:border-slate-600 focus-visible:!ring-luxury-gold focus-visible:!ring-offset-0 hover:!border-luxury-gold"
                id="pageSize"
              />
            </div>
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => loadBookings((pagination.page || 1) - 1)}
                disabled={(pagination.page || 1) <= 1}
                className="px-4 py-2 text-sm font-medium border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(7, pagination.totalPages || 1) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min((pagination.totalPages || 1) - 6, (pagination.page || 1) - 3)) + i;
                  if (pageNum > (pagination.totalPages || 1)) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => loadBookings(pageNum)}
                      className={`min-w-[40px] px-3 py-2 text-sm font-medium border rounded-md transition-all ${
                        pageNum === (pagination.page || 1)
                          ? 'bg-luxury-gold text-white border-luxury-gold shadow-md scale-105'
                          : 'border-border dark:border-slate-600 hover:bg-surface-tertiary dark:bg-slate-700/30 hover:border-gray-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => loadBookings((pagination.page || 1) + 1)}
                disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
                className="px-4 py-2 text-sm font-medium border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            loadBookings(pagination.page);
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
  const colorClass = status === 'Paid'
    ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/25'
    : status === 'Partial'
      ? 'bg-luxury-gold/10 dark:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/20 dark:border-luxury-gold/30'
      : 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-500/25';

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
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        Paid Rs {paid.toFixed(2)}{total > 0 ? ` (${pct}%)` : ''}
      </span>
      {show && (
        <div
          className={`absolute right-0 w-64 bg-surface-secondary dark:bg-slate-800 border border-border dark:border-slate-700 shadow-lg rounded-md p-3 text-xs text-text-primary dark:text-slate-200 z-50 ${
            position === 'below' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <div className="flex justify-between font-semibold text-text-primary">
            <span>Total</span>
            <span>Rs {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Paid</span>
            <span>Rs {paid.toFixed(2)}</span>
          </div>
          <div className="mt-2 space-y-1 text-text-secondary">
            <div className="flex justify-between"><span>Advance</span><span>Rs {adv.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Payments</span><span>Rs {pay.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Adjustments</span><span>Rs {adj.toFixed(2)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
