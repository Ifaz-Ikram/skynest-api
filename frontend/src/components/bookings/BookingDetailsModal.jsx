import { useEffect, useState } from 'react';
import { X, Mail, FileText, Send, UserCheck, Bed, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
// Removed: DepositStatusCard - deposit feature not in schema
// Removed: GuaranteePolicyCard - guarantee feature not in schema
import CheckInModal from '../checkin/CheckInModal';
import RoomAssignmentModal from '../checkin/RoomAssignmentModal';
import CheckoutModal from '../checkout/CheckoutModal';

// Guest context constants and functions removed - feature not supported in current schema

export const BookingDetailsModal = ({ booking, onClose }) => {
  console.log('BookingDetailsModal received booking:', booking);
  
  // Check-in state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showRoomAssignmentModal, setShowRoomAssignmentModal] = useState(false);
  const [checkInRecord, setCheckInRecord] = useState(null);
  
  // Checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const loadCheckInRecord = async () => {
    try {
      const record = await api.getCheckInRecord(booking.booking_id);
      setCheckInRecord(record);
    } catch (error) {
      // Check-in record doesn't exist yet
      setCheckInRecord(null);
    }
  };

  useEffect(() => {
    loadCheckInRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.booking_id]);

  const sendConfirmation = async () => {
    try {
      await api.sendBookingConfirmation(booking.booking_id);
      alert('Confirmation email queued');
    } catch (e) {
      alert('Failed to send confirmation: ' + e.message);
    }
  };

  const sendInvoice = async () => {
    try {
      await api.sendInvoiceEmail(booking.booking_id);
      alert('Invoice email queued');
    } catch (e) {
      alert('Failed to send invoice: ' + e.message);
    }
  };

  const viewInvoice = () => {
    const url = api.getInvoiceHtmlUrl(booking.booking_id);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Booking Details</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Booking ID</p>
              <p className="font-medium text-text-primary">{booking.booking_id}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  booking.status === 'Checked-In'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : booking.status === 'Booked'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Guest Name</p>
              <p className="font-medium text-text-primary">{booking.guest_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Room Number</p>
              <p className="font-medium text-text-primary">{booking.room_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Check In Date</p>
              <p className="font-medium text-text-primary">
                {booking.check_in_date
                  ? format(new Date(booking.check_in_date), 'dd/MM/yyyy')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Check Out Date</p>
              <p className="font-medium text-text-primary">
                {booking.check_out_date
                  ? format(new Date(booking.check_out_date), 'dd/MM/yyyy')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Number of Guests</p>
              <p className="font-medium text-text-primary">{booking.number_of_guests || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Amount</p>
              <p className="font-bold text-luxury-gold text-lg">
                Rs {parseFloat(booking.total_amount || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-wrap gap-2">
            <button onClick={sendConfirmation} className="btn-secondary flex items-center gap-2">
              <Mail className="w-4 h-4" /> Send Confirmation
            </button>
            <button onClick={sendInvoice} className="btn-secondary flex items-center gap-2">
              <Send className="w-4 h-4" /> Email Invoice
            </button>
            <button onClick={viewInvoice} className="btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" /> View Invoice
            </button>
            
            {/* Check-in Actions */}
            {booking.status === 'Booked' && !checkInRecord && (
              <button 
                onClick={() => setShowCheckInModal(true)} 
                className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <UserCheck className="w-4 h-4" /> Check In Guest
              </button>
            )}
            
            {booking.status === 'Checked-In' && checkInRecord && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <UserCheck className="w-4 h-4" />
                <span>Checked in on {format(new Date(checkInRecord.check_in_time), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            )}
            
                <button 
                  onClick={() => setShowRoomAssignmentModal(true)} 
                  className="btn-secondary flex items-center gap-2"
                >
                  <Bed className="w-4 h-4" /> Assign Room
                </button>
                
                {/* Checkout Actions */}
                {booking.status === 'Checked-In' && (
                  <button 
                    onClick={() => setShowCheckoutModal(true)} 
                    className="btn-primary flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <Receipt className="w-4 h-4" /> Checkout Guest
                  </button>
                )}
          </div>

          {/* Guest Context Section - REMOVED (Phase 2 feature requiring additional database tables) */}
          {/* Guest context feature removed - requires guest_preference, guest_alert, loyalty_program, booking_meta tables */}

          {/* Deposit Status Section - REMOVED (not in schema) */}
          {/* Deposit tracking now via booking.advance_payment only */}

          {/* Guarantee Policy Section - REMOVED (not in schema) */}
          {/* Guarantee feature removed - no database table */}
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <CheckInModal
          booking={booking}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={() => {
            setShowCheckInModal(false);
            loadCheckInRecord();
            // Refresh booking data if needed
          }}
        />
      )}

          {/* Room Assignment Modal */}
          {showRoomAssignmentModal && (
            <RoomAssignmentModal
              booking={booking}
              onClose={() => setShowRoomAssignmentModal(false)}
              onAssign={(newRoom) => {
                setShowRoomAssignmentModal(false);
                // Refresh booking data if needed
              }}
            />
          )}

          {/* Checkout Modal */}
          {showCheckoutModal && booking && booking.booking_id && typeof booking.booking_id === 'number' && booking.booking_id > 0 && (
            <CheckoutModal
              booking={booking}
              onClose={() => setShowCheckoutModal(false)}
              onSuccess={() => {
                setShowCheckoutModal(false);
                // Refresh booking data if needed
              }}
            />
          )}
    </div>
  );
};
