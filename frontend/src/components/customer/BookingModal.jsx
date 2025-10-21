// frontend/src/components/customer/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Bed, Users, DollarSign, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import { format, addDays } from 'date-fns';
import SearchableDropdown from '../common/SearchableDropdown';

const BookingModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [formData, setFormData] = useState({
    room_type_id: '',
    check_in_date: '',
    check_out_date: '',
    guests: 1,
    special_requests: ''
  });

  useEffect(() => {
    loadRoomTypes();
    // Set default dates
    const today = new Date();
    const tomorrow = addDays(today, 1);
    setFormData(prev => ({
      ...prev,
      check_in_date: format(today, 'yyyy-MM-dd'),
      check_out_date: format(tomorrow, 'yyyy-MM-dd')
    }));
  }, []);

  const loadRoomTypes = async () => {
    try {
      const types = await api.getRoomTypes();
      setRoomTypes(types);
    } catch (err) {
      setError('Failed to load room types');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createCustomerBooking(formData);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateNights = () => {
    if (formData.check_in_date && formData.check_out_date) {
      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);
      const diffTime = Math.abs(checkOut - checkIn);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const calculateTotal = () => {
    const selectedRoom = roomTypes.find(room => room.room_type_id === parseInt(formData.room_type_id));
    if (selectedRoom) {
      return selectedRoom.base_rate * calculateNights();
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-surface-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Create New Booking</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Room Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Bed className="w-4 h-4 inline mr-2" />
              Room Type
            </label>
            <SearchableDropdown
              options={roomTypes}
              value={formData.room_type_id}
              onChange={(value) => handleInputChange({ target: { name: 'room_type_id', value } })}
              placeholder="Select a room type"
              searchPlaceholder="Search room types..."
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              displayKey="name"
              valueKey="room_type_id"
              searchKeys={['name']}
              renderOption={(room) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm text-text-secondary">
                      Capacity: {room.capacity} guests
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-luxury-gold">
                      Rs {parseFloat(room.base_rate).toFixed(2)}/night
                    </div>
                  </div>
                </div>
              )}
              renderSelected={(room) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{room.name}</span>
                  <span className="text-sm text-text-secondary">
                    Rs {parseFloat(room.base_rate).toFixed(2)}/night
                  </span>
                </div>
              )}
              emptyMessage="No room types found"
            />
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Check-in Date
              </label>
              <input
                type="date"
                name="check_in_date"
                value={formData.check_in_date}
                onChange={handleInputChange}
                required
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Check-out Date
              </label>
              <input
                type="date"
                name="check_out_date"
                value={formData.check_out_date}
                onChange={handleInputChange}
                required
                min={formData.check_in_date || format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Number of Guests */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Number of Guests
            </label>
            <SearchableDropdown
              options={[1, 2, 3, 4, 5, 6].map(num => ({
                value: num,
                label: `${num} ${num === 1 ? 'Guest' : 'Guests'}`
              }))}
              value={formData.guests}
              onChange={(value) => handleInputChange({ target: { name: 'guests', value } })}
              placeholder="Select number of guests"
              searchPlaceholder="Search guest count..."
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              displayKey="label"
              valueKey="value"
              searchKeys={['label']}
              renderOption={(option) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{option.label}</div>
                  </div>
                </div>
              )}
              renderSelected={(option) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{option.label}</span>
                </div>
              )}
              emptyMessage="No guest options found"
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Special Requests
            </label>
            <textarea
              name="special_requests"
              value={formData.special_requests}
              onChange={handleInputChange}
              rows={3}
              placeholder="Any special requests or preferences..."
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100 bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100 placeholder:text-text-tertiary"
            />
          </div>

          {/* Booking Summary */}
          {formData.room_type_id && formData.check_in_date && formData.check_out_date && (
            <div className="bg-surface-tertiary rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Room Type:</span>
                  <span className="font-medium">
                    {roomTypes.find(room => room.room_type_id === parseInt(formData.room_type_id))?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Nights:</span>
                  <span className="font-medium">{calculateNights()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Rate per night:</span>
                  <span className="font-medium">
                    ${roomTypes.find(room => room.room_type_id === parseInt(formData.room_type_id))?.base_rate}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-text-primary font-medium">Total Amount:</span>
                  <span className="font-bold text-lg">${calculateTotal()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border dark:border-slate-600 rounded-md text-text-secondary hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.room_type_id}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Create Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
