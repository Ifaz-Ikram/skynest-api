import React, { useState, useEffect } from 'react';
import { Search, UserCheck, DoorOpen, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';
import SearchableDropdown from '../common/SearchableDropdown';

const QuickCheckInWidget = ({ onCheckInComplete }) => {
  const [pendingCheckIns, setPendingCheckIns] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPendingCheckIns();
    loadAvailableRooms();
  }, []);

  const loadPendingCheckIns = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const response = await api.request('/api/bookings');

      // Filter for pending check-ins (Pre-Booked status with today's check-in date)
      const pending = response.filter(booking => 
        booking.status === 'Pre-Booked' && 
        booking.check_in_date === today
      );

      setPendingCheckIns(pending);
    } catch (err) {
      console.error('Failed to load pending check-ins:', err);
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const response = await api.request('/api/rooms');

      // Filter for available rooms
      const available = response.filter(room => 
        room.status === 'Available' || room.status === 'Clean'
      );

      setAvailableRooms(available);
    } catch (err) {
      console.error('Failed to load available rooms:', err);
    }
  };

  const handleQuickCheckIn = async (booking) => {
    if (!selectedRoom && !booking.room_id) {
      setError('Please select a room first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Perform check-in
      await api.request(
        `/api/bookings/${booking.booking_id}/checkin`,
        'POST',
        {
          room_id: selectedRoom || booking.room_id,
          actual_check_in: new Date().toISOString()
        }
      );

      setSuccess(`Successfully checked in ${booking.guest_name}!`);
      setSelectedBooking(null);
      setSelectedRoom('');
      
      // Reload data
      await loadPendingCheckIns();
      await loadAvailableRooms();
      
      // Callback to parent
      if (onCheckInComplete) {
        onCheckInComplete();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to perform check-in');
    } finally {
      setLoading(false);
    }
  };

  const filteredCheckIns = pendingCheckIns.filter(booking =>
    booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.booking_id?.toString().includes(searchTerm) ||
    booking.guest_id?.toString().includes(searchTerm)
  );

  return (
    <div className="bg-surface-secondary rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-luxury-gold" />
          Quick Check-In
        </h3>
        <span className="text-sm text-text-tertiary">
          {pendingCheckIns.length} pending today
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by name, booking ID, or guest ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
        />
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Pending Check-Ins List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredCheckIns.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No pending check-ins for today</p>
          </div>
        ) : (
          filteredCheckIns.map((booking) => (
            <div
              key={booking.booking_id}
              className={`p-4 border rounded-lg transition-all ${
                selectedBooking?.booking_id === booking.booking_id
                  ? 'border-luxury-gold bg-yellow-50'
                  : 'border-border hover:border-border dark:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-text-primary">{booking.guest_name}</h4>
                  <p className="text-sm text-text-tertiary">
                    Booking #{booking.booking_id} • Guest #{booking.guest_id}
                  </p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                  {booking.room_type}
                </span>
              </div>

              <div className="text-sm text-text-secondary mb-3">
                <p>Check-in: {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}</p>
                <p>Nights: {booking.number_of_nights} • Adults: {booking.number_of_adults}</p>
              </div>

              {/* Room Assignment */}
              {selectedBooking?.booking_id === booking.booking_id && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Assign Room
                  </label>
                  <SearchableDropdown
                    value={selectedRoom}
                    onChange={(value) => setSelectedRoom(value)}
                    options={availableRooms
                      .filter(room => room.room_type === booking.room_type)
                      .map(room => ({
                        id: String(room.room_id),
                        name: `${room.room_number} - ${room.room_type}`,
                      }))}
                    placeholder="Select available room..."
                    className="w-full"
                    buttonClassName="!w-full !px-3 !py-2 !rounded-lg !border border-border dark:border-slate-600 focus-visible:!ring-luxury-gold focus-visible:!ring-offset-0"
                    searchPlaceholder="Search rooms..."
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {selectedBooking?.booking_id === booking.booking_id ? (
                  <>
                    <button
                      onClick={() => handleQuickCheckIn(booking)}
                      disabled={loading || !selectedRoom}
                      className="flex-1 bg-luxury-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <DoorOpen className="w-4 h-4" />
                      {loading ? 'Processing...' : 'Confirm Check-In'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(null);
                        setSelectedRoom('');
                        setError('');
                      }}
                      className="px-4 py-2 border border-border dark:border-slate-600 rounded-lg hover:bg-surface-tertiary transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 bg-luxury-navy text-white px-4 py-2 rounded-lg hover:bg-indigo-900 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Check In
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuickCheckInWidget;
