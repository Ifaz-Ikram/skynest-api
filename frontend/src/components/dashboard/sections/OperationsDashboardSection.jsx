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
        <div style={{ color: '#1a237e' }} className="font-semibold">Loading operations data...</div>
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
      <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: '#1a237e' }}>Room Status</h3>
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
      <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        <div className="flex items-center gap-2 mb-4">
          <LogIn className="w-5 h-5" style={{ color: '#198754' }} />
          <h3 className="text-xl font-bold" style={{ color: '#1a237e' }}>Today's Arrivals</h3>
          <span className="text-sm" style={{ color: '#6c757d' }}>({operationsData.arrivals.length})</span>
        </div>
        
        {operationsData.arrivals.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#adb5bd' }} />
            <p style={{ color: '#6c757d' }}>No arrivals scheduled for today</p>
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
      <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5" style={{ color: '#fd7e14' }} />
          <h3 className="text-xl font-bold" style={{ color: '#1a237e' }}>Today's Departures</h3>
          <span className="text-sm" style={{ color: '#6c757d' }}>({operationsData.departures.length})</span>
        </div>
        
        {operationsData.departures.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#adb5bd' }} />
            <p style={{ color: '#6c757d' }}>No departures scheduled for today</p>
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
      <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5" style={{ color: '#0d6efd' }} />
          <h3 className="text-xl font-bold" style={{ color: '#1a237e' }}>In-House Guests</h3>
          <span className="text-sm" style={{ color: '#6c757d' }}>({operationsData.inHouse.length})</span>
        </div>
        
        {operationsData.inHouse.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: '#adb5bd' }} />
            <p style={{ color: '#6c757d' }}>No guests currently in-house</p>
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
        <div className="rounded-lg p-4 flex items-start gap-3 shadow-md" style={{ backgroundColor: '#fff3cd', border: '2px solid #ffc107' }}>
          <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#856404' }} />
          <div>
            <h3 className="font-bold mb-1" style={{ color: '#856404' }}>Pending Check-Ins</h3>
            <p className="text-sm" style={{ color: '#664d03' }}>
              {operationsData.pendingCheckIns} booking{operationsData.pendingCheckIns > 1 ? 's' : ''} waiting to be checked in
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const OpsStatCard = ({ icon: Icon, label, value, color }) => {
  const colorStyles = {
    green: { bg: 'linear-gradient(135deg, #d1e7dd 0%, #badbcc 100%)', border: '#198754', icon: '#198754', text: '#0a5029' },
    orange: { bg: 'linear-gradient(135deg, #ffe5d0 0%, #fed9bb 100%)', border: '#fd7e14', icon: '#fd7e14', text: '#8b4513' },
    blue: { bg: 'linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%)', border: '#0d6efd', icon: '#0d6efd', text: '#084298' },
    purple: { bg: 'linear-gradient(135deg, #e0cffc 0%, #d4bbfc 100%)', border: '#6f42c1', icon: '#6f42c1', text: '#4a1d8f' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="rounded-xl p-4 border-2 shadow-md" style={{ background: style.bg, borderColor: style.border }}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" style={{ color: style.icon }} />
        <span className="text-sm font-semibold" style={{ color: style.text }}>{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: style.text }}>{value}</div>
    </div>
  );
};

const RoomStatusCard = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  const colorStyles = {
    green: { bg: '#d4edda', border: '#198754', text: '#0a5029' },
    blue: { bg: '#cfe2ff', border: '#0d6efd', text: '#084298' },
    red: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="rounded-lg p-4 border-2" style={{ backgroundColor: style.bg, borderColor: style.border }}>
      <div className="text-sm font-semibold mb-2" style={{ color: style.text }}>{label}</div>
      <div className="text-3xl font-bold mb-2" style={{ color: style.text }}>{count}</div>
      <div className="text-xs" style={{ color: style.text, opacity: 0.75 }}>{percentage}% of total</div>
    </div>
  );
};

const OperationCard = ({ guestName, roomNumber, branchName, icon: Icon, color }) => {
  const colorStyles = {
    green: { bg: '#f1f9f3', border: '#c3e6cb', icon: '#198754' },
    orange: { bg: '#fff5ed', border: '#fed9bb', icon: '#fd7e14' },
    blue: { bg: '#f0f7ff', border: '#b6d4fe', icon: '#0d6efd' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="rounded-lg p-3 border-2 transition-all hover:shadow-md" style={{ backgroundColor: style.bg, borderColor: style.border }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4" style={{ color: style.icon }} />
          <div>
            <p className="font-semibold" style={{ color: '#212529' }}>{guestName || 'Guest'}</p>
            <p className="text-sm" style={{ color: '#6c757d' }}>Room {roomNumber || 'N/A'}</p>
          </div>
        </div>
        {branchName && (
          <span className="text-xs font-medium" style={{ color: '#6c757d' }}>{branchName}</span>
        )}
      </div>
    </div>
  );
};
