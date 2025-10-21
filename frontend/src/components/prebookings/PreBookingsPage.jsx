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

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [hasMorePreBookings, setHasMorePreBookings] = useState(true);

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

  useEffect(() => {
    loadBranches();
    loadPreBookings();
  }, []);

  useEffect(() => {
    // Reload pre-bookings when branch filter changes
    if (branches.length > 0) {
      loadPreBookings();
    }
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load branches:', error);
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
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold text-text-primary">Pre-Bookings</h1>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Error loading pre-bookings</p>
              <p className="text-sm">{error}</p>
              <button onClick={loadPreBookings} className="btn-secondary mt-3 text-sm">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary dark:bg-slate-950 p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Pre-Bookings"
          description="Advance booking requests and reservations"
          icon={Calendar}
          stats={[
            { label: 'Total', value: totalPreBookings, trend: `${pagination.totalPages} pages` },
            { label: 'Pending', value: pendingCount, trend: 'Awaiting confirmation' },
            { label: 'Confirmed', value: confirmedCount, trend: 'Ready to convert' },
          ]}
          actions={[{
            label: 'New Pre-Booking',
            icon: Plus,
            onClick: () => setShowCreateModal(true),
            variant: 'secondary'
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
            hideSearch={branchOptions.length <= 6}
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

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading pre-bookings...</p>
          </div>
        ) : preBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-text-secondary">No pre-bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {preBookings.map(preBooking => (
              <div key={preBooking.pre_booking_id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {preBooking.prebooking_code || `Pre-Booking #${preBooking.pre_booking_id}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        preBooking.status === 'Confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        preBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {preBooking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary">Customer</p>
                        <p className="font-medium text-text-primary">{preBooking.customer_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Room Type</p>
                        <p className="font-medium text-text-primary">{preBooking.room_type_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Rooms</p>
                        <p className="font-medium text-text-primary">{preBooking.number_of_rooms || 1}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Branch</p>
                        <p className="font-medium text-text-primary">{preBooking.branch_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Check In</p>
                        <p className="font-medium text-text-primary">
                          {preBooking.check_in_date ? format(new Date(preBooking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Check Out</p>
                        <p className="font-medium text-text-primary">
                          {preBooking.check_out_date ? format(new Date(preBooking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Guests</p>
                        <p className="font-medium text-text-primary">{preBooking.number_of_guests || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Auto-Cancel</p>
                        <p className="font-medium text-text-primary">
                          {preBooking.auto_cancel_date ? format(new Date(preBooking.auto_cancel_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => handleEditPreBooking(preBooking)}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePreBooking(preBooking)}
                      className="btn-danger text-sm flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => handleConvertToBooking(preBooking)}
                      className="btn-primary text-sm flex items-center gap-2"
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
            className="btn-primary px-6 py-2"
          >
            {loading ? 'Loading...' : `Load More Pre-Bookings (${allPreBookings.length} loaded)`}
          </button>
          <p className="text-sm text-text-secondary mt-2">
            Load more pre-bookings for better search results
          </p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing {preBookings.length} filtered results from {allPreBookings.length} loaded pre-bookings
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
        console.warn('Using mock data due to API error');
        // Mock customers data
        setCustomers([
          { customer_id: 1, guest_name: 'Anushka Mendis', full_name: 'Anushka Mendis', email: 'anushka.mendis@email.com', phone: '0771234567' },
          { customer_id: 2, guest_name: 'Priya Silva', full_name: 'Priya Silva', email: 'priya.silva@email.com', phone: '0777654321' },
          { customer_id: 3, guest_name: 'Rajesh Kumar', full_name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '0779876543' },
          { customer_id: 4, guest_name: 'Sarah Johnson', full_name: 'Sarah Johnson', email: 'sarah.johnson@email.com', phone: '0775555555' },
        ]);
        // Mock room types data
        setRoomTypes([
          { room_type_id: 1, name: 'Deluxe', base_rate: 15000, capacity: 2 },
          { room_type_id: 2, name: 'Suite', base_rate: 25000, capacity: 4 },
          { room_type_id: 3, name: 'Standard', base_rate: 10000, capacity: 1 },
        ]);
        // Mock branches data
        setBranches([
          { branch_id: 1, branch_name: 'SkyNest Colombo', branch_code: 'CMB' },
          { branch_id: 2, branch_name: 'SkyNest Kandy', branch_code: 'KND' },
          { branch_id: 3, branch_name: 'SkyNest Galle', branch_code: 'GAL' },
          { branch_id: 4, branch_name: 'SkyNest Negombo', branch_code: 'NEG' }
        ]);
        console.log('✅ Loaded mock data:', { customers: 4, roomTypes: 3, branches: 4 });
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        {/* Fixed Header */}
        <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary">New Pre-Booking</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {loadingData ? (
            <div className="text-center py-8 text-text-tertiary">Loading...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
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
                <p className="text-xs text-text-tertiary mt-1">
                  Select the hotel branch for this pre-booking
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
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
                <p className="text-xs text-text-tertiary mt-1">
                  The person making the booking (may differ from guest who stays)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
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
                <p className="text-xs text-text-tertiary mt-1">
                  Required: What type of room is needed for this booking
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Check In Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.check_in_date}
                  onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Check Out Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.check_out_date}
                  onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Number of Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.number_of_guests}
                  onChange={(e) => setFormData({...formData, number_of_guests: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Number of Rooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.number_of_rooms}
                  onChange={(e) => setFormData({...formData, number_of_rooms: e.target.value})}
                  className="input-field"
                  required
                />
                <p className="text-xs text-text-tertiary mt-1">
                  How many rooms of this type do you need?
                </p>
              </div>

              {/* Room Availability Check */}
              {formData.room_type_id && formData.check_in_date && formData.check_out_date && selectedBranch && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-blue-900">Room Availability</h4>
                    <button
                      type="button"
                      onClick={checkAvailability}
                      disabled={availabilityLoading}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {availabilityLoading ? 'Checking...' : 'Check Availability'}
                    </button>
                  </div>
                  
                  {availabilityResult && (
                    <div className="text-sm">
                      {availabilityResult.available ? (
                        <div className="text-green-700">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">Rooms Available</span>
                          </div>
                          <p className="text-xs">
                            {availabilityResult.summary.available_rooms} of {availabilityResult.summary.total_rooms} rooms available
                            {availabilityResult.summary.reserved_rooms > 0 && (
                              <span className="text-blue-600 ml-1">
                                ({availabilityResult.summary.reserved_rooms} reserved)
                              </span>
                            )}
                          </p>
                          {availabilityResult.summary.available_rooms >= formData.number_of_rooms ? (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              ✓ Sufficient rooms for your request
                            </p>
                          ) : (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              ⚠ Only {availabilityResult.summary.available_rooms} rooms available (need {formData.number_of_rooms})
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-red-700">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-medium">No Rooms Available</span>
                          </div>
                          <p className="text-xs">
                            All rooms of this type are booked for the selected dates
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Helpful message */}
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    💡 <strong>Tip:</strong> The system will automatically check availability before creating your pre-booking. If no rooms are available, the creation will be blocked.
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button type="button" onClick={getQuote} disabled={!canQuote || quoteLoading} className="btn-secondary">
                  {quoteLoading ? 'Getting Quote...' : 'Get Rate Quote'}
                </button>
                {quote && (
                  <div className="text-sm text-text-secondary">
                    <span className="font-medium">Quote:</span> {quote.nights} night{quote.nights>1?'s':''} · Total Rs {parseFloat(quote.total).toFixed(2)}
                  </div>
                )}
              </div>
              {quote && quote.nightly?.length > 0 && (
                <div className="bg-surface-tertiary border border-border rounded-lg p-3">
                  <div className="text-sm font-medium text-text-primary mb-2">Nightly Rates</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {quote.nightly.map(n => (
                      <div key={n.date} className="flex justify-between">
                        <span className="text-text-secondary">{new Date(n.date).toLocaleDateString()}</span>
                        <span className="text-text-primary">Rs {parseFloat(n.rate).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Special Requests</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                  className="input-field"
                  rows="3"
                  placeholder="Any special requirements..."
                />
              </div>
            </>
          )}
          </form>
        </div>
        
        {/* Fixed Footer */}
        <div className="p-4 sm:p-6 border-t border-border flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || loadingData} className="btn-primary flex-1" onClick={handleSubmit}>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-surface-secondary dark:bg-slate-800">
          <h2 className="text-2xl font-display font-bold text-text-primary">
            Convert Pre-Booking to Booking
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Pre-Booking Details */}
        <div className="p-6 bg-surface-tertiary border-b border-border">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Pre-Booking Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Booked By (Customer)</p>
              <p className="font-medium text-text-primary">{preBooking.customer_name}</p>
            </div>
            <div>
              <p className="text-text-secondary">Room Type Requested</p>
              <p className="font-medium text-text-primary">{preBooking.room_type_name || 'Any'}</p>
            </div>
            <div>
              <p className="text-text-secondary">Check In</p>
              <p className="font-medium text-text-primary">
                {format(new Date(preBooking.check_in_date), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Check Out</p>
              <p className="font-medium text-text-primary">
                {format(new Date(preBooking.check_out_date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loadingData ? (
            <div className="text-center py-8 text-text-tertiary">Loading...</div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Select the guest who will actually stay in the hotel. 
                  This can be the same as the customer who booked, or a different person.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
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
                      <span className="font-medium text-text-primary">{option.name}</span>
                      {option.subtitle && (
                        <span className="text-xs text-text-secondary">{option.subtitle}</span>
                      )}
                    </div>
                  )}
                  renderSelected={(option) =>
                    option ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">{option.name}</span>
                        {option.subtitle && (
                          <span className="text-xs text-text-secondary">{option.subtitle}</span>
                        )}
                      </div>
                    ) : (
                      'Select the guest who will stay'
                    )
                  }
                />
                <p className="text-xs text-text-tertiary mt-1">
                  The person who will actually stay in the room (may differ from customer)
                </p>
              </div>

              {isGroupBooking ? (
                // Group Booking Form
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">
                      <strong>Group Booking:</strong> This pre-booking requires {preBooking.number_of_rooms} rooms of type {preBooking.room_type_name}.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
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
                          <span className="font-medium text-text-primary">{option.name}</span>
                          {option.rate && (
                            <span className="text-xs text-text-secondary">
                              Rs {parseFloat(option.rate || 0).toFixed(2)}/night
                            </span>
                          )}
                        </div>
                      )}
                      renderSelected={(option) =>
                        option ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-text-primary">{option.name}</span>
                            {option.rate && (
                              <span className="text-xs text-text-secondary">
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
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Number of Rooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.room_quantity}
                      onChange={(e) => setFormData({...formData, room_quantity: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                      className="input-field"
                      placeholder="Enter group name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Booking Rate (per night) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.booked_rate}
                      onChange={(e) => setFormData({...formData, booked_rate: e.target.value})}
                      className="input-field"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_rate_percent}
                      onChange={(e) => setFormData({...formData, tax_rate_percent: e.target.value})}
                      className="input-field"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Advance Payment
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.advance_payment}
                      onChange={(e) => setFormData({...formData, advance_payment: e.target.value})}
                      className="input-field"
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
                      <p className="text-sm text-text-secondary mt-1">Please check back later</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
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
                              <span className="font-medium text-text-primary">{option.name}</span>
                              <span className="text-xs text-text-secondary">
                                {option.floor ? `Floor ${option.floor} · ` : ''}
                                {option.rate ? `Rs ${parseFloat(option.rate || 0).toFixed(2)}/night` : 'Rate unavailable'}
                              </span>
                            </div>
                          )}
                          renderSelected={(option) =>
                            option ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-text-primary">{option.name}</span>
                                <span className="text-xs text-text-secondary">
                                  {option.floor ? `Floor ${option.floor} · ` : ''}
                                  {option.rate ? `Rs ${parseFloat(option.rate || 0).toFixed(2)}/night` : 'Rate unavailable'}
                                </span>
                              </div>
                            ) : (
                              'Choose an available room'
                            )
                          }
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          Showing {rooms.length} available {preBooking.room_type_name || ''} room(s)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Booking Rate (per night) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.booked_rate}
                          onChange={(e) => setFormData({...formData, booked_rate: e.target.value})}
                          className="input-field"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.tax_rate_percent}
                          onChange={(e) => setFormData({...formData, tax_rate_percent: e.target.value})}
                          className="input-field"
                          placeholder="10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Advance Payment
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.advance_payment}
                          onChange={(e) => setFormData({...formData, advance_payment: e.target.value})}
                          className="input-field"
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary">Edit Pre-Booking</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {loadingData ? (
              <div className="text-center py-8 text-text-tertiary">Loading...</div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
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
                  <label className="block text-sm font-medium text-text-secondary mb-2">
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
                  <p className="text-xs text-text-tertiary mt-1">
                    Select the hotel branch for this pre-booking
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
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
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Check In Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Check Out Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Number of Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_guests}
                    onChange={(e) => setFormData({...formData, number_of_guests: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Number of Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_rooms}
                    onChange={(e) => setFormData({...formData, number_of_rooms: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Special Requests</label>
                  <textarea
                    value={formData.special_requests}
                    onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                    className="input-field"
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
