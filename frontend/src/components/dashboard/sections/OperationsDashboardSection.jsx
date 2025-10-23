import React, { useState, useEffect } from 'react';
import { Calendar, LogIn, LogOut, Home, Bed, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../utils/api';
import { format } from 'date-fns';

export const OperationsDashboardSection = ({ user, filterByBranch = false }) => {
  const [operationsData, setOperationsData] = useState({
    arrivals: [],
    departures: [],
    inHouse: [],
    pendingCheckIns: 0,
    availableRooms: 0,
    totalRooms: 0,
    roomStatus: {
      available: 0,
      occupied: 0,
      maintenance: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOperationsData();
  }, [user, filterByBranch]);

  const loadOperationsData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's operations data from actual backend endpoints
      const [arrivalsData, departuresData, inHouseData, roomsData, bookingsData] = await Promise.all([
        api.getArrivalsToday(),
        api.getDeparturesToday(),
        api.getInHouse(),
        api.getAllRooms(),
        api.getBookings(),
      ]);

      // Extract arrays from response (handle both array and object formats)
      const arrivals = Array.isArray(arrivalsData) ? arrivalsData : arrivalsData?.arrivals || [];
      const departures = Array.isArray(departuresData) ? departuresData : departuresData?.departures || [];
      const inHouse = Array.isArray(inHouseData) ? inHouseData : inHouseData?.inHouse || [];
      const allRooms = roomsData?.rooms || roomsData || [];
      const allBookings = bookingsData?.bookings || bookingsData || [];

      // Filter by branch if needed (for Manager/Receptionist)
      const filteredArrivals = filterByBranch && user.branch_id
        ? arrivals.filter(a => a.branch_id === user.branch_id)
        : arrivals;

      const filteredDepartures = filterByBranch && user.branch_id
        ? departures.filter(d => d.branch_id === user.branch_id)
        : departures;

      const filteredInHouse = filterByBranch && user.branch_id
        ? inHouse.filter(ih => ih.branch_id === user.branch_id)
        : inHouse;

      const filteredRooms = filterByBranch && user.branch_id
        ? allRooms.filter(r => r.branch_id === user.branch_id)
        : allRooms;

      // Calculate pending check-ins (Booked status with today or future check-in date)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let pendingCheckIns = allBookings.filter(b => {
        if (b.status !== 'Booked') return false;
        if (!b.check_in_date) return false;
        
        const checkInDate = new Date(b.check_in_date);
        checkInDate.setHours(0, 0, 0, 0);
        
        // Filter by branch if needed
        if (filterByBranch && user.branch_id && b.branch_id !== user.branch_id) {
          return false;
        }
        
        return checkInDate >= today;
      }).length;

      // Calculate room status based on actual room.status from database
      const roomStatus = filteredRooms.reduce((acc, room) => {
        const status = (room.status || 'Available').toLowerCase();
        if (status === 'available') acc.available++;
        else if (status === 'occupied') acc.occupied++;
        else if (status === 'maintenance') acc.maintenance++;
        return acc;
      }, { available: 0, occupied: 0, maintenance: 0 });

      setOperationsData({
        arrivals: filteredArrivals.slice(0, 10), // Latest 10
        departures: filteredDepartures.slice(0, 10),
        inHouse: filteredInHouse.slice(0, 10),
        pendingCheckIns,
        availableRooms: roomStatus.available,
        totalRooms: filteredRooms.length,
        roomStatus,
      });
    } catch (error) {
      console.error('Failed to load operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-white">Loading operations data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operations Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OpsStatCard
          icon={LogIn}
          label="Arrivals Today"
          value={operationsData.arrivals.length}
          color="green"
        />
        <OpsStatCard
          icon={LogOut}
          label="Departures Today"
          value={operationsData.departures.length}
          color="orange"
        />
        <OpsStatCard
          icon={Home}
          label="In-House Guests"
          value={operationsData.inHouse.length}
          color="blue"
        />
        <OpsStatCard
          icon={Bed}
          label="Available Rooms"
          value={`${operationsData.availableRooms}/${operationsData.totalRooms}`}
          color="purple"
        />
      </div>

      {/* Room Status Overview */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Room Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RoomStatusCard
            label="Available"
            count={operationsData.roomStatus.available}
            total={operationsData.totalRooms}
            color="green"
          />
          <RoomStatusCard
            label="Occupied"
            count={operationsData.roomStatus.occupied}
            total={operationsData.totalRooms}
            color="blue"
          />
          <RoomStatusCard
            label="Maintenance"
            count={operationsData.roomStatus.maintenance}
            total={operationsData.totalRooms}
            color="red"
          />
        </div>
      </div>

      {/* Today's Arrivals */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <LogIn className="w-5 h-5 text-green-400" />
          <h3 className="text-xl font-bold text-white">Today's Arrivals</h3>
          <span className="text-sm text-slate-400">({operationsData.arrivals.length})</span>
        </div>
        
        {operationsData.arrivals.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No arrivals scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {operationsData.arrivals.map((arrival, index) => (
              <OperationCard
                key={index}
                guestName={arrival.guest || arrival.guest_name}
                roomNumber={arrival.room_number}
                branchName={arrival.branch_name}
                icon={LogIn}
                color="green"
              />
            ))}
          </div>
        )}
      </div>

      {/* Today's Departures */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5 text-orange-400" />
          <h3 className="text-xl font-bold text-white">Today's Departures</h3>
          <span className="text-sm text-slate-400">({operationsData.departures.length})</span>
        </div>
        
        {operationsData.departures.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No departures scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {operationsData.departures.map((departure, index) => (
              <OperationCard
                key={index}
                guestName={departure.guest || departure.guest_name}
                roomNumber={departure.room_number}
                branchName={departure.branch_name}
                icon={LogOut}
                color="orange"
              />
            ))}
          </div>
        )}
      </div>

      {/* In-House Guests */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-white">In-House Guests</h3>
          <span className="text-sm text-slate-400">({operationsData.inHouse.length})</span>
        </div>
        
        {operationsData.inHouse.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No guests currently in-house</p>
          </div>
        ) : (
          <div className="space-y-2">
            {operationsData.inHouse.map((guest, index) => (
              <OperationCard
                key={index}
                guestName={guest.guest || guest.guest_name}
                roomNumber={guest.room_number}
                branchName={guest.branch_name}
                icon={Home}
                color="blue"
              />
            ))}
          </div>
        )}
      </div>

      {/* Pending Check-Ins Alert */}
      {operationsData.pendingCheckIns > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-200 font-semibold mb-1">Pending Check-Ins</h3>
            <p className="text-yellow-300 text-sm">
              {operationsData.pendingCheckIns} booking{operationsData.pendingCheckIns > 1 ? 's' : ''} waiting to be checked in
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const OpsStatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-xl p-4 border`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
};

const RoomStatusCard = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  const colorClasses = {
    green: 'bg-green-500/20 border-green-500/30 text-green-300',
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    red: 'bg-red-500/20 border-red-500/30 text-red-300',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="text-sm mb-2">{label}</div>
      <div className="text-3xl font-bold mb-2">{count}</div>
      <div className="text-xs opacity-75">{percentage}% of total</div>
    </div>
  );
};

const OperationCard = ({ guestName, roomNumber, branchName, icon: Icon, color }) => {
  const colorClasses = {
    green: 'border-green-500/30 hover:border-green-500/50',
    orange: 'border-orange-500/30 hover:border-orange-500/50',
    blue: 'border-blue-500/30 hover:border-blue-500/50',
  };

  return (
    <div className={`bg-slate-900/40 rounded-lg p-3 border ${colorClasses[color]} transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${color === 'green' ? 'text-green-400' : color === 'orange' ? 'text-orange-400' : 'text-blue-400'}`} />
          <div>
            <p className="text-white font-medium">{guestName || 'Guest'}</p>
            <p className="text-sm text-slate-400">Room {roomNumber || 'N/A'}</p>
          </div>
        </div>
        {branchName && (
          <span className="text-xs text-slate-500">{branchName}</span>
        )}
      </div>
    </div>
  );
};
