import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import StatsCard from '../common/StatsCard';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    revenue: 0,
    occupancyRate: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const bookings = await api.getBookings();
      const activeBookings = bookings.filter(b => b.status === 'Checked-In' || b.status === 'Booked');
      
      setStats({
        totalBookings: bookings.length,
        activeBookings: activeBookings.length,
        revenue: bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0),
        occupancyRate: 67, // Calculate from room data
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Booked': 'bg-blue-100 text-blue-700',
      'Checked-In': 'bg-green-100 text-green-700',
      'Checked-Out': 'bg-gray-100 text-gray-700',
      'Cancelled': 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card h-32 skeleton"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="luxury-gradient rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-display font-bold mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-blue-100">Here's what's happening with your hotel today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          trend="+12% from last month"
          color="blue"
        />
        <StatsCard
          title="Active Bookings"
          value={stats.activeBookings}
          icon={CheckCircle}
          trend={`${stats.activeBookings} rooms occupied`}
          color="green"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          trend="+8% from last month"
          color="gold"
        />
        <StatsCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          icon={TrendingUp}
          trend="+5% from yesterday"
          color="purple"
        />
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
          <button className="text-luxury-gold hover:text-luxury-darkGold font-medium text-sm">
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Guest</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Room</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check In</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check Out</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.booking_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{booking.guest_name || 'Guest'}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{booking.room_number || 'N/A'}</td>
                  <td className="py-4 px-4 text-gray-600">
                    {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900">
                    ${parseFloat(booking.total_amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
