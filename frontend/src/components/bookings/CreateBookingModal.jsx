import { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';
import { validateBookingForm, hasValidationErrors } from '../../utils/validation';

const splitList = (value) =>
  String(value || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const CreateBookingModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    guest_id: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    booked_rate: '',
    advance_payment: '',
    is_group_booking: false,
    group_name: '',
    // Group booking fields
    room_type_id: '',
    room_quantity: 1,
  });
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [freeRooms, setFreeRooms] = useState([]);
  const [freeRoomsLoading, setFreeRoomsLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [idStatus, setIdStatus] = useState(null);

  const filteredRooms = useMemo(() => {
    if (!selectedBranch) return [];
    return rooms.filter(room => room.branch_id === Number(selectedBranch));
  }, [rooms, selectedBranch]);

  const selectedRoom = useMemo(
    () => filteredRooms.find((r) => r.room_id === Number(formData.room_id)),
    [filteredRooms, formData.room_id],
  );

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    // Reset room selection when branch changes
    setFormData(prev => ({ ...prev, room_id: '' }));
    resetAvailability();
  };

  const loadBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guestsData, roomsData, roomTypesData] = await Promise.all([
          api.getGuests({ limit: 200 }),
          api.getAllRooms(),
          api.getRoomTypes(),
        ]);
        console.log('Guests loaded:', guestsData);
        const guestsList = Array.isArray(guestsData)
          ? guestsData
          : (guestsData?.guests || []);
        setGuests(guestsList);
        setRooms(roomsData || []);
        setRoomTypes(roomTypesData || []);
        console.log('Rooms loaded:', roomsData);
        console.log('Room types loaded:', roomTypesData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setGuests([]);
        setRooms([]);
        setRoomTypes([]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
    loadBranches();
  }, []);

  const resetAvailability = () => {
    setAvailability(null);
    setAvailabilityError(null);
    setSuggestions([]);
  };

  const calculateNumberOfNights = () => {
    if (!formData.check_in_date || !formData.check_out_date) return 0;
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalAmount = () => {
    const rate = parseFloat(formData.booked_rate) || 0;
    const nights = calculateNumberOfNights();
    return rate * nights;
  };

  const calculateAdvancePayment = () => {
    const total = calculateTotalAmount();
    return total * 0.1; // 10% of total amount
  };

  const calculateGroupTotalAmount = () => {
    if (!formData.is_group_booking) return calculateTotalAmount();
    
    const selectedRoomType = roomTypes.find(rt => rt.room_type_id == formData.room_type_id);
    if (!selectedRoomType) return 0;
    
    const ratePerRoom = parseFloat(selectedRoomType.daily_rate) || 0;
    const nights = calculateNumberOfNights();
    const totalRooms = parseInt(formData.room_quantity) || 1;
    
    return ratePerRoom * nights * totalRooms;
  };

  const calculateGroupAdvancePayment = () => {
    const total = calculateGroupTotalAmount();
    return total * 0.1; // 10% of total amount
  };

  const handleRoomChange = (roomId) => {
    const room = rooms.find((r) => r.room_id === Number(roomId));
    const dailyRate = room ? room.daily_rate : 0;
    console.log('Selected room:', room, 'daily_rate:', dailyRate);
    setFormData((prev) => ({
      ...prev,
      room_id: roomId,
      booked_rate: dailyRate || prev.booked_rate,
    }));
    resetAvailability();
  };

  const refreshGuestIdStatus = async (guestId) => {
    try {
      if (!guestId) {
        setIdStatus(null);
        return;
      }
      const status = await api.getGuestIdProofStatus(guestId);
      setIdStatus(status);
    } catch (e) {
      // Non-blocking; backend will enforce too
      setIdStatus(null);
    }
  };

  useEffect(() => {
    if (formData.guest_id) {
      refreshGuestIdStatus(formData.guest_id);
    } else {
      setIdStatus(null);
    }
  }, [formData.guest_id]);

  // Auto-calculate advance payment when booking rate or dates change
  useEffect(() => {
    console.log('useEffect triggered with:', {
      booked_rate: formData.booked_rate,
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      is_group_booking: formData.is_group_booking,
      room_type_id: formData.room_type_id,
      room_quantity: formData.room_quantity
    });
    
    if (formData.check_in_date && formData.check_out_date) {
      let advancePayment = 0;
      
      if (formData.is_group_booking) {
        // For group bookings, calculate based on room type and quantity
        if (formData.room_type_id) {
          advancePayment = calculateGroupAdvancePayment();
        }
      } else {
        // For individual bookings, calculate based on selected room
        if (formData.booked_rate) {
          advancePayment = calculateAdvancePayment();
        }
      }
      
      console.log('Calculated advance payment:', advancePayment);
      setFormData(prev => ({
        ...prev,
        advance_payment: advancePayment.toFixed(2)
      }));
    }
  }, [formData.booked_rate, formData.check_in_date, formData.check_out_date, formData.is_group_booking, formData.room_type_id, formData.room_quantity]);

  const checkAvailability = async () => {
    // For individual bookings, check specific room
    if (!formData.is_group_booking) {
      if (!formData.room_id || !formData.check_in_date || !formData.check_out_date) {
        setAvailabilityError('Select room and dates before checking availability.');
        return null;
      }
    } else {
      // For group bookings, check room type availability
      if (!formData.room_type_id || !formData.check_in_date || !formData.check_out_date) {
        setAvailabilityError('Select room type and dates before checking availability.');
        return null;
      }
    }
    
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    
    try {
      let payload;
      
      if (formData.is_group_booking) {
        // Group booking payload
        payload = {
          room_type_id: Number(formData.room_type_id),
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          capacity: formData.number_of_guests || 1,
          quantity: Number(formData.room_quantity) || 1,
          branch_id: selectedBranch ? Number(selectedBranch) : undefined,
        };
      } else {
        // Individual booking payload
        payload = {
          room_id: Number(formData.room_id),
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          capacity: formData.number_of_guests ? Number(formData.number_of_guests) : undefined,
          room_type_id: selectedRoom?.room_type_id || undefined,
        };
      }
      
      // Remove undefined values to avoid validation errors
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      console.log('Checking availability with payload:', payload);
      const result = await api.checkRoomAvailability(payload);
      setAvailability(result);
      setSuggestions(result.suggestions || []);
      return result;
    } catch (error) {
      setAvailability(null);
      setSuggestions([]);
      setAvailabilityError(error.message);
      return null;
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadFreeRooms = async () => {
    if (!formData.check_in_date || !formData.check_out_date) {
      setAvailabilityError('Enter check-in and check-out dates to load alternatives.');
      return;
    }
    setFreeRoomsLoading(true);
    try {
      const params = {
        from: formData.check_in_date,
        to: formData.check_out_date,
        capacity: formData.number_of_guests || undefined,
        room_type_id: selectedRoom?.room_type_id || undefined,
        exclude_room_id: formData.room_id || undefined,
        limit: 15,
      };
      const result = await api.getFreeRooms(params);
      setFreeRooms(result?.free_rooms || []);
      setShowAlternatives(true);
    } catch (error) {
      setAvailabilityError(error.message);
    } finally {
      setFreeRoomsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateBookingForm(formData);
    if (hasValidationErrors(validationErrors)) {
      const errorMessages = Object.values(validationErrors).join(', ');
      alert(`Please fix the following errors: ${errorMessages}`);
      return;
    }
    
    setLoading(true);
    try {
      const availabilityResult = await checkAvailability();
      if (availabilityResult && availabilityResult.available === false) {
        setLoading(false);
        if (formData.is_group_booking) {
          alert(`Insufficient rooms available. Only ${availabilityResult.available_rooms || 0} rooms of this type are available, but ${formData.room_quantity} rooms are requested.`);
        } else {
          alert('Selected room is not available. Please pick one of the suggested rooms.');
        }
        return;
      }

      const bookingData = {
        guest_id: Number(formData.guest_id),
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        booked_rate: Number(formData.booked_rate),
        number_of_guests: Number(formData.number_of_guests),
        advance_payment: Number(formData.advance_payment) || 0,
      };

      // Add room information based on booking type
      if (formData.is_group_booking) {
        // For group bookings, send room type and quantity
        bookingData.room_type_id = Number(formData.room_type_id);
        bookingData.room_quantity = Number(formData.room_quantity);
        bookingData.is_group_booking = true;
        bookingData.group_name = formData.group_name || null;
      } else {
        // For individual bookings, send specific room
        bookingData.room_id = Number(formData.room_id);
        bookingData.is_group_booking = false;
        bookingData.group_name = null;
      }

      // Client-side ID check for Group bookings
      const requiresId = !!bookingData.is_group_booking;
      if (requiresId) {
        // If we have status and it's not valid, block and instruct
        if (!idStatus?.has_valid_id_proof) {
          setLoading(false);
          alert('ID proof is required for group bookings. Please update the guest\'s ID (Passport/NIC) before proceeding.');
          return;
        }
      }

      console.log('Booking data being sent:', bookingData);
      await api.createBooking(bookingData);
      onSuccess();
    } catch (error) {
      alert('Failed to create booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-2 sm:p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col border border-slate-700/50" style={{minWidth: '600px'}}>
        {/* Fixed Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg flex-shrink-0 sticky top-0 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white">New Booking</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Availability is checked before confirming, and you can capture guest preferences or alerts below.
          </p>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5" style={{width: '100%'}}>
          {loadingData ? (
            <div className="text-center py-8 text-slate-400">Loading guests and rooms...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                  <SearchableDropdown
                    options={branches}
                    value={selectedBranch}
                    onChange={handleBranchChange}
                    placeholder="Select a branch"
                    searchPlaceholder="Search branches..."
                    displayKey="branch_name"
                    valueKey="branch_id"
                    searchKeys={['branch_name', 'branch_code']}
                    renderOption={(branch) => `${branch.branch_name} (${branch.branch_code})`}
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Guest</label>
                  {console.log('Guests array:', guests)}
                  <SearchableDropdown
                    options={guests}
                    value={formData.guest_id}
                    onChange={(value) => {
                      console.log('Guest selected:', value);
                      setFormData({ ...formData, guest_id: value });
                    }}
                    placeholder="Select a guest"
                    searchPlaceholder="Search guests..."
                    displayKey="full_name"
                    valueKey="guest_id"
                    searchKeys={['full_name', 'email', 'phone']}
                    renderOption={(guest) => `${guest.full_name} - ${guest.email || guest.phone || `ID: ${guest.guest_id}`}`}
                    required
                  />
              {idStatus && (
                <p className={`mt-2 text-xs ${idStatus.has_valid_id_proof ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {idStatus.has_valid_id_proof ? 'Guest has valid ID proof on file' : 'Guest has no valid ID proof on file'}
                </p>
              )}
                </div>
              </div>

          {/* Booking Type Section - Single Column */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Booking Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="booking_type"
                  value="single"
                  checked={!formData.is_group_booking}
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    is_group_booking: false, 
                    group_name: '' 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-300">Single Booking</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="booking_type"
                  value="group"
                  checked={formData.is_group_booking}
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    is_group_booking: true 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-300">Group Booking</span>
              </label>
            </div>
            {formData.is_group_booking && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.group_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                  placeholder="Enter group name"
                  required
                />
                <p className="mt-1 text-xs text-amber-600">ID proof required for group bookings.</p>
              </div>
            )}
          </div>
              {/* Room Selection - Conditional based on booking type */}
              {!formData.is_group_booking ? (
                // Individual Booking - Single Room Selection
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Room</label>
                  <SearchableDropdown
                    options={filteredRooms}
                    value={formData.room_id}
                    onChange={(value) => handleRoomChange(value)}
                    placeholder={selectedBranch ? 'Select a room' : 'Select a branch first'}
                    searchPlaceholder="Search rooms..."
                    displayKey="room_number"
                    valueKey="room_id"
                    searchKeys={['room_number', 'room_type_name']}
                    renderOption={(room) => `Room ${room.room_number} - ${room.room_type_name} - Rs. ${room.daily_rate}/night`}
                    disabled={!selectedBranch}
                    required
                  />
                </div>
              ) : (
                // Group Booking - Room Type + Quantity Selection
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Room Type</label>
                    <SearchableDropdown
                      options={roomTypes}
                      value={formData.room_type_id}
                      onChange={(value) => {
                        const selectedRoomType = roomTypes.find(rt => rt.room_type_id == value);
                        setFormData(prev => ({
                          ...prev,
                          room_type_id: value,
                          booked_rate: selectedRoomType ? selectedRoomType.daily_rate : ''
                        }));
                      }}
                      placeholder="Select room type"
                      searchPlaceholder="Search room types..."
                      displayKey="name"
                      valueKey="room_type_id"
                      searchKeys={['name', 'description']}
                      renderOption={(roomType) => `${roomType.name} - Rs. ${roomType.daily_rate}/night - Capacity: ${roomType.capacity}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Number of Rooms</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.room_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, room_quantity: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Check In Date</label>
                  <input
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => {
                      setFormData({ ...formData, check_in_date: e.target.value });
                      resetAvailability();
                    }}
                    className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Check Out Date</label>
                  <input
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => {
                      setFormData({ ...formData, check_out_date: e.target.value });
                      resetAvailability();
                    }}
                    className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 bg-surface-tertiary">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Availability</p>
                    <p className="text-xs text-slate-400">
                      Check real-time conflicts before confirming the booking.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={checkAvailability}
                    disabled={availabilityLoading}
                    className="btn-secondary text-sm"
                  >
                    {availabilityLoading ? 'Checking...' : 'Check availability'}
                  </button>
                </div>
                {availabilityError && (
                  <p className="mt-3 text-sm text-red-600">{availabilityError}</p>
                )}
                {availability && (
                  <div
                    className={`mt-3 rounded-md px-3 py-2 text-sm ${
                      availability.available
                        ? 'bg-emerald-900/20 text-emerald-300 border border-emerald-700'
                        : 'bg-rose-900/20 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {availability.available
                      ? formData.is_group_booking 
                        ? `Sufficient rooms available! Found ${availability.available_rooms || formData.room_quantity} rooms of this type for the selected dates.`
                        : 'Room is currently free for the selected dates.'
                      : formData.is_group_booking
                        ? 'Insufficient rooms available for the selected dates. Try reducing quantity or selecting different dates.'
                        : 'Room is already booked for that date range.'}
                  </div>
                )}
                {!!suggestions.length && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-white mb-2">
                      {formData.is_group_booking ? 'Suggested room types' : 'Suggested rooms'}
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {suggestions.map((room) => (
                        <button
                          type="button"
                          key={room.room_id || room.room_type_id}
                          onClick={() => {
                            if (formData.is_group_booking) {
                              // For group bookings, update room type
                              setFormData(prev => ({
                                ...prev,
                                room_type_id: String(room.room_type_id),
                                booked_rate: room.daily_rate || room.base_rate
                              }));
                            } else {
                              // For individual bookings, update room
                              handleRoomChange(room.room_id);
                              setFormData((prev) => ({ ...prev, room_id: String(room.room_id) }));
                            }
                          }}
                          className="w-full text-left rounded-md border border-border bg-slate-800 px-3 py-2 hover:border-luxury-gold transition"
                        >
                          <p className="font-medium text-white">
                            {formData.is_group_booking 
                              ? `${room.room_type_name || room.name} (${room.available_count || 'Available'} rooms)`
                              : `Room ${room.room_number}  ${room.type_name || room.room_type_name}`
                            }
                          </p>
                          <p className="text-xs text-slate-300">
                            {formData.is_group_booking
                              ? `Rs. ${room.daily_rate || room.base_rate}/night - Capacity: ${room.capacity}`
                              : `Capacity ${room.capacity} | Rate Rs. ${room.daily_rate}`
                            }
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {showAlternatives && !suggestions.length && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-white">
                      Free rooms for the selected stay
                    </p>
                    {freeRooms.length === 0 && (
                      <p className="text-xs text-slate-400">
                        No rooms found for these dates.
                      </p>
                    )}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {freeRooms.map((room) => (
                        <button
                          type="button"
                          key={room.room_id}
                          onClick={() => {
                            handleRoomChange(room.room_id);
                            setFormData((prev) => ({ ...prev, room_id: String(room.room_id) }));
                          }}
                          className="w-full text-left rounded-md border border-border bg-slate-800 px-3 py-2 hover:border-luxury-gold transition"
                        >
                          <p className="font-medium text-white">
                            Room {room.room_number}  {room.type_name || room.room_type_name}
                          </p>
                          <p className="text-xs text-slate-300">
                            Capacity {room.capacity} | Rate Rs. {room.daily_rate}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {formData.is_group_booking ? 'Rate per Room (Rs.)' : 'Daily Rate (Rs.)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.booked_rate}
                    onChange={(e) => setFormData({ ...formData, booked_rate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                    placeholder={formData.is_group_booking ? "Auto-filled from room type" : "Auto-filled from room"}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {formData.is_group_booking 
                      ? `Rate per night for each room (${formData.room_quantity} rooms × Rs. ${formData.booked_rate || 0} = Rs. ${(parseFloat(formData.booked_rate || 0) * parseInt(formData.room_quantity || 1)).toFixed(2)}/night total)`
                      : "Rate per night for this booking."
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {formData.is_group_booking ? 'Total Guests' : 'Number of Guests'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_guests}
                    onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                    required
                  />
                  {formData.is_group_booking && (
                    <p className="text-xs text-slate-400 mt-1">
                      Total number of guests across all rooms in this group booking.
                    </p>
                  )}
                </div>
              </div>

              {/* Group Booking Summary */}
              {formData.is_group_booking && (
                <div className="mt-4 p-4 bg-gradient-to-r from-luxury-gold/20 to-yellow-600/20 border-2 border-luxury-gold/30 rounded-xl shadow-lg">
                  <h3 className="text-lg font-bold text-luxury-gold mb-3 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-luxury-gold rounded-full"></span>
                    Group Booking Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-luxury-gold">Group Name:</span>
                      <span className="ml-2 text-white font-medium">{formData.group_name || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-luxury-gold">Room Type:</span>
                      <span className="ml-2 text-white font-medium">{roomTypes.find(rt => rt.room_type_id == formData.room_type_id)?.name || 'Not selected'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-luxury-gold">Number of Rooms:</span>
                      <span className="ml-2 text-white font-medium">{formData.room_quantity}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-luxury-gold">Total Guests:</span>
                      <span className="ml-2 text-white font-medium">{formData.number_of_guests}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-luxury-gold">Total Booking Amount:</span>
                      <span className="ml-2 text-white font-bold text-xl">Rs {calculateGroupTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Advance Payment (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.advance_payment}
                  onChange={(e) =>
                    setFormData({ ...formData, advance_payment: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                  placeholder={`Minimum Rs ${formData.is_group_booking ? calculateGroupAdvancePayment().toFixed(2) : calculateAdvancePayment().toFixed(2)} (10% of total)`}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Minimum Rs {formData.is_group_booking ? calculateGroupAdvancePayment().toFixed(2) : calculateAdvancePayment().toFixed(2)} (10% of total stay amount) required to confirm the booking.
                  {formData.is_group_booking && (
                    <span className="block mt-1">
                      Total booking amount: Rs {calculateGroupTotalAmount().toFixed(2)} for {formData.room_quantity} rooms × {calculateNumberOfNights()} nights
                    </span>
                  )}
                </p>
              </div>
            </>
          )}
          </form>
        </div>
        
        {/* Fixed Footer */}
        <div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg flex-shrink-0 sticky bottom-0 z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 text-slate-300 font-semibold rounded-lg hover:bg-slate-700/60 hover:border-slate-500 hover:text-white transition-all duration-200 flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 flex-1"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
