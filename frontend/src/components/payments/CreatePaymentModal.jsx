import { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';

export const CreatePaymentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    booking_id: '',
    amount: '',
    method: 'Cash',
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const paymentMethodOptions = useMemo(
    () => [
      { id: 'Cash', name: 'Cash' },
      { id: 'Card', name: 'Card' },
      { id: 'Online', name: 'Online' },
      { id: 'BankTransfer', name: 'Bank Transfer' },
    ],
    [],
  );

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await api.getBookings();
        const bookingsList = data?.bookings || data || [];
        // Filter for active bookings (Confirmed or Checked-In)
        const activeBookings = bookingsList.filter(b => 
          b.status === 'Confirmed' || b.status === 'Checked-In' || b.status === 'Checked-Out'
        );
        
        // Fetch payment information for each booking
        const bookingsWithPayments = await Promise.all(
          activeBookings.map(async (booking) => {
            try {
              const paymentData = await api.request(`/api/bookings/${booking.booking_id}/payments`);
              console.log(`Payment data for booking ${booking.booking_id}:`, paymentData);
              const totalPaid = paymentData.payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
              const totalAdjustments = paymentData.adjustments?.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0) || 0;
              const totalPaidAmount = totalPaid + totalAdjustments;
              const totalAmount = parseFloat(booking.total_amount || 0);
              const balanceDue = totalAmount - totalPaidAmount;
              
              console.log(`Booking ${booking.booking_id} calculation:`, {
                totalPaid,
                totalAdjustments,
                totalPaidAmount,
                totalAmount,
                balanceDue
              });
              
              return {
                ...booking,
                total_paid: totalPaidAmount,
                balance_due: balanceDue,
                is_overpaid: balanceDue < 0
              };
            } catch (error) {
              console.error(`Failed to fetch payments for booking ${booking.booking_id}:`, error);
              return {
                ...booking,
                total_paid: 0,
                balance_due: parseFloat(booking.total_amount || 0),
                is_overpaid: false
              };
            }
          })
        );
        
        setBookings(bookingsWithPayments);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchBookings();
  }, []);

  const selectedBooking = bookings.find(b => b.booking_id === parseInt(formData.booking_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('/api/payments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (error) {
      alert('Failed to create payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0" style={{ zIndex: 'var(--z-sticky)' }}>
          <h2 className="text-2xl font-bold text-white">Record Payment</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative z-30">
            <label className="block text-sm font-medium text-slate-300 mb-2">Booking ID</label>
            {loadingData ? (
              <div className="input-field flex items-center justify-center bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400">
                <span className="text-slate-400">Loading bookings...</span>
              </div>
            ) : (
              <SearchableDropdown
                options={bookings}
                value={formData.booking_id}
                onChange={(value) => setFormData({...formData, booking_id: value})}
                placeholder="Select a booking"
                searchPlaceholder="Search by booking ID, guest name, or room..."
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                required
                displayKey="displayText"
                valueKey="booking_id"
                searchKeys={['booking_id', 'guest_name', 'customer_name', 'room_number']}
                renderOption={(booking) => (
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <div className="font-medium">Booking #{booking.booking_id}</div>
                      <div className="text-sm text-slate-300">
                        {booking.guest_name || booking.customer_name}
                        {booking.room_number ? ` - Room ${booking.room_number}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        booking.is_overpaid ? 'text-red-600' : 
                        booking.balance_due > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {booking.is_overpaid 
                          ? `Overpaid: Rs ${Math.abs(booking.balance_due).toFixed(2)}`
                          : booking.balance_due > 0 
                            ? `Due: Rs ${booking.balance_due.toFixed(2)}`
                            : 'Paid in Full'
                        }
                      </div>
                      <div className="text-xs text-slate-400">
                        Total: Rs {parseFloat(booking.total_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
                renderSelected={(booking) => (
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <span className="font-medium">Booking #{booking.booking_id}</span>
                      <span className="ml-2 text-slate-300">
                        {booking.guest_name || booking.customer_name}
                    {booking.room_number ? ` - Room ${booking.room_number}` : ''}
                      </span>
                    </div>
                    <div className={`font-bold ${
                      booking.is_overpaid ? 'text-red-600' : 
                      booking.balance_due > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {booking.is_overpaid 
                        ? `Overpaid: Rs ${Math.abs(booking.balance_due).toFixed(2)}`
                        : booking.balance_due > 0 
                          ? `Due: Rs ${booking.balance_due.toFixed(2)}`
                          : 'Paid in Full'
                      }
                    </div>
                  </div>
                )}
                emptyMessage="No bookings found"
                loading={loadingData}
                loadingMessage="Loading bookings..."
              />
            )}
            {bookings.length === 0 && !loadingData && (
              <p className="text-sm text-slate-400 mt-2">
                No active bookings found. Only confirmed, checked-in, or checked-out bookings can receive payments.
              </p>
            )}
          </div>

          {selectedBooking && (
            <div className="bg-surface-tertiary p-4 rounded-lg space-y-3 text-sm">
              <h3 className="font-semibold text-white">Booking Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-slate-300">
                  <span className="font-medium">Customer:</span> {selectedBooking.guest_name || selectedBooking.customer_name}
                </div>
                <div className="text-slate-300">
                  <span className="font-medium">Room:</span> {selectedBooking.room_number}
                </div>
                <div className="text-slate-300">
                  <span className="font-medium">Status:</span> {selectedBooking.status}
                </div>
                <div className="text-slate-300">
                  <span className="font-medium">Total Amount:</span> 
                  <span className="text-luxury-gold font-bold ml-1">
                    Rs {parseFloat(selectedBooking.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Payment Summary */}
              <div className="border-t border-border pt-3">
                <h4 className="font-semibold text-white mb-2">Payment Summary</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Total Amount:</span>
                    <span className="font-medium">Rs {parseFloat(selectedBooking.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Amount Paid:</span>
                    <span className="font-medium">Rs {parseFloat(selectedBooking.total_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="font-semibold text-white">
                      {selectedBooking.is_overpaid ? 'Overpaid Amount:' : 'Balance Due:'}
                    </span>
                    <span className={`font-bold ${
                      selectedBooking.is_overpaid ? 'text-red-600' : 
                      selectedBooking.balance_due > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {selectedBooking.is_overpaid 
                        ? `Rs ${Math.abs(selectedBooking.balance_due).toFixed(2)}`
                        : `Rs ${selectedBooking.balance_due.toFixed(2)}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              required
              placeholder={selectedBooking ? `Suggested: Rs ${Math.max(0, selectedBooking.balance_due).toFixed(2)}` : ''}
            />
            {selectedBooking && (
              <div className="mt-1 text-xs text-slate-400">
                {selectedBooking.is_overpaid ? (
                  <span className="text-red-600">⚠️ This booking is already overpaid by Rs {Math.abs(selectedBooking.balance_due).toFixed(2)}</span>
                ) : selectedBooking.balance_due > 0 ? (
                  <span className="text-orange-600">💡 Suggested amount: Rs {selectedBooking.balance_due.toFixed(2)}</span>
                ) : (
                  <span className="text-green-600">✅ This booking is fully paid</span>
                )}
              </div>
            )}
          </div>
          <div className="relative z-20">
            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
            <SearchableDropdown
              value={formData.method}
              onChange={(value) => setFormData({ ...formData, method: value })}
              options={paymentMethodOptions}
              placeholder="Select payment method"
              hideSearch
              clearable={false}
              className="w-full"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || loadingData || !formData.booking_id} 
              className="btn-primary flex-1"
            >
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
