import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CheckCircle, TrendingUp, Users, Bed, CreditCard, AlertCircle, Home, LogOut, Star, ShoppingBag, Clock, RefreshCw } from 'lucide-react';
import { format, subDays, isAfter, isBefore, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns';
import api from '../../utils/api';
import {
  LuxuryPageHeader,
  LoadingSpinner,
  Sparkline,
  TrendIndicator,
  MiniGauge,
  LineChart,
  DonutChart,
  SearchableDropdown,
} from '../common';

const Dashboard = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    revenue: 0,
    occupancyRate: 0,
    pendingCheckIns: 0,
    totalGuests: 0,
    totalRooms: 0,
    availableRooms: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [inHouse, setInHouse] = useState([]);
  const [showQuote, setShowQuote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastMonthStats, setLastMonthStats] = useState({ bookings: 0, revenue: 0 });
  const [sparklineData, setSparklineData] = useState({
    bookings: [],
    revenue: [],
    occupancy: []
  });
  const [alerts, setAlerts] = useState([]);
  const [todaysRevenue, setTodaysRevenue] = useState(0);
  const [todaysCheckIns, setTodaysCheckIns] = useState(0);
  const [todaysPayments, setTodaysPayments] = useState(0);
  const [topRoomTypes, setTopRoomTypes] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [paymentStats, setPaymentStats] = useState({ collected: 0, pending: 0, overdue: 0 });
  const [roomStatusData, setRoomStatusData] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes to keep data current
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Add refresh functionality
  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      console.log('Starting dashboard data load...');
      
      // Fetch all necessary data including operational reports with branch info
      // Use Promise.allSettled to handle partial failures gracefully
      const [bookingsResult, roomsResult, guestsResult, paymentsResult, arrivalsResult, departuresResult, inHouseResult] = await Promise.allSettled([
        api.getBookings(),
        api.getRooms(), // Get available rooms (status = 'Available')
        api.getGuests(),
        api.getPayments().catch(err => { console.warn('Payments API failed:', err.message); return []; }),
        api.request('/api/reports/arrivals-today').catch(err => { console.warn('Arrivals API failed:', err.message); return []; }),
        api.request('/api/reports/departures-today').catch(err => { console.warn('Departures API failed:', err.message); return []; }),
        api.request('/api/reports/in-house').catch(err => { console.warn('In-house API failed:', err.message); return []; }),
      ]);

      // Extract data from settled promises
      const bookingsData = bookingsResult.status === 'fulfilled' ? bookingsResult.value : null;
      const roomsData = roomsResult.status === 'fulfilled' ? roomsResult.value : null;
      const guestsData = guestsResult.status === 'fulfilled' ? guestsResult.value : null;
      const paymentsData = paymentsResult.status === 'fulfilled' ? paymentsResult.value : [];
      const arrivalsData = arrivalsResult.status === 'fulfilled' ? arrivalsResult.value : [];
      const departuresData = departuresResult.status === 'fulfilled' ? departuresResult.value : [];
      const inHouseData = inHouseResult.status === 'fulfilled' ? inHouseResult.value : [];

      console.log('API responses received:', {
        bookingsData: bookingsData?.length || bookingsData?.bookings?.length || 0,
        roomsData: roomsData?.length || roomsData?.rooms?.length || 0,
        guestsData: guestsData?.length || guestsData?.guests?.length || 0,
        paymentsData: paymentsData?.length || 0,
        arrivalsData: arrivalsData?.length || 0,
        departuresData: departuresData?.length || 0,
        inHouseData: inHouseData?.length || 0,
        failedAPIs: [
          bookingsResult.status === 'rejected' ? 'bookings' : null,
          roomsResult.status === 'rejected' ? 'rooms' : null,
          guestsResult.status === 'rejected' ? 'guests' : null,
          paymentsResult.status === 'rejected' ? 'payments' : null,
          arrivalsResult.status === 'rejected' ? 'arrivals' : null,
          departuresResult.status === 'rejected' ? 'departures' : null,
          inHouseResult.status === 'rejected' ? 'in-house' : null,
        ].filter(Boolean)
      });

      let bookingsList = bookingsData?.bookings || bookingsData || [];
      const roomsList = roomsData?.rooms || roomsData || [];
      const guestsList = guestsData?.guests || guestsData || [];
      const paymentsList = paymentsData || [];

      // Calculate active bookings (Booked or Checked-In) - for general reference
      const activeBookings = bookingsList.filter(b => 
        b.status === 'Booked' || b.status === 'Checked-In'
      );

      // Calculate pending check-ins (Booked bookings with check-in date today or in the future)
      const today = startOfDay(new Date());
      const pendingCheckIns = bookingsList.filter(b => {
        // Include only "Booked" status (not yet checked in)
        if (b.status !== 'Booked') return false;
        if (!b.check_in_date) return false;
        
        const checkInDate = startOfDay(new Date(b.check_in_date));
        // Check if check-in date is today or in the future
        return checkInDate >= today;
      });

      // Use dedicated API endpoints for operational data with branch information
      const arrivals = arrivalsData || [];
      const departures = departuresData || [];
      const inHouse = inHouseData || [];

      // Calculate total revenue from all bookings
      const totalRevenue = bookingsList.reduce((sum, b) => 
        sum + parseFloat(b.total_amount || 0), 0
      );

      // Calculate last month's data for comparison
      const thirtyDaysAgo = subDays(new Date(), 30);
      const lastMonthBookings = bookingsList.filter(b => 
        isBefore(new Date(b.created_at || b.check_in_date), thirtyDaysAgo)
      );
      const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => 
        sum + parseFloat(b.total_amount || 0), 0
      );

      // Calculate occupancy rate - count all active bookings (Booked + Checked-In)
      // Get unique occupied/booked room IDs (filter out duplicates and null/undefined values)
      const occupiedRoomIds = [...new Set(
        bookingsList
          .filter(b => (b.status === 'Booked' || b.status === 'Checked-In') && b.room_id)
          .map(b => b.room_id)
      )];
      const actuallyOccupiedRooms = occupiedRoomIds.length;
      const totalRooms = roomsList.length || 1; // Avoid division by zero
      const occupancyRate = ((actuallyOccupiedRooms / totalRooms) * 100).toFixed(0);

      // Calculate available rooms (exclude all active bookings)
      const availableRooms = roomsList.filter(r => !occupiedRoomIds.includes(r.room_id)).length;

      console.log('Occupancy Calculation Details:', {
        activeBookingsBreakdown: {
          booked: bookingsList.filter(b => b.status === 'Booked').length,
          checkedIn: bookingsList.filter(b => b.status === 'Checked-In').length,
          total: activeBookings.length
        },
        roomData: {
          totalRooms: roomsList.length,
          roomIds: roomsList.map(r => r.room_id),
          roomNumbers: roomsList.map(r => r.room_number)
        },
        occupancyCalculation: {
          actuallyOccupiedRooms: actuallyOccupiedRooms,
          totalRooms: totalRooms,
          occupancyRate: occupancyRate,
          formula: `${actuallyOccupiedRooms} / ${totalRooms} * 100 = ${occupancyRate}%`
        },
        occupiedRoomIds: occupiedRoomIds,
      });

      console.log('Dashboard Stats Debug:', {
        totalBookings: bookingsList.length,
        bookedBookings: bookingsList.filter(b => b.status === 'Booked').length,
        checkedInBookings: bookingsList.filter(b => b.status === 'Checked-In').length,
        activeBookings: activeBookings.length,
        totalRooms: totalRooms,
        occupiedRooms: actuallyOccupiedRooms,
        occupancyRate: occupancyRate,
        pendingCheckIns: pendingCheckIns.length,
        roomsListLength: roomsList.length,
        roomsListSample: roomsList.slice(0, 3),
        bookingsListSample: bookingsList.slice(0, 3).map(b => ({
          id: b.booking_id,
          status: b.status,
          room_id: b.room_id,
          guest: b.guest_name
        })),
        pendingCheckInsDetails: pendingCheckIns.map(b => ({
          id: b.booking_id,
          status: b.status,
          checkIn: b.check_in_date,
          guest: b.guest_name
        }))
      });

      console.log('💡 OCCUPANCY FIX - Setting stats:', {
        actuallyOccupiedRooms,
        occupiedRoomIds,
        totalRooms,
        occupancyRate,
        calculation: `${actuallyOccupiedRooms} / ${totalRooms} = ${occupancyRate}%`
      });

      setStats({
        totalBookings: bookingsList.length,
        activeBookings: actuallyOccupiedRooms, // Use actually occupied rooms (Checked-In only)
        revenue: totalRevenue,
        occupancyRate: parseInt(occupancyRate),
        pendingCheckIns: pendingCheckIns.length,
        totalGuests: guestsList.length,
        totalRooms: totalRooms,
        availableRooms: availableRooms,
      });

      setLastMonthStats({
        bookings: lastMonthBookings.length,
        revenue: lastMonthRevenue,
      });

      // Sort bookings by most recent first
      const sortedBookings = bookingsList.sort((a, b) => 
        new Date(b.check_in_date) - new Date(a.check_in_date)
      );
      setRecentBookings(sortedBookings.slice(0, 5));
      
      // Map API response data to expected format
      setArrivals(arrivals.slice(0, 5).map(item => ({
        booking_id: item.booking_id,
        guest_name: item.guest,
        room_number: item.room_number,
        branch_name: item.branch_name
      })));
      setDepartures(departures.slice(0, 5).map(item => ({
        booking_id: item.booking_id,
        guest_name: item.guest,
        room_number: item.room_number,
        branch_name: item.branch_name
      })));
      setInHouse(inHouse.slice(0, 5).map(item => ({
        booking_id: item.booking_id,
        guest_name: item.guest,
        room_number: item.room_number,
        branch_name: item.branch_name
      })));

      // Generate sparkline data for last 7 days
      generateSparklineData(bookingsList, paymentsList);

      // Generate alerts
      generateAlerts(bookingsList, paymentsList, occupancyRate);

      // Load enhanced dashboard data
      await loadEnhancedData(bookingsList, paymentsList);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Set default values to prevent empty dashboard
      setStats({
        totalBookings: 0,
        activeBookings: 0,
        revenue: 0,
        occupancyRate: 0,
        pendingCheckIns: 0,
        totalGuests: 0,
        totalRooms: 0,
        availableRooms: 0,
      });
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  const generateAlerts = (bookingsList, paymentsList, occupancyRate) => {
    const alertsList = [];

    // Ensure paymentsList is an array
    const paymentsArray = Array.isArray(paymentsList) ? paymentsList : [];

    // Calculate outstanding payments
    const outstandingAmount = bookingsList.reduce((sum, b) => {
      const totalAmount = parseFloat(b.total_amount || 0);
      const paidAmount = paymentsArray
        .filter(p => p.booking_id === b.booking_id)
        .reduce((pSum, p) => pSum + parseFloat(p.amount || 0), 0);
      const balance = totalAmount - paidAmount;
      return sum + (balance > 0 ? balance : 0);
    }, 0);

    // Alert: High outstanding payments
    if (outstandingAmount > 50000) {
      alertsList.push({
        type: 'warning',
        icon: CreditCard,
        title: 'High Outstanding Payments',
        message: `Rs ${outstandingAmount.toLocaleString()} pending collection`,
        color: 'red',
      });
    }

    // Alert: Low occupancy
    if (occupancyRate < 40) {
      alertsList.push({
        type: 'warning',
        icon: Bed,
        title: 'Low Occupancy Alert',
        message: `Only ${occupancyRate}% occupancy - consider promotions`,
        color: 'yellow',
      });
    }

    // Alert: High occupancy (success)
    if (occupancyRate > 85) {
      alertsList.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Excellent Occupancy',
        message: `${occupancyRate}% occupancy - peak performance!`,
        color: 'green',
      });
    }

    setAlerts(alertsList);
  };

  const loadEnhancedData = async (bookingsList, paymentsList) => {
    try {
      const today = startOfDay(new Date());

      // Ensure paymentsList is always an array
      const paymentsArray = Array.isArray(paymentsList) ? paymentsList : [];

      // Calculate today's revenue from check-ins
      const todaysCheckIns = bookingsList.filter(b => {
        if (!b.check_in_date) return false;
        const checkInDate = startOfDay(new Date(b.check_in_date));
        return checkInDate.getTime() === today.getTime() && b.status === 'Checked-In';
      });

      const todaysRev = todaysCheckIns.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
      setTodaysRevenue(todaysRev);
      setTodaysCheckIns(todaysCheckIns.length);

      // Today's payments count
      const todaysPaymentsData = paymentsArray.filter(p => {
        if (!p.payment_date) return false;
        const paymentDate = startOfDay(new Date(p.payment_date));
        return paymentDate.getTime() === today.getTime();
      });
      setTodaysPayments(todaysPaymentsData.length);

      // Payment stats - Today's collected payments only
      const todaysCollected = todaysPaymentsData.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      // Calculate pending only for active bookings (Booked, Checked-In)
      const activeBookingsForPayment = bookingsList.filter(b => 
        b.status === 'Booked' || b.status === 'Checked-In'
      );
      
      console.log('Active bookings for payment:', activeBookingsForPayment.length);
      console.log('Active bookings:', activeBookingsForPayment.map(b => ({
        id: b.booking_id,
        status: b.status,
        total: b.total_amount,
        guest: b.guest_name
      })));
      
      const totalBilled = activeBookingsForPayment.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
      console.log('Total billed for active bookings:', totalBilled);
      
      // Sum payments only for active bookings
      const paidForActiveBookings = activeBookingsForPayment.reduce((sum, b) => {
        const bookingPayments = paymentsArray
          .filter(p => p.booking_id === b.booking_id)
          .reduce((pSum, p) => pSum + parseFloat(p.amount || 0), 0);
        console.log(`Booking ${b.booking_id} - Billed: ${b.total_amount}, Paid: ${bookingPayments}`);
        return sum + bookingPayments;
      }, 0);
      
      console.log('Total paid for active bookings:', paidForActiveBookings);
      const pending = totalBilled - paidForActiveBookings;
      console.log('Pending amount:', pending);
      
      setPaymentStats({
        collected: todaysCollected, // Only today's payments
        pending: pending > 0 ? pending : 0,
        overdue: 0, // Removed: No due_date field in database to calculate real overdue
      });

      // Room status data for donut chart
      const roomsList = await api.getRooms();
      const rooms = roomsList?.rooms || roomsList || [];
      const bookedRoomIds = bookingsList
        .filter(b => b.status === 'Checked-In' || b.status === 'Booked')
        .map(b => b.room_id);
      
      // Group rooms by actual status from database
      const roomsByStatus = rooms.reduce((acc, room) => {
        const status = room.status || 'Available';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      setRoomStatusData([
        { label: 'Occupied', value: roomsByStatus['Occupied'] || 0, color: '#10B981' },
        { label: 'Available', value: roomsByStatus['Available'] || 0, color: '#3B82F6' },
        { label: 'Maintenance', value: roomsByStatus['Maintenance'] || 0, color: '#EF4444' },
      ]);

      // Calendar data (this month's occupancy)
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      const calData = daysInMonth.map(day => {
        const activeOnDate = bookingsList.filter(b => {
          const checkIn = startOfDay(new Date(b.check_in_date));
          const checkOut = startOfDay(new Date(b.check_out_date));
          return day >= checkIn && day < checkOut && (b.status === 'Checked-In' || b.status === 'Confirmed');
        }).length;
        
        const occupancy = rooms.length > 0 ? Math.round((activeOnDate / rooms.length) * 100) : 0;
        
        return {
          date: day,
          day: getDate(day),
          occupancy,
        };
      });
      setCalendarData(calData);

      // Load top room types (from API if available)
      try {
        const startDate = startOfMonth(new Date()).toISOString().split('T')[0];
        const endDate = endOfMonth(new Date()).toISOString().split('T')[0];
        const revenueAnalysis = await api.request(`/api/reports/dashboard/revenue-analysis?breakdown_by=room_type&start_date=${startDate}&end_date=${endDate}`);
        if (revenueAnalysis?.data) {
          setTopRoomTypes(revenueAnalysis.data.slice(0, 5));
        }
      } catch (e) {
        // Fallback: Calculate from bookings
        const roomTypeRevenue = {};
        bookingsList.forEach(b => {
          const type = b.room_type_name || 'Unknown';
          if (!roomTypeRevenue[type]) {
            roomTypeRevenue[type] = { room_type_name: type, revenue: 0, bookings: 0, occupancy: 0 };
          }
          roomTypeRevenue[type].revenue += parseFloat(b.total_amount || 0);
          roomTypeRevenue[type].bookings += 1;
        });
        
        const sorted = Object.values(roomTypeRevenue)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        setTopRoomTypes(sorted);
      }

      // Load top services
      try {
        const serviceData = await api.request('/api/reports/service-usage-detail');
        if (serviceData?.data) {
          const serviceRevenue = {};
          serviceData.data.forEach(s => {
            const name = s.service_name || 'Unknown';
            if (!serviceRevenue[name]) {
              serviceRevenue[name] = { service_name: name, total_revenue: 0, total_qty: 0 };
            }
            serviceRevenue[name].total_revenue += parseFloat(s.total_charge || 0);
            serviceRevenue[name].total_qty += parseInt(s.quantity || 0);
          });
          
          const sorted = Object.values(serviceRevenue)
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5);
          setTopServices(sorted);
        }
      } catch (e) {
        console.log('Service data not available');
      }

      // Recent activity (last 10 bookings/payments)
      const recentBookings = bookingsList
        .filter(b => b.status === 'Checked-In' || b.status === 'Booked')
        .sort((a, b) => new Date(b.created_at || b.check_in_date) - new Date(a.created_at || a.check_in_date))
        .slice(0, 5)
        .map(b => ({
          type: b.status === 'Checked-In' ? 'checkin' : 'booking',
          text: b.status === 'Checked-In' 
            ? `Room ${b.room_number} checked in` 
            : `New booking: ${b.room_type_name || 'Room'}`,
          time: formatTimeAgo(new Date(b.created_at || b.check_in_date)),
        }));
      
      const recentPaymentsActivity = paymentsArray
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 3)
        .map(p => ({
          type: 'payment',
          text: `Payment received: Rs ${parseFloat(p.amount || 0).toLocaleString()}`,
          time: formatTimeAgo(new Date(p.payment_date)),
        }));
      
      setRecentActivity([...recentBookings, ...recentPaymentsActivity].slice(0, 5));

    } catch (error) {
      console.error('Failed to load enhanced dashboard data:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const generateSparklineData = (bookingsList, paymentsList) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return startOfDay(date);
    });

    const bookingsPerDay = last7Days.map(date => {
      return bookingsList.filter(b => {
        const bookingDate = startOfDay(new Date(b.created_at || b.check_in_date));
        return bookingDate.getTime() === date.getTime();
      }).length;
    });

    const revenuePerDay = last7Days.map(date => {
      return bookingsList
        .filter(b => {
          const bookingDate = startOfDay(new Date(b.created_at || b.check_in_date));
          return bookingDate.getTime() === date.getTime();
        })
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    });

    const occupancyPerDay = last7Days.map(date => {
      const activeOnDate = bookingsList.filter(b => {
        const checkIn = startOfDay(new Date(b.check_in_date));
        const checkOut = startOfDay(new Date(b.check_out_date));
        return date >= checkIn && date < checkOut && (b.status === 'Checked-In' || b.status === 'Confirmed');
      }).length;
      return activeOnDate;
    });

    setSparklineData({
      bookings: bookingsPerDay,
      revenue: revenuePerDay,
      occupancy: occupancyPerDay
    });
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous * 100).toFixed(1);
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Booked': 'bg-blue-800/30 text-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
      'Checked-In': 'bg-green-800/30 text-green-200 dark:bg-green-900/30 dark:text-green-300',
      'Checked-Out': 'bg-surface-tertiary text-slate-300',
      'Cancelled': 'bg-red-800/30 text-red-200 dark:bg-red-900/30 dark:text-red-300',
    };
    return styles[status] || 'bg-surface-tertiary text-slate-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary p-6 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" message="Loading dashboard..." />
          <p className="text-slate-400 mt-4 text-sm">
            Fetching bookings, rooms, guests, and reports...
          </p>
          <p className="text-slate-500 mt-2 text-xs">
            Check browser console (F12) for detailed API logs
          </p>
        </div>
      </div>
    );
  }

  const bookingTrend = calculateTrend(stats.totalBookings, lastMonthStats.bookings);
  const revenueTrend = calculateTrend(stats.revenue, lastMonthStats.revenue);

  // Check if we have critical data
  const hasCriticalData = stats.totalBookings > 0 || stats.totalRooms > 0;

  return (
    <div className="min-h-screen bg-surface-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Show warning if no data loaded */}
        {!hasCriticalData && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-200 font-semibold mb-1">No Data Available</h3>
              <p className="text-yellow-300 text-sm">
                The dashboard is not loading data from the API. Please check:
              </p>
              <ul className="text-yellow-300 text-sm mt-2 ml-4 list-disc space-y-1">
                <li>Backend server is running on port 4000</li>
                <li>You are logged in with proper credentials</li>
                <li>Your user role has access to dashboard data</li>
                <li>Browser console (F12) for detailed error messages</li>
              </ul>
            </div>
          </div>
        )}

        {/* 🎨 PHASE 1: Glassmorphism Hero Card */}
        <div className="card bg-gradient-to-r from-luxury-navy to-indigo-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>
          <div className="relative z-10 p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-display font-bold mb-2">
                  {getGreeting()}, {user.username}! 👋
                </h1>
                <p className="text-indigo-200 text-lg">
                  {format(new Date(), 'EEEE, MMMM do yyyy')} • {stats.activeBookings} active bookings
                  {lastUpdated && (
                    <span className="text-indigo-300 text-sm ml-2">
                      • Last updated: {format(lastUpdated, 'HH:mm:ss')}
                    </span>
                  )}
                </p>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 transition-all duration-300 disabled:opacity-50"
                title="Refresh Dashboard Data"
              >
                <RefreshCw className={`w-6 h-6 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
              
            </div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <HeroStat 
                label="Today's Revenue" 
                value={`Rs ${todaysRevenue.toLocaleString()}`}
                icon={DollarSign}
              />
              <HeroStat 
                label="Occupancy Rate" 
                value={`${stats.occupancyRate}%`}
                icon={TrendingUp}
              />
              <HeroStat 
                label="Check-ins Today" 
                value={arrivals.length}
                icon={Calendar}
              />
              <HeroStat 
                label="Check-outs Today" 
                value={departures.length}
                icon={LogOut}
              />
            </div>
          </div>
        </div>

        {/* 🎯 PHASE 2: Quick Stats Grid (Enhanced - 6 cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <QuickStat icon={Bed} label="Available" value={stats.availableRooms} color="blue" />
          <QuickStat icon={Users} label="Total Guests" value={stats.totalGuests} color="purple" />
          <QuickStat icon={Calendar} label="Arrivals" value={arrivals.length} color="green" />
          <QuickStat icon={LogOut} label="Departures" value={departures.length} color="orange" />
          <QuickStat icon={Home} label="In-House" value={inHouse.length} color="indigo" />
        </div>

        {/* �💰 PHASE 1: Today's Revenue + Payment Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Revenue Card */}
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 dark:text-green-400 font-medium">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  Rs {paymentStats.collected.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {todaysPayments} payments received
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500 dark:text-green-400 opacity-50" />
            </div>
          </div>

          {/* Payment Status Overview */}
          <StatCard 
            label="Pending"
            value={`Rs ${paymentStats.pending.toLocaleString()}`}
            icon={Clock}
            color="yellow"
          />
          <StatCard 
            label="Check-ins Value"
            value={`Rs ${todaysRevenue.toLocaleString()}`}
            icon={Calendar}
            color="blue"
            subtitle={`${todaysCheckIns} check-ins today`}
          />
        </div>

        {/* 📊 PHASE 1: Revenue Trend Chart + Alerts Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart (2/3 width) */}
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold text-white dark:text-slate-100 mb-4">Revenue Trends (Last 7 Days)</h3>
            <LineChart 
              data={sparklineData.revenue}
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              dataKey="value"
              xKey="label"
              height={240}
              color="#D4AF37"
              strokeWidth={3}
            />
          </div>

          {/* Alerts & Action Items Panel (1/3 width) */}
          <div className="card border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-white dark:text-slate-100 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
              Attention Needed
            </h3>
            <div className="space-y-3">
              {stats.pendingCheckIns > 0 && (
                <AlertItem 
                  icon={Calendar}
                  color="blue"
                  title={`${stats.pendingCheckIns} Pending Check-Ins`}
                  action="View Details"
                  onClick={() => onNavigate && onNavigate('bookings')}
                />
              )}
              {departures.length > 0 && (
                <AlertItem 
                  icon={LogOut}
                  color="purple"
                  title={`${departures.length} Departures Today`}
                  action="Process"
                  onClick={() => onNavigate && onNavigate('bookings')}
                />
              )}
              {paymentStats.overdue > 0 && (
                <AlertItem 
                  icon={CreditCard}
                  color="red"
                  title={`Rs ${paymentStats.overdue.toLocaleString()} Overdue`}
                  action="Review"
                  onClick={() => onNavigate && onNavigate('payments')}
                />
              )}
              {alerts.map((alert, idx) => (
                <AlertItem 
                  key={idx}
                  icon={alert.icon}
                  color={alert.color}
                  title={alert.title}
                  action="View"
                  onClick={() => onNavigate && onNavigate('reports')}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Primary KPI Cards with Trend Indicators (ORIGINAL - Kept for reference) */}
        <div className="hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Bookings */}
          <div className="card hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-blue-800/30 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <TrendIndicator 
                value={bookingTrend} 
                isPositive={!bookingTrend.startsWith('-')}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-white mb-2">{stats.totalBookings}</p>
              <div className="mt-2">
                <Sparkline data={sparklineData.bookings} color="#3B82F6" width={120} height={24} />
              </div>
              <p className="text-xs text-slate-400 mt-2">Last 7 days trend</p>
            </div>
          </div>

          {/* Active Bookings */}
          <div className="card hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-green-800/30 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm font-medium text-slate-300">
                {stats.activeBookings}/{stats.totalRooms} rooms
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">Active Bookings</p>
              <p className="text-3xl font-bold text-white mb-2">{stats.activeBookings}</p>
              <div className="mt-2">
                <Sparkline data={sparklineData.occupancy} color="#10B981" width={120} height={24} />
              </div>
              <p className="text-xs text-slate-400 mt-2">Rooms occupied</p>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="card hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-luxury-gold/20 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-luxury-gold" />
              </div>
              <TrendIndicator 
                value={revenueTrend} 
                isPositive={!revenueTrend.startsWith('-')}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-white mb-2">Rs {stats.revenue.toLocaleString()}</p>
              <div className="mt-2">
                <Sparkline 
                  data={sparklineData.revenue.map(v => v / 1000)} 
                  color="#D4AF37" 
                  width={120} 
                  height={24} 
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">Revenue trend (7 days)</p>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div className="card hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-purple-800/30 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <MiniGauge value={stats.occupancyRate} max={100} color="#8B5CF6" size={48} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">Occupancy Rate</p>
              <p className="text-3xl font-bold text-white mb-2">{stats.occupancyRate}%</p>
              <p className="text-xs text-slate-400 mt-2">
                {stats.availableRooms} rooms available
              </p>
            </div>
          </div>
        </div>

      {/* Secondary Stats with Enhanced Visuals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-300 dark:text-slate-300 mb-1">Total Guests</p>
              <p className="text-3xl font-bold text-white dark:text-slate-100">{stats.totalGuests}</p>
              <div className="mt-2">
                <Sparkline data={sparklineData.bookings} color="#3B82F6" width={80} height={20} />
              </div>
            </div>
            <div className="bg-blue-800/30 dark:bg-blue-900/200/20 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-300 dark:text-slate-300 mb-1">Occupancy Rate</p>
              <div className="flex items-center gap-4">
                <MiniGauge value={stats.occupancyRate} max={100} color="#8B5CF6" size={60} />
                <div>
                  <p className="text-2xl font-bold text-white dark:text-slate-100">{stats.activeBookings}/{stats.totalRooms}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">rooms occupied</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-300 dark:text-slate-300 mb-1">Pending Check-Ins</p>
              <p className="text-3xl font-bold text-white dark:text-slate-100">{stats.pendingCheckIns}</p>
              {stats.pendingCheckIns > 5 && (
                <div className="mt-2 flex items-center text-yellow-600 dark:text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Action required</span>
                </div>
              )}
            </div>
            <div className="bg-yellow-800/30 dark:bg-yellow-900/200/20 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300 dark:text-slate-300">Operations</div>
            <div className="text-xl font-bold text-white dark:text-slate-100">Housekeeping</div>
          </div>
          <button className="btn-primary" onClick={()=>onNavigate && onNavigate('housekeeping')}>Open</button>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300 dark:text-slate-300">Reports</div>
            <div className="text-xl font-bold text-white dark:text-slate-100">Arrivals/Departures</div>
          </div>
          <button className="btn-secondary" onClick={()=>onNavigate && onNavigate('reports')}>View</button>
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300 dark:text-slate-300">Rates</div>
            <div className="text-xl font-bold text-white dark:text-slate-100">Get Quote</div>
          </div>
          <button className="btn-secondary" onClick={()=>setShowQuote(true)}>Quote</button>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white dark:text-slate-100">Recent Bookings</h2>
          <button 
            onClick={() => onNavigate && onNavigate('bookings')}
            className="text-luxury-gold hover:text-luxury-darkGold font-medium text-sm transition-colors flex items-center"
          >
            View All →
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-500 dark:text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 dark:text-slate-300">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 dark:text-slate-200">Guest</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 dark:text-slate-200">Room</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 dark:text-slate-200">Check In</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 dark:text-slate-200">Check Out</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 dark:text-slate-200">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300 dark:text-slate-200">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.booking_id} className="border-b border-border dark:border-slate-700 hover:bg-surface-tertiary dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white dark:text-slate-100">{booking.guest_name || 'Guest'}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300 dark:text-slate-300 font-medium">{booking.room_number || 'N/A'}</td>
                    <td className="py-4 px-4 text-slate-300 dark:text-slate-300">
                      {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-slate-300 dark:text-slate-300">
                      {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-luxury-gold">
                      Rs {parseFloat(booking.total_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ops Mini Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MiniTable title="Arrivals Today" rows={arrivals} onOpen={()=>onNavigate && onNavigate('reports')} />
        <MiniTable title="Departures Today" rows={departures} onOpen={()=>onNavigate && onNavigate('reports')} />
        <MiniTable title="In-House Guests" rows={inHouse} onOpen={()=>onNavigate && onNavigate('reports')} />
      </div>
      {showQuote && (
        <QuickQuoteModal onClose={()=>setShowQuote(false)} />
      )}
      </div>
    </div>
  );
};

function MiniTable({ title, rows, onOpen }) {
  const exportCsv = () => {
    if (!rows || !rows.length) return;
    const header = ['booking_id','guest_name','room_number','branch_name'];
    const lines = [header.join(',')].concat(rows.map(r=>[r.booking_id,r.guest_name || 'N/A',r.room_number || 'N/A',r.branch_name || 'N/A'].join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g,'-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white dark:text-slate-100">{title}</h3>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={exportCsv}>Export</button>
          <button className="btn-secondary" onClick={onOpen}>View</button>
        </div>
      </div>
      {(!rows || rows.length === 0) ? (
        <div className="text-sm text-slate-300 dark:text-slate-300">No records</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-slate-700">
                <th className="text-left py-2 px-2 text-slate-300 dark:text-slate-200">Guest</th>
                <th className="text-left py-2 px-2 text-slate-300 dark:text-slate-200">Room</th>
                <th className="text-left py-2 px-2 text-slate-300 dark:text-slate-200">Branch</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.booking_id} className="border-b border-border dark:border-slate-700">
                  <td className="py-2 px-2 text-white dark:text-slate-100">{r.guest_name || 'N/A'}</td>
                  <td className="py-2 px-2 text-white dark:text-slate-100">{r.room_number || 'N/A'}</td>
                  <td className="py-2 px-2 text-white dark:text-slate-100">{r.branch_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QuickQuoteModal({ onClose }) {
  const [roomTypes, setRoomTypes] = React.useState([]);
  const [form, setForm] = React.useState({ room_type_id: '', check_in: '', check_out: '' });
  const [quote, setQuote] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const roomTypeOptions = React.useMemo(() => {
    if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
      return [];
    }
    return roomTypes.map((rt) => {
      const nightlyRate = Number.parseFloat(rt.daily_rate || rt.base_rate || 0);
      return {
        id: String(rt.room_type_id),
        name: rt.name || rt.type_name || 'Room Type',
        formattedRate: `Rs ${nightlyRate.toFixed(2)}`,
      };
    });
  }, [roomTypes]);

  React.useEffect(() => {
    (async () => {
      try {
        const rts = await api.getRoomTypes();
        setRoomTypes(Array.isArray(rts) ? rts : []);
      } catch {}
    })();
  }, []);

  const getQuote = async () => {
    if (!form.room_type_id || !form.check_in || !form.check_out) return;
    setLoading(true);
    setQuote(null);
    try {
      const data = await api.getRateQuote(form);
      setQuote(data);
    } catch (e) {
      alert('Failed to get quote: ' + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700/50" onClick={(e)=>e.stopPropagation()} style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold text-white">Quick Rate Quote</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Room Type</label>
            <SearchableDropdown
              value={form.room_type_id}
              onChange={(selectedId) => setForm((prev) => ({ ...prev, room_type_id: selectedId }))}
              options={roomTypeOptions}
              placeholder="Select room type"
              searchPlaceholder="Search room types..."
              className="w-full"
              renderOption={(option) => (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{option.name}</span>
                  <span className="text-xs text-slate-400">{option.formattedRate}</span>
                </div>
              )}
              renderSelected={(option) =>
                option ? `${option.name} (${option.formattedRate})` : 'Select room type'
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Check In</label>
              <input type="date" className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400" value={form.check_in} onChange={(e)=>setForm({...form, check_in:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Check Out</label>
              <input type="date" className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400" value={form.check_out} onChange={(e)=>setForm({...form, check_out:e.target.value})} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-primary flex-1" onClick={getQuote} disabled={loading || !form.room_type_id || !form.check_in || !form.check_out}>
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Calculating...
                </div>
              ) : (
                'Get Quote'
              )}
            </button>
            {quote && (
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
                <div className="text-sm font-semibold text-white">
                  {quote.nights} night{quote.nights>1?'s':''} · Total Rs {parseFloat(quote.total).toFixed(2)}
                </div>
                <div className="text-xs text-blue-300">
                  Avg Rs {parseFloat(quote.total / quote.nights).toFixed(2)} per night
                </div>
              </div>
            )}
          </div>
          {quote?.nightly?.length ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="text-sm font-semibold text-white">Nightly Breakdown</div>
              </div>
              <div className="space-y-2">
                {quote.nightly.map((n, index) => (
                  <div key={n.date} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2 hover:bg-slate-700/50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-300">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {new Date(n.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(n.date).toLocaleDateString('en-US', { year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">Rs {parseFloat(n.rate).toFixed(2)}</div>
                      <div className="text-xs text-slate-400">per night</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-600/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-300">Total Amount</span>
                  <span className="text-lg font-bold text-luxury-gold">Rs {parseFloat(quote.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-400">Average per night</span>
                  <span className="text-sm font-semibold text-blue-300">Rs {parseFloat(quote.total / quote.nights).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ===== HELPER COMPONENTS =====

// Hero Stat Component (for glassmorphism hero card)
function HeroStat({ label, value, icon: Icon }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-indigo-200 text-sm">{label}</span>
        <Icon className="w-5 h-5 text-indigo-300" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

// Quick Stat Component (for 6-card grid)
function QuickStat({ icon: Icon, label, value, color }) {
  const colorStyles = {
    blue: 'bg-blue-800/30 dark:bg-blue-900/200/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-800/30 dark:bg-purple-900/200/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-800/30 dark:bg-green-900/200/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-800/30 dark:bg-orange-900/200/20 text-orange-600 dark:text-orange-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    gold: 'bg-yellow-800/30 dark:bg-yellow-900/200/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="card hover:shadow-lg transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-300 dark:text-slate-300 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white dark:text-slate-100">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorStyles[color] || colorStyles.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component (for payment status)
function StatCard({ label, value, icon: Icon, color, subtitle }) {
  const colorStyles = {
    green: { bg: 'bg-green-900/20 dark:bg-green-900/200/10', icon: 'bg-green-800/30 dark:bg-green-900/200/20', text: 'text-green-600 dark:text-green-400', value: 'text-green-900 dark:text-green-100' },
    yellow: { bg: 'bg-yellow-900/20 dark:bg-yellow-900/200/10', icon: 'bg-yellow-800/30 dark:bg-yellow-900/200/20', text: 'text-yellow-600 dark:text-yellow-400', value: 'text-yellow-900 dark:text-yellow-100' },
    red: { bg: 'bg-red-900/20 dark:bg-red-900/200/10', icon: 'bg-red-800/30 dark:bg-red-900/200/20', text: 'text-red-600 dark:text-red-400', value: 'text-red-900 dark:text-red-100' },
    blue: { bg: 'bg-blue-900/20 dark:bg-blue-900/200/10', icon: 'bg-blue-800/30 dark:bg-blue-900/200/20', text: 'text-blue-600 dark:text-blue-400', value: 'text-blue-900 dark:text-blue-100' },
  };

  const styles = colorStyles[color] || colorStyles.green;

  return (
    <div className={`card ${styles.bg}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${styles.text} mb-1`}>{label}</p>
          <p className={`text-2xl font-bold ${styles.value}`}>{value}</p>
          {subtitle && <p className={`text-xs ${styles.text} mt-1`}>{subtitle}</p>}
        </div>
        <div className={`${styles.icon} p-3 rounded-full`}>
          <Icon className={`w-6 h-6 ${styles.text}`} />
        </div>
      </div>
    </div>
  );
}

// Alert Item Component (for alerts panel)
function AlertItem({ icon: Icon, color, title, action, onClick }) {
  const colorStyles = {
    blue: 'bg-blue-900/20 text-blue-300 border-blue-700',
    purple: 'bg-purple-900/20 text-purple-300 border-purple-700',
    red: 'bg-red-900/20 text-red-300 border-red-700',
    orange: 'bg-orange-900/20 text-orange-300 border-orange-700',
    green: 'bg-green-900/20 text-green-300 border-green-700',
    yellow: 'bg-yellow-900/20 text-yellow-700 border-yellow-200',
  };

  const handleClick = () => {
    console.log('Alert button clicked:', { title, action, onClick: !!onClick });
    if (onClick) {
      onClick();
    } else {
      console.warn('No onClick handler provided for alert:', title);
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${colorStyles[color] || colorStyles.blue}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      {action && (
        <button 
          onClick={handleClick}
          className="text-xs font-medium hover:underline hover:text-white transition-colors duration-200 px-2 py-1 rounded hover:bg-white/10"
        >
          {action} →
        </button>
      )}
    </div>
  );
}

// Activity Item Component (for activity feed)
function ActivityItem({ icon: Icon, color, text, time }) {
  const colorStyles = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
      <div className={`mt-1 ${colorStyles[color] || colorStyles.blue}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{text}</p>
        <p className="text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}

export default Dashboard;

