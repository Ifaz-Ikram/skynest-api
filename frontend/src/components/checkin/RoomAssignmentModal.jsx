// frontend/src/components/checkin/RoomAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Search,
  ArrowUp,
  ArrowDown,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import api from '../../utils/api';
import { format, isAfter, isBefore, isWithinInterval } from 'date-fns';

const RoomAssignmentModal = ({ booking, onClose, onAssign }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomConflicts, setRoomConflicts] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [upgradeOptions, setUpgradeOptions] = useState([]);

  useEffect(() => {
    loadRoomData();
  }, [booking]);

  const loadRoomData = async () => {
    setLoading(true);
    try {
      // Load available rooms for the booking period
      const rooms = await api.getAvailableRooms({
        check_in: booking.check_in_date,
        check_out: booking.check_out_date,
        exclude_booking: booking.booking_id
      });
      
      // Load room types for upgrade options
      const types = await api.getRoomTypes();
      
      // Load current room conflicts
      const conflicts = await api.getRoomConflicts(booking.room_id, {
        check_in: booking.check_in_date,
        check_out: booking.check_out_date
      });

      setAvailableRooms(rooms);
      setRoomTypes(types);
      setRoomConflicts(conflicts);
      
      // Find upgrade options (higher tier rooms)
      const currentRoomType = types.find(rt => rt.room_type_id === booking.room_type_id);
      const upgrades = types.filter(rt => 
        rt.daily_rate > currentRoomType?.daily_rate && 
        rt.capacity >= booking.number_of_guests
      );
      setUpgradeOptions(upgrades);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkRoomAvailability = async (roomId, checkIn, checkOut) => {
    try {
      const conflicts = await api.getRoomConflicts(roomId, {
        check_in: checkIn,
        check_out: checkOut
      });
      return conflicts.length === 0;
    } catch (err) {
      console.error('Error checking room availability:', err);
      return false;
    }
  };

  const handleRoomSelect = async (room) => {
    setSelectedRoom(room);
    
    // Check for conflicts
    const isAvailable = await checkRoomAvailability(
      room.room_id, 
      booking.check_in_date, 
      booking.check_out_date
    );
    
    if (!isAvailable) {
      setError(`Room ${room.room_number} has conflicts during the selected period`);
    } else {
      setError(null);
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedRoom) return;
    
    setLoading(true);
    try {
      await api.assignRoom(booking.booking_id, selectedRoom.room_id);
      onAssign(selectedRoom);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = availableRooms.filter(room =>
    room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConflictSeverity = (conflict) => {
    if (conflict.type === 'overlap') return 'high';
    if (conflict.type === 'maintenance') return 'medium';
    return 'low';
  };

  const getConflictIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const renderRoomCard = (room) => {
    const isSelected = selectedRoom?.room_id === room.room_id;
    const hasConflicts = roomConflicts.some(c => c.room_id === room.room_id);
    
    return (
      <div
        key={room.room_id}
        onClick={() => handleRoomSelect(room)}
        className={`p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-900/20'
            : hasConflicts
            ? 'border-red-600 bg-red-900/20'
            : 'border-border hover:border-border dark:border-slate-600'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Bed className="w-5 h-5 text-slate-300" />
            <span className="font-medium text-white">Room {room.room_number}</span>
            {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
          </div>
          <div className="text-sm text-slate-300">
            ${room.daily_rate}/night
          </div>
        </div>
        
        <div className="text-sm text-slate-300 mb-2">
          {room.room_type} • Capacity: {room.capacity}
        </div>
        
        <div className="text-xs text-slate-400">
          {room.amenities}
        </div>
        
        {hasConflicts && (
          <div className="mt-2 p-2 bg-red-800/30 rounded text-xs text-red-300">
            <div className="flex items-center space-x-1">
              {getConflictIcon('high')}
              <span>Conflicts detected</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUpgradeOptions = () => {
    if (upgradeOptions.length === 0) return null;
    
    return (
      <div className="mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-white">Upgrade Options</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upgradeOptions.map(roomType => (
            <div key={roomType.room_type_id} className="p-4 border border-green-700 rounded-lg bg-green-900/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">{roomType.name}</span>
                <span className="text-sm text-green-300">
                  +${(roomType.daily_rate - booking.room_rate).toFixed(2)}/night
                </span>
              </div>
              <div className="text-sm text-green-300">
                Capacity: {roomType.capacity} • {roomType.amenities}
              </div>
              <button className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                Offer Upgrade
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConflicts = () => {
    if (roomConflicts.length === 0) return null;
    
    return (
      <div className="mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-white">Room Conflicts</h3>
        </div>
        
        <div className="space-y-3">
          {roomConflicts.map((conflict, index) => (
            <div key={index} className="p-3 border border-red-700 rounded-lg bg-red-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getConflictIcon(getConflictSeverity(conflict))}
                  <span className="font-medium text-red-900">{conflict.title}</span>
                </div>
                <span className="text-xs text-red-600">
                  {format(new Date(conflict.start_date), 'dd/MM')} - {format(new Date(conflict.end_date), 'dd/MM')}
                </span>
              </div>
              <div className="text-sm text-red-300 mt-1">
                {conflict.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex items-center justify-between" style={{ zIndex: 'var(--z-sticky)' }}>
          <div>
            <h2 className="text-2xl font-bold text-white">Room Assignment</h2>
            <p className="text-slate-300">
              Booking #{booking.booking_id} • {booking.guest_name} • 
              {format(new Date(booking.check_in_date), 'dd/MM/yyyy')} - {format(new Date(booking.check_out_date), 'dd/MM/yyyy')}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Current Assignment */}
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Bed className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Current Assignment</span>
            </div>
            <div className="text-sm text-blue-300">
              Room {booking.room_number} - {booking.room_type} (${booking.room_rate}/night)
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rooms by number or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Available Rooms */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Available Rooms</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-slate-300">Loading rooms...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map(renderRoomCard)}
              </div>
            )}
          </div>

          {renderUpgradeOptions()}
          {renderConflicts()}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-border">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-border dark:border-slate-600 rounded-lg text-slate-300 hover:bg-surface-tertiary"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignRoom}
              disabled={!selectedRoom || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Assign Room</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomAssignmentModal;
