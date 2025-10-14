import { useState, useEffect } from 'react';
import { Bed } from 'lucide-react';
import api from '../../utils/api';

export const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [freeRooms, setFreeRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'available'

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const [allRooms, available] = await Promise.all([
        api.request('/api/catalog/rooms'),
        api.request('/api/catalog/free-rooms')
      ]);
      setRooms(allRooms);
      setFreeRooms(available);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayRooms = viewMode === 'available' ? freeRooms : rooms;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-600 mt-1">Manage hotel room inventory</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'all' ? 'bg-luxury-gold text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            All Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setViewMode('available')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'available' ? 'bg-luxury-gold text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            Available ({freeRooms.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="card h-48 skeleton"></div>
          ))
        ) : displayRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No rooms found</p>
          </div>
        ) : (
          displayRooms.map(room => (
            <div key={room.room_id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Room {room.room_number}</h3>
                  <p className="text-sm text-gray-600">{room.room_type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room.status === 'Available' ? 'bg-green-100 text-green-700' :
                  room.status === 'Occupied' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Floor:</span>
                  <span className="font-medium">{room.floor_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Night:</span>
                  <span className="font-bold text-luxury-gold">${room.price_per_night}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Occupancy:</span>
                  <span className="font-medium">{room.max_occupancy} guests</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
