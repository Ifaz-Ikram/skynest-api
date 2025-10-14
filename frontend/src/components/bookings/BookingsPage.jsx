import { useState, useEffect } from 'react';
import { Calendar, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import { CreateBookingModal } from './CreateBookingModal';
import { BookingDetailsModal } from './BookingDetailsModal';

export const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    searchCustomer: '',
    searchBookingId: '',
    startDate: '',
    endDate: '',
    roomNumber: '',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setError(null);
      const data = await api.getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setError(error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
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
      loadBookings();
    } catch (error) {
      alert('Failed to check in: ' + error.message);
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      await api.request(`/api/bookings/${bookingId}/checkout`, { method: 'POST' });
      loadBookings();
    } catch (error) {
      alert('Failed to check out: ' + error.message);
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

  const filteredBookings = bookings.filter(b => {
    // Status filter
    if (filter !== 'All' && b.status !== filter) return false;
    
    // Advanced filters
    if (advancedFilters.searchCustomer && !b.customer_name?.toLowerCase().includes(advancedFilters.searchCustomer.toLowerCase())) return false;
    if (advancedFilters.searchBookingId && !String(b.booking_id).includes(advancedFilters.searchBookingId)) return false;
    if (advancedFilters.roomNumber && !String(b.room_number).includes(advancedFilters.roomNumber)) return false;
    if (advancedFilters.startDate && new Date(b.check_in_date) < new Date(advancedFilters.startDate)) return false;
    if (advancedFilters.endDate && new Date(b.check_out_date) > new Date(advancedFilters.endDate)) return false;
    
    return true;
  });

  const statuses = ['All', 'Booked', 'Checked-In', 'Checked-Out', 'Cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage all hotel reservations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="btn-secondary">
            <Download className="w-4 h-4 mr-2 inline" />
            Export CSV
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Calendar className="w-5 h-5 mr-2 inline" />
            New Booking
          </button>
        </div>
      </div>

      {/* Advanced Search Filters */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              value={advancedFilters.searchCustomer}
              onChange={(e) => setAdvancedFilters({...advancedFilters, searchCustomer: e.target.value})}
              className="input-field"
              placeholder="Search customer..."
            />
          </div>
          <div>
            <input
              type="text"
              value={advancedFilters.searchBookingId}
              onChange={(e) => setAdvancedFilters({...advancedFilters, searchBookingId: e.target.value})}
              className="input-field"
              placeholder="Booking ID..."
            />
          </div>
          <div>
            <input
              type="text"
              value={advancedFilters.roomNumber}
              onChange={(e) => setAdvancedFilters({...advancedFilters, roomNumber: e.target.value})}
              className="input-field"
              placeholder="Room number..."
            />
          </div>
          <div>
            <input
              type="date"
              value={advancedFilters.startDate}
              onChange={(e) => setAdvancedFilters({...advancedFilters, startDate: e.target.value})}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <input
              type="date"
              value={advancedFilters.endDate}
              onChange={(e) => setAdvancedFilters({...advancedFilters, endDate: e.target.value})}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
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
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
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
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map(booking => (
              <div key={booking.booking_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.guest_name || 'Guest'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'Checked-In' ? 'bg-green-100 text-green-700' :
                        booking.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Room</p>
                        <p className="font-medium text-gray-900">{booking.room_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check In</p>
                        <p className="font-medium text-gray-900">
                          {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check Out</p>
                        <p className="font-medium text-gray-900">
                          {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-bold text-luxury-gold">
                          ${parseFloat(booking.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
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
                    {booking.status === 'Checked-In' && (
                      <button 
                        onClick={() => handleCheckOut(booking.booking_id)}
                        className="btn-secondary text-sm"
                      >
                        Check Out
                      </button>
                    )}
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
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            loadBookings();
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
    </div>
  );
};
