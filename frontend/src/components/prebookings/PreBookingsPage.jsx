import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';

const PreBookingsPage = () => {
  const [preBookings, setPreBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPreBookings();
  }, []);

  const loadPreBookings = async () => {
    try {
      setError(null);
      const data = await api.getPreBookings();
      setPreBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load pre-bookings:', error);
      setError(error.message);
      setPreBookings([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold text-gray-900">Pre-Bookings</h1>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Pre-Bookings</h1>
          <p className="text-gray-600 mt-1">Advance booking requests and reservations</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          New Pre-Booking
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading pre-bookings...</p>
          </div>
        ) : preBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No pre-bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {preBookings.map(preBooking => (
              <div key={preBooking.pre_booking_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {preBooking.prebooking_code || `Pre-Booking #${preBooking.pre_booking_id}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        preBooking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                        preBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {preBooking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Customer</p>
                        <p className="font-medium text-gray-900">{preBooking.customer_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check In</p>
                        <p className="font-medium text-gray-900">
                          {preBooking.check_in_date ? format(new Date(preBooking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check Out</p>
                        <p className="font-medium text-gray-900">
                          {preBooking.check_out_date ? format(new Date(preBooking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Guests</p>
                        <p className="font-medium text-gray-900">{preBooking.number_of_guests || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePreBookingModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPreBookings();
          }}
        />
      )}
    </div>
  );
};

// Create Pre-Booking Modal
const CreatePreBookingModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    room_type_preference: '',
    special_requests: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createPreBooking(formData);
      alert('Pre-booking created successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to create pre-booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-gray-900">New Pre-Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID</label>
            <input
              type="number"
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check In Date</label>
            <input
              type="date"
              value={formData.check_in_date}
              onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check Out Date</label>
            <input
              type="date"
              value={formData.check_out_date}
              onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Type Preference</label>
            <input
              type="text"
              value={formData.room_type_preference}
              onChange={(e) => setFormData({...formData, room_type_preference: e.target.value})}
              className="input-field"
              placeholder="e.g., Deluxe, Suite"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
            <textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
              className="input-field"
              rows="3"
              placeholder="Any special requirements..."
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Pre-Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreBookingsPage;
