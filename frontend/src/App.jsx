import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { 
  Hotel, Users, Calendar, DollarSign, BarChart3, 
  LogOut, Menu, X, Home, Bed, ShoppingBag, CreditCard,
  UserCircle, Settings, Bell, Search, ChevronDown,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  FileText, Printer, Download, Trash2, Edit
} from 'lucide-react';
import { format } from 'date-fns';

// API Configuration
const API_URL = 'http://localhost:4000';

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// API Helper
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  },

  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async register(registrationData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  },

  async getBookings() {
    return this.request('/api/bookings');
  },

  async createBooking(bookingData) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  async getRooms() {
    return this.request('/api/rooms');
  },

  async getServices() {
    return this.request('/api/services');
  },

  async getReports(type, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/${type}?${query}`);
  },

  async getUsers() {
    return this.request('/api/admin/users');
  },

  async createUser(userData) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Pre-bookings
  async getPreBookings() {
    return this.request('/api/prebookings');
  },

  async createPreBooking(data) {
    return this.request('/api/prebookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPreBookingDetails(id) {
    return this.request(`/api/prebookings/${id}`);
  },

  // Invoices
  async generateInvoice(bookingId) {
    return this.request('/api/invoices/generate', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId }),
    });
  },

  async getInvoiceHtml(invoiceId) {
    return this.request(`/api/invoices/${invoiceId}/html`);
  },

  // Payment Adjustments
  async adjustPayment(data) {
    return this.request('/api/payments/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Service Usage
  async getServiceUsage() {
    return this.request('/api/services/usage');
  },

  // Branches
  async getBranches() {
    return this.request('/api/admin/branches');
  },

  async updateBranch(branchId, data) {
    return this.request(`/api/admin/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBranch(branchId) {
    return this.request(`/api/admin/branches/${branchId}`, {
      method: 'DELETE',
    });
  },

  // Guests
  async getGuests() {
    return this.request('/api/guests');
  },

  async createGuest(data) {
    return this.request('/api/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Room Types
  async getRoomTypes() {
    return this.request('/api/room-types');
  },
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    gold: 'bg-luxury-gold',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={`${colorClasses[color]} p-4 rounded-xl`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
};

// Login Page
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Admin' },
    { username: 'manager', password: 'manager123', role: 'Manager' },
    { username: 'receptionist', password: 'receptionist123', role: 'Receptionist' },
    { username: 'accountant', password: 'accountant123', role: 'Accountant' },
    { username: 'customer', password: 'customer123', role: 'Customer' },
  ];

  return (
    <div className="min-h-screen luxury-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-luxury-gold rounded-2xl mb-4 shadow-luxury">
            <Hotel className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">SkyNest Hotel</h1>
          <p className="text-blue-100">Luxury Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.username}
                  onClick={() => {
                    setUsername(user.username);
                    setPassword(user.password);
                  }}
                  className="text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                >
                  <div className="font-medium text-gray-900">{user.role}</div>
                  <div className="text-gray-500">{user.username}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setShowRegister(true)}
                className="text-luxury-gold hover:text-luxury-darkGold font-medium"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-100 text-sm mt-6">
          © 2025 SkyNest Hotel. All rights reserved.
        </p>
      </div>

      {/* Registration Modal */}
      {showRegister && (
        <RegistrationModal 
          onClose={() => setShowRegister(false)}
          onSuccess={(username, password) => {
            setShowRegister(false);
            setUsername(username);
            setPassword(password);
            setError('');
          }}
        />
      )}
    </div>
  );
};

// Registration Modal
const RegistrationModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.register({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
      
      onSuccess(formData.username, formData.password);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Register as a customer to book rooms</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="input-field"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="input-field"
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="input-field"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input-field"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="input-field"
                placeholder="Street address, city, country"
                rows="2"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
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

// Bookings Page with Full CRUD
const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    searchCustomer: '',
    searchBookingId: '',
    startDate: '',
    endDate: '',
    roomNumber: '',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setError(null);
      const data = await api.getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setError(error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Error loading bookings</p>
              <p className="text-sm">{error}</p>
              <button onClick={loadBookings} className="btn-secondary mt-3 text-sm">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await api.request(`/api/bookings/${bookingId}/checkin`, { method: 'POST' });
      loadBookings();
    } catch (error) {
      alert('Failed to check in: ' + error.message);
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      await api.request(`/api/bookings/${bookingId}/checkout`, { method: 'POST' });
      loadBookings();
    } catch (error) {
      alert('Failed to check out: ' + error.message);
    }
  };

  const exportToExcel = () => {
    const data = filteredBookings.map(b => ({
      'Booking ID': b.booking_id,
      'Customer': b.customer_name,
      'Room': b.room_number,
      'Check In': b.check_in_date,
      'Check Out': b.check_out_date,
      'Status': b.status,
      'Amount': b.total_amount
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    alert('PDF export would be implemented with jspdf library. For now, use CSV export.');
  };

  const filteredBookings = bookings.filter(b => {
    // Status filter
    if (filter !== 'All' && b.status !== filter) return false;
    
    // Advanced filters
    if (advancedFilters.searchCustomer && !b.customer_name?.toLowerCase().includes(advancedFilters.searchCustomer.toLowerCase())) return false;
    if (advancedFilters.searchBookingId && !String(b.booking_id).includes(advancedFilters.searchBookingId)) return false;
    if (advancedFilters.roomNumber && !String(b.room_number).includes(advancedFilters.roomNumber)) return false;
    if (advancedFilters.startDate && new Date(b.check_in_date) < new Date(advancedFilters.startDate)) return false;
    if (advancedFilters.endDate && new Date(b.check_out_date) > new Date(advancedFilters.endDate)) return false;
    
    return true;
  });

  const statuses = ['All', 'Booked', 'Checked-In', 'Checked-Out', 'Cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage all hotel reservations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="btn-secondary">
            <Download className="w-4 h-4 mr-2 inline" />
            Export CSV
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Calendar className="w-5 h-5 mr-2 inline" />
            New Booking
          </button>
        </div>
      </div>

      {/* Advanced Search Filters */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              value={advancedFilters.searchCustomer}
              onChange={(e) => setAdvancedFilters({...advancedFilters, searchCustomer: e.target.value})}
              className="input-field"
              placeholder="Search customer..."
            />
          </div>
          <div>
            <input
              type="text"
              value={advancedFilters.searchBookingId}
              onChange={(e) => setAdvancedFilters({...advancedFilters, searchBookingId: e.target.value})}
              className="input-field"
              placeholder="Booking ID..."
            />
          </div>
          <div>
            <input
              type="text"
              value={advancedFilters.roomNumber}
              onChange={(e) => setAdvancedFilters({...advancedFilters, roomNumber: e.target.value})}
              className="input-field"
              placeholder="Room number..."
            />
          </div>
          <div>
            <input
              type="date"
              value={advancedFilters.startDate}
              onChange={(e) => setAdvancedFilters({...advancedFilters, startDate: e.target.value})}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <input
              type="date"
              value={advancedFilters.endDate}
              onChange={(e) => setAdvancedFilters({...advancedFilters, endDate: e.target.value})}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-luxury-gold text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map(booking => (
              <div key={booking.booking_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.guest_name || 'Guest'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'Checked-In' ? 'bg-green-100 text-green-700' :
                        booking.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Room</p>
                        <p className="font-medium text-gray-900">{booking.room_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check In</p>
                        <p className="font-medium text-gray-900">
                          {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check Out</p>
                        <p className="font-medium text-gray-900">
                          {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-bold text-luxury-gold">
                          ${parseFloat(booking.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {booking.status === 'Booked' && (
                      <button 
                        onClick={() => handleCheckIn(booking.booking_id)}
                        className="btn-primary text-sm"
                      >
                        Check In
                      </button>
                    )}
                    {booking.status === 'Checked-In' && (
                      <button 
                        onClick={() => handleCheckOut(booking.booking_id)}
                        className="btn-secondary text-sm"
                      >
                        Check Out
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedBooking(booking)}
                      className="btn-secondary text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            loadBookings();
          }}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal 
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

// Create Booking Modal
const CreateBookingModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createBooking(formData);
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID</label>
            <input
              type="number"
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
            <input
              type="number"
              value={formData.room_id}
              onChange={(e) => setFormData({...formData, room_id: e.target.value})}
              className="input-field"
              required
            />
          </div>
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
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Booking Details Modal
const BookingDetailsModal = ({ booking, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Booking ID</p>
              <p className="font-medium text-gray-900">{booking.booking_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                booking.status === 'Checked-In' ? 'bg-green-100 text-green-700' :
                booking.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Guest Name</p>
              <p className="font-medium text-gray-900">{booking.guest_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Room Number</p>
              <p className="font-medium text-gray-900">{booking.room_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check In Date</p>
              <p className="font-medium text-gray-900">
                {booking.check_in_date ? format(new Date(booking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check Out Date</p>
              <p className="font-medium text-gray-900">
                {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Guests</p>
              <p className="font-medium text-gray-900">{booking.number_of_guests || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-bold text-luxury-gold text-lg">
                ${parseFloat(booking.total_amount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Rooms Page
const RoomsPage = () => {
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

// Services Page
const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setError(null);
      const data = await api.request('/api/catalog/services');
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setError(error.message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Error loading services</p>
              <p className="text-sm">{error}</p>
              <button onClick={loadServices} className="btn-secondary mt-3 text-sm">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Hotel amenities and services catalog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="card h-40 skeleton"></div>
          ))
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No services found</p>
          </div>
        ) : (
          services.map(service => (
            <div key={service.service_id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{service.service_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-xl font-bold text-luxury-gold">${service.price}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Payments Page
const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await api.request('/api/payments');
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = (payment) => {
    setSelectedPayment(payment);
    setShowAdjustModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track all payment transactions</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <CreditCard className="w-5 h-5 mr-2 inline" />
          Record Payment
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Booking ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{payment.payment_id}</td>
                    <td className="py-4 px-4 text-gray-600">{payment.booking_id}</td>
                    <td className="py-4 px-4 font-bold text-luxury-gold">${payment.amount}</td>
                    <td className="py-4 px-4 text-gray-600">{payment.payment_method}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => handleAdjustment(payment)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePaymentModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPayments();
          }}
        />
      )}

      {showAdjustModal && selectedPayment && (
        <PaymentAdjustmentModal 
          payment={selectedPayment}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedPayment(null);
          }}
          onSuccess={() => {
            setShowAdjustModal(false);
            setSelectedPayment(null);
            loadPayments();
          }}
        />
      )}
    </div>
  );
};

// Create Payment Modal
const CreatePaymentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    booking_id: '',
    amount: '',
    payment_method: 'Cash',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('/api/payments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (error) {
      alert('Failed to create payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Booking ID</label>
            <input
              type="number"
              value={formData.booking_id}
              onChange={(e) => setFormData({...formData, booking_id: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
              className="input-field"
            >
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Adjustment Modal
const PaymentAdjustmentModal = ({ payment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    adjustment_type: 'Refund',
    adjustment_amount: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.adjustPayment({
        payment_id: payment.payment_id,
        ...formData
      });
      onSuccess();
    } catch (error) {
      alert('Failed to adjust payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Adjust Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Original Payment</p>
            <p className="text-lg font-bold text-gray-900 mt-1">${payment.amount}</p>
            <p className="text-sm text-gray-600 mt-1">Booking #{payment.booking_id}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
              <select
                value={formData.adjustment_type}
                onChange={(e) => setFormData({...formData, adjustment_type: e.target.value})}
                className="input-field"
              >
                <option value="Refund">Refund</option>
                <option value="Chargeback">Chargeback</option>
                <option value="Correction">Correction</option>
                <option value="Discount">Discount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.adjustment_amount}
                onChange={(e) => setFormData({...formData, adjustment_amount: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="input-field"
                rows="3"
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Processing...' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Reports Page
const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  const reportTypes = [
    { id: 'occupancy', name: 'Occupancy Report', icon: Bed },
    { id: 'revenue', name: 'Revenue Report', icon: DollarSign },
    { id: 'bookings', name: 'Bookings Summary', icon: Calendar },
    { id: 'payments', name: 'Payments Report', icon: CreditCard },
    { id: 'customers', name: 'Customer Report', icon: Users },
    { id: 'services', name: 'Services Usage', icon: ShoppingBag },
  ];

  const loadReport = async (reportId) => {
    setLoading(true);
    try {
      const data = await api.request(`/api/reports/${reportId}`, {
        method: 'POST',
        body: JSON.stringify(dateRange)
      });
      setReportData(data);
      setSelectedReport(reportId);
    } catch (error) {
      alert('Failed to load report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportReportToCSV = () => {
    if (!reportData || !reportData.length) {
      alert('No data to export');
      return;
    }
    
    const csv = [
      Object.keys(reportData[0]).join(','),
      ...reportData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view business reports</p>
        </div>
        {reportData && (
          <button onClick={exportReportToCSV} className="btn-secondary">
            <Download className="w-4 h-4 mr-2 inline" />
            Export Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
            className="input-field"
            placeholder="DD/MM/YYYY"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
            className="input-field"
            placeholder="DD/MM/YYYY"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map(report => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => loadReport(report.id)}
              disabled={loading}
              className="card hover:shadow-lg transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="bg-luxury-gold p-3 rounded-xl">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-600">Click to generate</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
          <p className="text-gray-600 mt-4">Generating report...</p>
        </div>
      )}

      {reportData && !loading && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {reportTypes.find(r => r.id === selectedReport)?.name}
          </h2>
          
          {reportData.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No data found for the selected date range</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(reportData[0]).map((key) => (
                      <th key={key} className="px-4 py-3 text-left">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, colIdx) => (
                        <td key={colIdx} className="px-4 py-3">
                          {value === null || value === undefined ? '-' : 
                           typeof value === 'number' ? value.toLocaleString() :
                           typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(value).toLocaleDateString() :
                           String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Admin/Users Page
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('🔍 Loading users from /api/admin/users...');
      const data = await api.request('/api/admin/users');
      console.log('✅ Users loaded:', data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Create and manage employee accounts (Admin/Manager)</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Users className="w-5 h-5 mr-2 inline" />
          Add Employee
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map(user => (
              <div key={user.user_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};

// Create User Modal with Role-Based Permissions
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [fetchingRoles, setFetchingRoles] = useState(true);

  useEffect(() => {
    loadAllowedRoles();
  }, []);

  const loadAllowedRoles = async () => {
    try {
      const data = await api.request('/api/admin/allowed-roles');
      setAllowedRoles(data.allowedRoles || []);
      if (data.allowedRoles && data.allowedRoles.length > 0) {
        setFormData(prev => ({ ...prev, role: data.allowedRoles[0] }));
      }
    } catch (error) {
      console.error('Failed to load allowed roles:', error);
      // Fallback to basic roles if fetch fails
      setAllowedRoles(['Receptionist', 'Accountant']);
      setFormData(prev => ({ ...prev, role: 'Receptionist' }));
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use the new employee creation endpoint
      await api.request('/api/admin/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (error) {
      alert('Failed to create employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Create Employee Account</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new employee to the system</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Account Information */}
          <div className="space-y-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Account Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="input-field"
                placeholder="e.g., john.manager"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input-field"
                placeholder="Minimum 6 characters"
                minLength="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              {fetchingRoles ? (
                <div className="input-field text-gray-400">Loading roles...</div>
              ) : allowedRoles.length === 0 ? (
                <div className="input-field text-red-600">No roles available</div>
              ) : (
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input-field"
                  required
                >
                  {allowedRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                You can only create roles you have permission for
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="input-field"
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-field"
                placeholder="employee@skynest.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="input-field"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || fetchingRoles || allowedRoles.length === 0} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Pre-bookings Page
const PreBookingsPage = () => {
  const [preBookings, setPreBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPreBooking, setSelectedPreBooking] = useState(null);

  useEffect(() => {
    loadPreBookings();
  }, []);

  const loadPreBookings = async () => {
    try {
      setError(null);
      const data = await api.getPreBookings();
      setPreBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load pre-bookings:', error);
      setError(error.message);
      setPreBookings([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Pre-Bookings</h1>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Error loading pre-bookings</p>
              <p className="text-sm">{error}</p>
              <button onClick={loadPreBookings} className="btn-secondary mt-3 text-sm">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pre-Bookings</h1>
          <p className="text-gray-600 mt-1">Advance booking requests and reservations</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Calendar className="w-5 h-5 mr-2 inline" />
          New Pre-Booking
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading pre-bookings...</p>
          </div>
        ) : preBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No pre-bookings found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {preBookings.map(preBooking => (
              <div key={preBooking.pre_booking_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {preBooking.prebooking_code || `Pre-Booking #${preBooking.pre_booking_id}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        preBooking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                        preBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {preBooking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Customer</p>
                        <p className="font-medium text-gray-900">{preBooking.customer_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check In</p>
                        <p className="font-medium text-gray-900">
                          {preBooking.check_in_date ? format(new Date(preBooking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Check Out</p>
                        <p className="font-medium text-gray-900">
                          {preBooking.check_out_date ? format(new Date(preBooking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Guests</p>
                        <p className="font-medium text-gray-900">{preBooking.number_of_guests || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPreBooking(preBooking)}
                    className="btn-secondary ml-4"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePreBookingModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPreBookings();
          }}
        />
      )}

      {selectedPreBooking && (
        <PreBookingDetailsModal 
          preBooking={selectedPreBooking}
          onClose={() => setSelectedPreBooking(null)}
        />
      )}
    </div>
  );
};

// Create Pre-Booking Modal
const CreatePreBookingModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    room_type_preference: '',
    special_requests: '',
  });
  const [loading, setLoading] = useState(false);
  const [guests, setGuests] = useState([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);

  useEffect(() => {
    loadGuests();
    loadRoomTypes();
  }, []);

  const loadGuests = async () => {
    try {
      const data = await api.getGuests();
      setGuests(data);
    } catch (error) {
      console.error('Failed to load guests:', error);
    } finally {
      setLoadingGuests(false);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const data = await api.getRoomTypes();
      setRoomTypes(data);
    } catch (error) {
      console.error('Failed to load room types:', error);
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createPreBooking(formData);
      onSuccess();
    } catch (error) {
      alert('Failed to create pre-booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">New Pre-Booking</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            {loadingGuests ? (
              <div className="input-field text-gray-500">Loading customers...</div>
            ) : (
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                className="input-field"
                required
              >
                <option value="">Select a customer</option>
                {guests.map(guest => (
                  <option key={guest.guest_id} value={guest.guest_id}>
                    {guest.full_name} - {guest.email} {guest.phone ? `(${guest.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Type Preference</label>
            {loadingRoomTypes ? (
              <div className="input-field text-gray-500">Loading room types...</div>
            ) : (
              <select
                value={formData.room_type_preference}
                onChange={(e) => setFormData({...formData, room_type_preference: e.target.value})}
                className="input-field"
              >
                <option value="">No preference</option>
                {roomTypes.map(roomType => (
                  <option key={roomType.room_type_id} value={roomType.name}>
                    {roomType.name} - Capacity: {roomType.capacity} - ${roomType.daily_rate}/night
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
            <textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
              className="input-field"
              rows="3"
              placeholder="Any special requirements..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Pre-Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Pre-Booking Details Modal
const PreBookingDetailsModal = ({ preBooking, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Pre-Booking Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Pre-Booking Code</p>
              <p className="font-medium text-gray-900">{preBooking.prebooking_code || `#${preBooking.pre_booking_id}`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                preBooking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                preBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {preBooking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Name</p>
              <p className="font-medium text-gray-900">{preBooking.customer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Guests</p>
              <p className="font-medium text-gray-900">{preBooking.number_of_guests || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check In Date</p>
              <p className="font-medium text-gray-900">
                {preBooking.check_in_date ? format(new Date(preBooking.check_in_date), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check Out Date</p>
              <p className="font-medium text-gray-900">
                {preBooking.check_out_date ? format(new Date(preBooking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Room Type Preference</p>
              <p className="font-medium text-gray-900">{preBooking.room_type_preference || 'No preference'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Special Requests</p>
              <p className="font-medium text-gray-900">{preBooking.special_requests || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Invoices Page
const InvoicesPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [invoiceHtml, setInvoiceHtml] = useState('');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.getBookings();
      // Only show checked-out bookings that can have invoices
      const eligibleBookings = data.filter(b => b.status === 'Checked Out');
      setBookings(eligibleBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (bookingId) => {
    try {
      await api.generateInvoice({ booking_id: bookingId });
      alert('Invoice generated successfully!');
      loadBookings();
    } catch (error) {
      alert('Failed to generate invoice: ' + error.message);
    }
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      const html = await api.getInvoiceHtml(bookingId);
      setInvoiceHtml(html);
      setShowInvoicePreview(true);
    } catch (error) {
      alert('Failed to load invoice: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Generate and manage booking invoices</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No eligible bookings for invoicing</p>
            <p className="text-sm text-gray-500 mt-1">Only checked-out bookings can have invoices generated</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map(booking => (
                  <tr key={booking.booking_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{booking.booking_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.customer_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.check_out_date ? format(new Date(booking.check_out_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${parseFloat(booking.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleGenerateInvoice(booking.booking_id)}
                        className="text-luxury-gold hover:text-luxury-gold-dark font-medium"
                      >
                        Generate
                      </button>
                      <button
                        onClick={() => handleViewInvoice(booking.booking_id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInvoicePreview && (
        <InvoicePreviewModal 
          html={invoiceHtml}
          onClose={() => {
            setShowInvoicePreview(false);
            setInvoiceHtml('');
          }}
        />
      )}
    </div>
  );
};

// Invoice Preview Modal
const InvoicePreviewModal = ({ html, onClose }) => {
  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="btn-secondary">
              <Printer className="w-4 h-4 mr-2 inline" />
              Print
            </button>
            <button onClick={handleDownload} className="btn-primary">
              <Download className="w-4 h-4 mr-2 inline" />
              Download
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Guests Page
const GuestsPage = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const data = await api.getGuests();
      setGuests(data);
    } catch (error) {
      console.error('Failed to load guests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guests</h1>
          <p className="text-gray-600 mt-1">Manage guest information and profiles</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Users className="w-5 h-5 mr-2 inline" />
          Add Guest
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading guests...</p>
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No guests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guests.map(guest => (
                  <tr key={guest.guest_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{guest.guest_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {guest.guest_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.phone_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.id_document_type}: {guest.id_document_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      Booking #{guest.booking_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGuestModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGuests();
          }}
        />
      )}
    </div>
  );
};

// Create Guest Modal
const CreateGuestModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    booking_id: '',
    guest_name: '',
    email: '',
    phone_number: '',
    id_document_type: 'Passport',
    id_document_number: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createGuest(formData);
      onSuccess();
    } catch (error) {
      alert('Failed to create guest: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Guest</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Booking ID</label>
            <input
              type="number"
              value={formData.booking_id}
              onChange={(e) => setFormData({...formData, booking_id: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name</label>
            <input
              type="text"
              value={formData.guest_name}
              onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Type</label>
            <select
              value={formData.id_document_type}
              onChange={(e) => setFormData({...formData, id_document_type: e.target.value})}
              className="input-field"
            >
              <option value="Passport">Passport</option>
              <option value="Driver License">Driver License</option>
              <option value="National ID">National ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Number</label>
            <input
              type="text"
              value={formData.id_document_number}
              onChange={(e) => setFormData({...formData, id_document_number: e.target.value})}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Service Usage Page
const ServiceUsagePage = () => {
  const [serviceUsage, setServiceUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadServiceUsage();
  }, []);

  const loadServiceUsage = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const data = await api.getServiceUsage(params);
      setServiceUsage(data);
    } catch (error) {
      console.error('Failed to load service usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadServiceUsage();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Usage</h1>
          <p className="text-gray-600 mt-1">Track service consumption and usage patterns</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleFilter} className="btn-primary w-full">
              <Search className="w-4 h-4 mr-2 inline" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Usage Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading service usage...</p>
          </div>
        ) : serviceUsage.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No service usage found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceUsage.map(usage => (
                  <tr key={usage.service_usage_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{usage.service_usage_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Booking #{usage.booking_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usage.service_name || `Service #${usage.service_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usage.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(usage.unit_price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${parseFloat(usage.total_price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {usage.usage_date ? format(new Date(usage.usage_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Email Sending Modal (Reusable)
const EmailModal = ({ onClose, recipient, subject: initialSubject, body: initialBody, onSend }) => {
  const [formData, setFormData] = useState({
    to: recipient || '',
    subject: initialSubject || '',
    body: initialBody || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (onSend) {
        await onSend(formData);
      }
      alert('Email sent successfully!');
      onClose();
    } catch (error) {
      alert('Failed to send email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Send Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <input
              type="email"
              value={formData.to}
              onChange={(e) => setFormData({...formData, to: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({...formData, body: e.target.value})}
              className="input-field"
              rows="10"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Branches Page (Admin Only)
const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId, branchName) => {
    if (!window.confirm(`Are you sure you want to delete "${branchName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingBranch(branchId);
    try {
      await api.deleteBranch(branchId);
      await loadBranches();
      alert('Branch deleted successfully');
    } catch (error) {
      alert('Failed to delete branch: ' + error.message);
    } finally {
      setDeletingBranch(null);
    }
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    setEditingBranch(null);
    await loadBranches();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
          <p className="text-gray-600 mt-1">Manage hotel locations and branches</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Hotel className="w-5 h-5 mr-2 inline" />
          Add Branch
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12">
            <Hotel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No branches found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {branches.map(branch => (
              <div key={branch.branch_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {branch.branch_name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{branch.address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contact</p>
                        <p className="font-medium text-gray-900">{branch.contact_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Manager</p>
                        <p className="font-medium text-gray-900">{branch.manager_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Branch Code</p>
                        <p className="font-medium text-gray-900">{branch.branch_code || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditBranch(branch)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit branch"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.branch_id, branch.branch_name)}
                      disabled={deletingBranch === branch.branch_id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete branch"
                    >
                      {deletingBranch === branch.branch_id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateBranchModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBranches();
          }}
        />
      )}

      {showEditModal && editingBranch && (
        <EditBranchModal 
          branch={editingBranch}
          onClose={() => {
            setShowEditModal(false);
            setEditingBranch(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

// Create Branch Modal
const CreateBranchModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    branch_name: '',
    location: '',
    contact_number: '',
    manager_name: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('/api/admin/branches', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (error) {
      alert('Failed to create branch: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Branch</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
            <input
              type="text"
              value={formData.branch_name}
              onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <input
              type="tel"
              value={formData.contact_number}
              onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
            <input
              type="text"
              value={formData.manager_name}
              onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Branch Modal
const EditBranchModal = ({ branch, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    branch_name: branch.branch_name || '',
    location: branch.address || '',
    contact_number: branch.contact_number || '',
    manager_name: branch.manager_name || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateBranch(branch.branch_id, formData);
      onSuccess();
    } catch (error) {
      alert('Failed to update branch: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Branch</h2>
          <p className="text-sm text-gray-600 mt-1">Branch Code: {branch.branch_code}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
            <input
              type="text"
              value={formData.branch_name}
              onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <input
              type="tel"
              value={formData.contact_number}
              onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
            <input
              type="text"
              value={formData.manager_name}
              onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Updating...' : 'Update Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Audit Log Page (Admin Only)
const AuditLogPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    actionType: '',
    searchUser: '',
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call when backend is ready
      const mockData = [
        {
          audit_id: 1,
          user_name: 'Admin User',
          action_type: 'LOGIN',
          table_affected: 'user_account',
          record_id: 1,
          timestamp: new Date().toISOString(),
          details: 'User logged in successfully'
        },
        {
          audit_id: 2,
          user_name: 'Admin User',
          action_type: 'CREATE',
          table_affected: 'booking',
          record_id: 101,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'Created new booking #101'
        },
        {
          audit_id: 3,
          user_name: 'Manager User',
          action_type: 'UPDATE',
          table_affected: 'payment',
          record_id: 50,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: 'Updated payment status to Completed'
        },
      ];
      setAuditLogs(mockData);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filters.actionType && log.action_type !== filters.actionType) return false;
    if (filters.searchUser && !log.user_name.toLowerCase().includes(filters.searchUser.toLowerCase())) return false;
    if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">System activity and change tracking</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="input-field"
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
            <select
              value={filters.actionType}
              onChange={(e) => setFilters({...filters, actionType: e.target.value})}
              className="input-field"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search User</label>
            <input
              type="text"
              value={filters.searchUser}
              onChange={(e) => setFilters({...filters, searchUser: e.target.value})}
              className="input-field"
              placeholder="User name..."
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map(log => (
                  <tr key={log.audit_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        log.action_type === 'CREATE' ? 'bg-green-100 text-green-700' :
                        log.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                        log.action_type === 'DELETE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.table_affected}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      #{log.record_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    const savedUser = localStorage.getItem('user');
    setUser(JSON.parse(savedUser));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'bookings', name: 'Bookings', icon: Calendar },
    { id: 'prebookings', name: 'Pre-Bookings', icon: Clock },
    { id: 'guests', name: 'Guests', icon: UserCircle },
    { id: 'rooms', name: 'Rooms', icon: Bed },
    { id: 'services', name: 'Services', icon: ShoppingBag },
    { id: 'serviceusage', name: 'Service Usage', icon: TrendingUp },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'invoices', name: 'Invoices', icon: FileText },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    ...(user?.role === 'Admin' || user?.role === 'Manager' ? [
      { id: 'users', name: 'Employees', icon: Users }
    ] : []),
    ...(user?.role === 'Admin' ? [
      { id: 'branches', name: 'Branches', icon: Hotel },
      { id: 'auditlog', name: 'Audit Log', icon: Settings },
    ] : []),
  ];

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="luxury-gradient text-white shadow-lg fixed w-full top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors mr-4"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Hotel className="w-8 h-8 text-luxury-gold mr-3" />
              <span className="text-xl font-display font-bold">SkyNest Hotel</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                <div className="text-right">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs text-blue-100">{user.role}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
      }`}>
        <nav className="p-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-luxury-gold text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto">
          {currentPage === 'dashboard' && <Dashboard user={user} />}
          {currentPage === 'bookings' && <BookingsPage />}
          {currentPage === 'prebookings' && <PreBookingsPage />}
          {currentPage === 'guests' && <GuestsPage />}
          {currentPage === 'rooms' && <RoomsPage />}
          {currentPage === 'services' && <ServicesPage />}
          {currentPage === 'serviceusage' && <ServiceUsagePage />}
          {currentPage === 'payments' && <PaymentsPage />}
          {currentPage === 'invoices' && <InvoicesPage />}
          {currentPage === 'reports' && <ReportsPage />}
          {currentPage === 'branches' && user?.role === 'Admin' && <BranchesPage />}
          {currentPage === 'auditlog' && user?.role === 'Admin' && <AuditLogPage />}
          {currentPage === 'users' && (user?.role === 'Admin' || user?.role === 'Manager') && <UsersPage />}
        </div>
      </main>
    </div>
  );
};

// Render
const root = createRoot(document.getElementById('root'));
root.render(<App />);




