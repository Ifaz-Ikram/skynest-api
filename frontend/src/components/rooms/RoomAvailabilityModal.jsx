import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Bed, Users, DollarSign, AlertTriangle, CheckCircle, Clock, MapPin, Search, Filter } from 'lucide-react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';

export const RoomAvailabilityModal = ({ 
  booking, 
  onClose, 
  onRoomSelect,
  initialCheckIn,
  initialCheckOut 
}) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Date range state
  const [checkInDate, setCheckInDate] = useState(
    initialCheckIn || format(new Date(), 'yyyy-MM-dd')
  );
  const [checkOutDate, setCheckOutDate] = useState(
    initialCheckOut || format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  
  // Filter state
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'
  
  // Selected room state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomTimeline, setShowRoomTimeline] = useState(false);
  const [roomTimeline, setRoomTimeline] = useState(null);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      loadAvailability();
    }
  }, [checkInDate, checkOutDate, selectedRoomType]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        check_in_date: checkInDate,
        check_out_date: checkOutDate
      };
      
      if (selectedRoomType) {
        params.room_type_id = selectedRoomType;
      }
      
      if (booking?.booking_id) {
        params.exclude_booking_id = booking.booking_id;
      }
      
      const data = await api.getRoomAvailability(params);
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
      setError('Failed to load room availability');
    } finally {
      setLoading(false);
    }
  };

  const loadRoomTimeline = async (roomId) => {
    try {
      const startDate = checkInDate;
      const endDate = format(addDays(new Date(checkOutDate), 7), 'yyyy-MM-dd');
      
      const data = await api.getRoomTimeline(roomId, { start_date: startDate, end_date: endDate });
      setRoomTimeline(data);
      setShowRoomTimeline(true);
    } catch (error) {
      console.error('Error loading room timeline:', error);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleConfirmSelection = () => {
    if (selectedRoom) {
      onRoomSelect(selectedRoom);
      onClose();
    }
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-800/30 text-green-200 border-green-700';
      case 'Occupied': return 'bg-red-800/30 text-red-200 border-red-700';
      case 'Reserved': return 'bg-blue-800/30 text-blue-200 border-blue-700';
      case 'Unavailable': return 'bg-slate-800 text-white border-border';
      default: return 'bg-slate-800 text-white border-border';
    }
  };

  const getAvailabilityIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircle className="w-4 h-4" />;
      case 'Occupied': return <AlertTriangle className="w-4 h-4" />;
      case 'Reserved': return <Calendar className="w-4 h-4" />;
      case 'Unavailable': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRooms = () => {
    if (!availability?.raw_rooms) return [];
    
    let rooms = availability.raw_rooms;
    
    if (showOnlyAvailable) {
      rooms = rooms.filter(room => room.availability_status === 'Available');
    }
    
    return rooms;
  };

  const roomTypeFilterOptions = useMemo(() => {
    if (!availability?.rooms_by_type) {
      return [{ id: '', name: 'All Types' }];
    }

    const entries = Object.entries(availability.rooms_by_type).map(([typeName, info]) => ({
      id: String(info?.room_type_id ?? ''),
      name: typeName,
    }));

    return [{ id: '', name: 'All Types' }, ...entries];
  }, [availability]);

  if (showRoomTimeline && roomTimeline) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center" style={{ zIndex: 'var(--z-modal)' }}>
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">
          <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex items-center justify-between" style={{ zIndex: 'var(--z-sticky)' }}>
            <h2 className="text-2xl font-bold text-white">
              Room Timeline - {roomTimeline.room.room_number}
            </h2>
            <button 
              onClick={() => setShowRoomTimeline(false)} 
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
            {/* Room Info */}
            <div className="bg-surface-tertiary rounded-lg p-4 mb-6">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Room:</span> {roomTimeline.room.room_number}
                </div>
                <div>
                  <span className="font-medium">Floor:</span> {roomTimeline.room.floor}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {roomTimeline.room.room_type_name}
                </div>
                <div>
                  <span className="font-medium">Rate:</span> Rs {roomTimeline.room.base_rate}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bookings</h3>
              {roomTimeline.bookings.map((booking, index) => (
                <div key={index} className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{booking.guest_name}</h4>
                      <p className="text-sm text-slate-300">
                        {format(new Date(booking.check_in_date), 'dd/MM/yyyy')} - {format(new Date(booking.check_out_date), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-sm text-slate-300">Rate: Rs {booking.booked_rate}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      booking.status === 'Checked-In' ? 'bg-green-800/30 text-green-200' : 'bg-blue-800/30 text-blue-200'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
              
              <h3 className="text-lg font-semibold">Maintenance Tasks</h3>
              {roomTimeline.maintenance_tasks.map((task, index) => (
                <div key={index} className="bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{task.task_type}</h4>
                      <p className="text-sm text-slate-300">
                        {format(new Date(task.scheduled_date), 'dd/MM/yyyy')}
                      </p>
                      {task.notes && <p className="text-sm text-slate-300">{task.notes}</p>}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'High' ? 'bg-red-800/30 text-red-200' : 
                      task.priority === 'Medium' ? 'bg-yellow-800/30 text-yellow-800' : 'bg-slate-800 text-white'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex items-center justify-between" style={{ zIndex: 'var(--z-sticky)' }}>
          <h2 className="text-2xl font-bold text-white">Room Availability</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-surface-tertiary rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-out Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Room Type</label>
                <SearchableDropdown
                  value={selectedRoomType}
                  onChange={(value) => setSelectedRoomType(value || '')}
                  options={roomTypeFilterOptions}
                  placeholder="All Types"
                  className="w-full"
                  hideSearch={roomTypeFilterOptions.length <= 6}
                  clearable={false}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Available Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          {availability?.summary && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Availability Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{availability.summary.total_rooms}</div>
                  <div className="text-sm text-slate-300">Total Rooms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{availability.summary.available_rooms}</div>
                  <div className="text-sm text-slate-300">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{availability.summary.occupied_rooms}</div>
                  <div className="text-sm text-slate-300">Occupied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-300">{availability.summary.occupancy_rate}%</div>
                  <div className="text-sm text-slate-300">Occupancy Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Room Grid */}
          {!loading && availability && (
            <div className="space-y-6">
              {Object.entries(availability.rooms_by_type).map(([typeName, typeData]) => (
                <div key={typeName} className="border rounded-lg">
                  <div className="bg-surface-tertiary px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{typeName}</h3>
                      <div className="text-sm text-slate-300">
                        Rs {typeData.base_rate}/night • Max {typeData.capacity} guests
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(typeData.floors).map(([floor, rooms]) => (
                        <div key={floor}>
                          <h4 className="font-medium mb-2 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            Floor {floor}
                          </h4>
                          <div className="space-y-2">
                            {rooms
                              .filter(room => !showOnlyAvailable || room.availability_status === 'Available')
                              .map(room => (
                              <div
                                key={room.room_id}
                                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                  selectedRoom?.room_id === room.room_id 
                                    ? 'ring-2 ring-blue-500 bg-blue-900/20' 
                                    : 'hover:bg-slate-900'
                                } ${
                                  room.availability_status === 'Available' 
                                    ? 'hover:ring-1 hover:ring-green-500' 
                                    : 'opacity-60'
                                }`}
                                onClick={() => room.availability_status === 'Available' && handleRoomSelect(room)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">Room {room.room_number}</div>
                                    <div className="text-sm text-slate-300">
                                      Rs {room.base_rate}/night
                                    </div>
                                    {room.conflicting_booking && (
                                      <div className="text-xs text-red-600 mt-1">
                                        Conflicted: {room.conflicting_booking.guest_name}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(room.availability_status)}`}>
                                    {getAvailabilityIcon(room.availability_status)}
                                    {room.availability_status}
                                  </div>
                                </div>
                                
                                {room.availability_status === 'Available' && (
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        loadRoomTimeline(room.room_id);
                                      }}
                                      className="text-xs btn-secondary"
                                    >
                                      Timeline
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Room Summary */}
          {selectedRoom && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Selected Room</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Room:</span> {selectedRoom.room_number}
                </div>
                <div>
                  <span className="font-medium">Floor:</span> {selectedRoom.floor}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedRoom.room_type_name}
                </div>
                <div>
                  <span className="font-medium">Rate:</span> Rs {selectedRoom.base_rate}/night
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedRoom}
              className="btn-primary flex items-center gap-2 disabled:bg-slate-500"
            >
              <Bed className="w-4 h-4" />
              Select Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityModal;
