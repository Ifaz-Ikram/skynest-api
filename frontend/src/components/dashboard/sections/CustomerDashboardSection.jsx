import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, DollarSign, Clock, CheckCircle, AlertCircle, Home, FileText } from 'lucide-react';
import api from '../../../utils/api';
import { format } from 'date-fns';

export const CustomerDashboardSection = ({ user, onNavigate }) => {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    upcomingBookings: 0,
    totalSpent: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    loadCustomerData();
  }, [user]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      // Fetch customer's bookings
      const bookingsData = await api.getBookings();
      const allBookings = bookingsData?.bookings || bookingsData || [];
      
      // Filter bookings for this customer
      const customerBookings = allBookings.filter(
        b => b.customer_id === user.customer_id || b.guest_name === user.username
      );

      setMyBookings(customerBookings.slice(0, 10)); // Latest 10

      // Calculate stats
      const active = customerBookings.filter(b => b.status === 'Confirmed' || b.status === 'Checked-In').length;
      const upcoming = customerBookings.filter(b => b.status === 'Confirmed').length;
      const totalSpent = customerBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
      const pending = customerBookings.reduce((sum, b) => {
        const total = parseFloat(b.total_amount) || 0;
        const paid = parseFloat(b.total_paid) || 0;
        return sum + Math.max(0, total - paid);
      }, 0);

      setStats({
        activeBookings: active,
        upcomingBookings: upcoming,
        totalSpent,
        pendingPayments: pending,
      });
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-white">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Home}
          label="Active Bookings"
          value={stats.activeBookings}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Stays"
          value={stats.upcomingBookings}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={`Rs ${stats.totalSpent.toFixed(2)}`}
          color="purple"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Payments"
          value={`Rs ${stats.pendingPayments.toFixed(2)}`}
          color={stats.pendingPayments > 0 ? 'red' : 'green'}
        />
      </div>

      {/* My Bookings List */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">My Bookings</h3>
        
        {myBookings.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">You don't have any bookings yet</p>
            <button
              onClick={() => onNavigate('customer-portal')}
              className="btn-primary"
            >
              Make Your First Reservation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myBookings.map((booking) => (
              <BookingCard key={booking.booking_id} booking={booking} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
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

const BookingCard = ({ booking, onNavigate }) => {
  const statusColors = {
    'Confirmed': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Checked-In': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Checked-Out': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    'Cancelled': 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-semibold">Booking #{booking.booking_id}</h4>
            <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[booking.status] || statusColors.Confirmed}`}>
              {booking.status}
            </span>
          </div>
          <p className="text-sm text-slate-400">Room {booking.room_number}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">Rs {parseFloat(booking.total_amount || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-400">
            Paid: Rs {parseFloat(booking.total_paid || 0).toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4" />
          <span>Check-in: {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4" />
          <span>Check-out: {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}</span>
        </div>
      </div>

      {booking.branch_name && (
        <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
          <MapPin className="w-4 h-4" />
          <span>{booking.branch_name}</span>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onNavigate('customer-portal')}
          className="flex-1 text-sm px-3 py-2 bg-luxury-gold/20 hover:bg-luxury-gold/30 text-luxury-gold rounded-lg border border-luxury-gold/30 transition-colors"
        >
          View Details
        </button>
        {(parseFloat(booking.total_amount) - parseFloat(booking.total_paid || 0)) > 0 && (
          <button
            onClick={() => onNavigate('payments')}
            className="flex-1 text-sm px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 transition-colors"
          >
            Make Payment
          </button>
        )}
      </div>
    </div>
  );
};
