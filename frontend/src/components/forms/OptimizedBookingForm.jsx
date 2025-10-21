// frontend/src/components/forms/OptimizedBookingForm.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, User, Bed, DollarSign, Percent, CreditCard } from 'lucide-react';
import api from '../../utils/api';
import { validateBookingForm, hasValidationErrors } from '../../utils/validation';
import SearchableDropdown from '../common/SearchableDropdown';

const OptimizedBookingForm = ({ onBookingCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    guest_id: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    booked_rate: '',
    tax_rate_percent: 0,
    advance_payment: 0,
    preferred_payment_method: 'Cash'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load available rooms when dates change
  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date) {
      loadAvailableRooms();
    }
  }, [formData.check_in_date, formData.check_out_date]);

  // Recalculate advance payment when dates or booking rate changes
  useEffect(() => {
    if (formData.booked_rate && formData.check_in_date && formData.check_out_date) {
      const rate = parseFloat(formData.booked_rate) || 0;
      const nights = calculateNumberOfNights();
      const totalRate = rate * nights;
      const taxRate = parseFloat(formData.tax_rate_percent) || 0;
      const tax = totalRate * (taxRate / 100);
      const totalAmount = totalRate + tax;
      const advancePayment = totalAmount * 0.1; // 10% of total amount
      
      setFormData(prev => ({
        ...prev,
        advance_payment: advancePayment.toFixed(2)
      }));
    }
  }, [formData.check_in_date, formData.check_out_date, formData.booked_rate, formData.tax_rate_percent]);

  const loadInitialData = async () => {
    try {
      const [guestsData, roomTypesData] = await Promise.all([
        api.getGuests({ limit: 100 }),
        api.getRoomTypes()
      ]);
      
      setGuests(guestsData.guests || []);
      setRoomTypes(roomTypesData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const rooms = await api.getFreeRooms({
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date
      });
      setAvailableRooms(rooms || []);
    } catch (error) {
      console.error('Error loading available rooms:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate advance payment when booking rate changes
    if (field === 'booked_rate' && value && formData.check_in_date && formData.check_out_date) {
      const rate = parseFloat(value) || 0;
      const nights = calculateNumberOfNights();
      const totalRate = rate * nights;
      const taxRate = parseFloat(formData.tax_rate_percent) || 0;
      const tax = totalRate * (taxRate / 100);
      const totalAmount = totalRate + tax;
      const advancePayment = totalAmount * 0.1; // 10% of total amount
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        advance_payment: advancePayment.toFixed(2)
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateBookingForm(formData);
    setErrors(validationErrors);
    
    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setLoading(true);
    
    try {
      const booking = await api.createBooking(formData);
      onBookingCreated(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
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
    const totalRate = rate * nights;
    const taxRate = parseFloat(formData.tax_rate_percent) || 0;
    const tax = totalRate * (taxRate / 100);
    return totalRate + tax;
  };

  const calculateMinimumAdvance = () => {
    const total = calculateTotalAmount();
    return total * 0.1; // 10% minimum
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-surface-secondary rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Bed className="w-6 h-6 mr-2 text-blue-600" />
        Create New Booking
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Guest *
            </label>
            <SearchableDropdown
              options={guests}
              value={formData.guest_id}
              onChange={(value) => handleInputChange('guest_id', value)}
              placeholder="Select a guest..."
              searchPlaceholder="Search guests by name or email..."
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.guest_id ? 'border-red-500' : 'border-border dark:border-slate-600'
              }`}
              required
              displayKey="full_name"
              valueKey="guest_id"
              searchKeys={['full_name', 'email', 'phone']}
              renderOption={(guest) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{guest.full_name}</div>
                    <div className="text-sm text-slate-300">
                      {guest.email && `${guest.email}`}
                      {guest.phone && ` | ${guest.phone}`}
                    </div>
                  </div>
                </div>
              )}
              renderSelected={(guest) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{guest.full_name}</span>
                  <span className="text-sm text-slate-300">{guest.email}</span>
                </div>
              )}
              emptyMessage="No guests found"
            />
            {errors.guest_id && (
              <p className="mt-1 text-sm text-red-600">{errors.guest_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Bed className="w-4 h-4 inline mr-1" />
              Room *
            </label>
            <SearchableDropdown
              options={availableRooms}
              value={formData.room_id}
              onChange={(value) => handleInputChange('room_id', value)}
              placeholder="Select a room..."
              searchPlaceholder="Search rooms by number or type..."
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.room_id ? 'border-red-500' : 'border-border dark:border-slate-600'
              }`}
              required
              displayKey="room_number"
              valueKey="room_id"
              searchKeys={['room_number', 'room_type_name']}
              renderOption={(room) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">Room {room.room_number}</div>
                    <div className="text-sm text-slate-300">
                      {room.room_type_name} | Floor {room.floor}
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
                  <span className="font-medium">Room {room.room_number}</span>
                  <span className="text-sm text-slate-300">
                    {room.room_type_name} - Rs {parseFloat(room.base_rate).toFixed(2)}/night
                  </span>
                </div>
              )}
              emptyMessage="No rooms available"
            />
            {errors.room_id && (
              <p className="mt-1 text-sm text-red-600">{errors.room_id}</p>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Check-in Date *
            </label>
            <input
              type="date"
              value={formData.check_in_date}
              onChange={(e) => handleInputChange('check_in_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.check_in_date ? 'border-red-500' : 'border-border dark:border-slate-600'
              }`}
            />
            {errors.check_in_date && (
              <p className="mt-1 text-sm text-red-600">{errors.check_in_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Check-out Date *
            </label>
            <input
              type="date"
              value={formData.check_out_date}
              onChange={(e) => handleInputChange('check_out_date', e.target.value)}
              min={formData.check_in_date || new Date().toISOString().split('T')[0]}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.check_out_date ? 'border-red-500' : 'border-border dark:border-slate-600'
              }`}
            />
            {errors.check_out_date && (
              <p className="mt-1 text-sm text-red-600">{errors.check_out_date}</p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Booking Rate *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.booked_rate}
              onChange={(e) => handleInputChange('booked_rate', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.booked_rate ? 'border-red-500' : 'border-border dark:border-slate-600'
              }`}
            />
            {errors.booked_rate && (
              <p className="mt-1 text-sm text-red-600">{errors.booked_rate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Percent className="w-4 h-4 inline mr-1" />
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.tax_rate_percent}
              onChange={(e) => handleInputChange('tax_rate_percent', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.tax_rate_percent ? 'border-red-500' : 'border-border dark:border-slate-600'
              }`}
            />
            {errors.tax_rate_percent && (
              <p className="mt-1 text-sm text-red-600">{errors.tax_rate_percent}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Advance Payment
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={calculateTotalAmount()}
              value={formData.advance_payment}
              onChange={(e) => handleInputChange('advance_payment', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.advance_payment ? 'border-red-500' : 'border-border dark:border-slate-600'
              }`}
            />
            {errors.advance_payment && (
              <p className="mt-1 text-sm text-red-600">{errors.advance_payment}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Minimum: Rs {calculateMinimumAdvance().toFixed(2)}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Preferred Payment Method
          </label>
          <SearchableDropdown
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Card', label: 'Card' },
              { value: 'Online', label: 'Online' },
              { value: 'BankTransfer', label: 'Bank Transfer' }
            ]}
            value={formData.preferred_payment_method}
            onChange={(value) => handleInputChange('preferred_payment_method', value)}
            placeholder="Select payment method..."
            searchPlaceholder="Search payment methods..."
            className="w-full p-3 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            displayKey="label"
            valueKey="value"
            searchKeys={['label']}
            renderOption={(method) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-medium">{method.label}</div>
                </div>
              </div>
            )}
            renderSelected={(method) => (
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">{method.label}</span>
              </div>
            )}
            emptyMessage="No payment methods found"
          />
        </div>

        {/* Total Calculation */}
        <div className="bg-surface-tertiary p-4 rounded-lg">
          <h3 className="font-semibold text-white mb-2">Booking Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Nights:</span>
              <span>{calculateNumberOfNights()} night{calculateNumberOfNights() !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Rate:</span>
              <span>Rs {parseFloat(formData.booked_rate || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal ({calculateNumberOfNights()} nights):</span>
              <span>Rs {(parseFloat(formData.booked_rate || 0) * calculateNumberOfNights()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({formData.tax_rate_percent}%):</span>
              <span>Rs {(calculateTotalAmount() - (parseFloat(formData.booked_rate || 0) * calculateNumberOfNights())).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total Amount:</span>
              <span>Rs {calculateTotalAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Advance Payment (10%):</span>
              <span>Rs {parseFloat(formData.advance_payment || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-border dark:border-slate-600 rounded-lg text-slate-300 hover:bg-surface-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OptimizedBookingForm;
