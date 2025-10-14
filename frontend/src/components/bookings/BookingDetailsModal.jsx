import { X } from 'lucide-react';
import { format } from 'date-fns';

export const BookingDetailsModal = ({ booking, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Booking ID</p>
              <p className="font-medium text-gray-900">{booking.booking_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                booking.status === 'Checked-In' ? 'bg-green-100 text-green-700' :
                booking.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Guest Name</p>
              <p className="font-medium text-gray-900">{booking.guest_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Room Number</p>
              <p className="font-medium text-gray-900">{booking.room_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check In Date</p>
              <p className="font-medium text-gray-900">
                {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check Out Date</p>
              <p className="font-medium text-gray-900">
                {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Guests</p>
              <p className="font-medium text-gray-900">{booking.number_of_guests || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-bold text-luxury-gold text-lg">
                ${parseFloat(booking.total_amount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
