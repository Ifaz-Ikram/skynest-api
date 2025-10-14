import { useState, useEffect } from 'react';
import api from '../../utils/api';

export const CreateBookingModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    guest_id: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    booked_rate: '',
  });
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch guests and rooms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guestsData, roomsData] = await Promise.all([
          api.getGuests(),
          api.getRooms()
        ]);
        setGuests(guestsData || []);
        setRooms(roomsData || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Use mock data if API fails
        console.warn('Using mock data due to API error');
        setGuests([
          { guest_id: 1, full_name: 'John Doe', email: 'john@example.com', phone: '0771234567' },
          { guest_id: 2, full_name: 'Jane Smith', email: 'jane@example.com', phone: '0777654321' },
          { guest_id: 3, full_name: 'Robert Johnson', email: 'robert@example.com', phone: '0779876543' },
        ]);
        setRooms([
          { room_id: 1, room_number: '101', room_type_desc: 'Deluxe', room_type_code: 'DLX', branch_name: 'Main Branch', daily_rate: 5000 },
          { room_id: 2, room_number: '102', room_type_desc: 'Suite', room_type_code: 'SUT', branch_name: 'Main Branch', daily_rate: 8000 },
          { room_id: 3, room_number: '201', room_type_desc: 'Standard', room_type_code: 'STD', branch_name: 'Main Branch', daily_rate: 3500 },
        ]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Auto-fill booked_rate when room is selected
  const handleRoomChange = (roomId) => {
    const selectedRoom = rooms.find(r => r.room_id === Number(roomId));
    setFormData({
      ...formData,
      room_id: roomId,
      booked_rate: selectedRoom ? selectedRoom.daily_rate : '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert to numbers before sending
      const bookingData = {
        guest_id: Number(formData.guest_id),
        room_id: Number(formData.room_id),
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        booked_rate: Number(formData.booked_rate),
        number_of_guests: Number(formData.number_of_guests),
      };
      await api.createBooking(bookingData);
      onSuccess();
    } catch (error) {
      alert('Failed to create booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">New Booking</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loadingData ? (
            <div className="text-center py-8 text-gray-500">Loading guests and rooms...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest</label>
                <select
                  value={formData.guest_id}
                  onChange={(e) => setFormData({...formData, guest_id: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select a guest</option>
                  {guests.map(guest => (
                    <option key={guest.guest_id} value={guest.guest_id}>
                      {guest.full_name} - {guest.email || guest.phone || `ID: ${guest.guest_id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <select
                  value={formData.room_id}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select a room</option>
                  {rooms.map(room => (
                    <option key={room.room_id} value={room.room_id}>
                      Room {room.room_number} - {room.room_type_desc || room.room_type_code} 
                      {room.branch_name ? ` (${room.branch_name})` : ''} 
                      - Rs. {room.daily_rate}/night
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check In Date</label>
            <input
              type="date"
              value={formData.check_in_date}
              onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
              className="input-field"
              placeholder="DD/MM/YYYY"
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
              placeholder="DD/MM/YYYY"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (Rs.)</label>
            <input
              type="number"
              step="0.01"
              value={formData.booked_rate}
              onChange={(e) => setFormData({...formData, booked_rate: e.target.value})}
              className="input-field"
              placeholder="Auto-filled from room"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Rate per night for this booking</p>
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
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || loadingData} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
