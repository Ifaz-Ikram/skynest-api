import React, { useState, useEffect } from 'react';
import { Sparkles, Wrench, CheckCircle, XCircle, Home, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

const HousekeepingMiniGrid = ({ onRoomClick }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await api.request('/api/rooms');
      setRooms(response);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Clean':
        return 'bg-green-500 border-green-600';
      case 'Dirty':
        return 'bg-red-500 border-red-600';
      case 'Maintenance':
        return 'bg-orange-500 border-orange-600';
      case 'Available':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-gray-400 border-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Clean':
        return <Sparkles className="w-4 h-4" />;
      case 'Dirty':
        return <XCircle className="w-4 h-4" />;
      case 'Maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'Available':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    if (onRoomClick) {
      onRoomClick(room);
    }
  };

  const getStatusCounts = () => {
    return {
      clean: rooms.filter(r => r.housekeeping_status === 'Clean').length,
      dirty: rooms.filter(r => r.housekeeping_status === 'Dirty').length,
      maintenance: rooms.filter(r => r.housekeeping_status === 'Maintenance').length,
      available: rooms.filter(r => r.availability_status === 'Available').length,
    };
  };

  const filteredRooms = statusFilter === 'all' 
    ? rooms.slice(0, 9) // Show first 9 rooms
    : rooms.filter(r => 
        statusFilter === 'available' 
          ? r.availability_status === 'Available'
          : r.housekeeping_status === statusFilter
      ).slice(0, 9);

  const counts = getStatusCounts();

  return (
    <div className="bg-surface-secondary rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-luxury-gold" />
          Housekeeping Status
        </h3>
        <button
          onClick={loadRooms}
          disabled={loading}
          className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-luxury-navy text-white'
              : 'bg-surface-tertiary text-text-secondary hover:bg-gray-200'
          }`}
        >
          All ({rooms.length})
        </button>
        <button
          onClick={() => setStatusFilter('Clean')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'Clean'
              ? 'bg-green-500 text-white'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
          }`}
        >
          Clean ({counts.clean})
        </button>
        <button
          onClick={() => setStatusFilter('Dirty')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'Dirty'
              ? 'bg-red-500 text-white'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200'
          }`}
        >
          Dirty ({counts.dirty})
        </button>
        <button
          onClick={() => setStatusFilter('Maintenance')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'Maintenance'
              ? 'bg-orange-500 text-white'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200'
          }`}
        >
          Maintenance ({counts.maintenance})
        </button>
        <button
          onClick={() => setStatusFilter('available')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'available'
              ? 'bg-blue-500 text-white'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200'
          }`}
        >
          Available ({counts.available})
        </button>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {filteredRooms.map((room) => (
          <button
            key={room.room_id}
            onClick={() => handleRoomClick(room)}
            className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg ${
              getStatusColor(room.housekeeping_status || room.availability_status)
            } ${
              selectedRoom?.room_id === room.room_id
                ? 'ring-4 ring-luxury-gold'
                : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full text-white p-2">
              {getStatusIcon(room.housekeeping_status || room.availability_status)}
              <span className="font-bold text-lg mt-1">{room.room_number}</span>
              <span className="text-xs opacity-90">{room.room_type}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Room Details */}
      {selectedRoom && (
        <div className="mt-4 p-4 bg-surface-tertiary rounded-lg border border-border">
          <h4 className="font-semibold text-text-primary mb-2">
            Room {selectedRoom.room_number}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-text-secondary">Type:</span>
              <span className="ml-2 font-medium">{selectedRoom.room_type}</span>
            </div>
            <div>
              <span className="text-text-secondary">Floor:</span>
              <span className="ml-2 font-medium">{selectedRoom.floor_number}</span>
            </div>
            <div>
              <span className="text-text-secondary">Status:</span>
              <span className="ml-2 font-medium">{selectedRoom.housekeeping_status}</span>
            </div>
            <div>
              <span className="text-text-secondary">Available:</span>
              <span className="ml-2 font-medium">{selectedRoom.availability_status}</span>
            </div>
            <div className="col-span-2">
              <span className="text-text-secondary">Rate:</span>
              <span className="ml-2 font-medium">Rs {selectedRoom.base_rate?.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedRoom(null)}
            className="mt-3 w-full px-4 py-2 bg-luxury-navy text-white rounded-lg hover:bg-indigo-900 transition-colors text-sm"
          >
            Close Details
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-text-tertiary mb-2">Status Legend:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-text-secondary">Clean</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-text-secondary">Dirty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-text-secondary">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-text-secondary">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousekeepingMiniGrid;
