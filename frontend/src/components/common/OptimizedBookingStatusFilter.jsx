// frontend/src/components/common/OptimizedBookingStatusFilter.jsx
import React, { useState, useEffect } from 'react';
import { Filter, CheckCircle, Clock, Bed, XCircle, TrendingUp } from 'lucide-react';
import api from '../../utils/api';

const OptimizedBookingStatusFilter = ({ onStatusChange, onDateRangeChange, className = "" }) => {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [statusStats, setStatusStats] = useState({});
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'All', label: 'All Bookings', icon: TrendingUp, color: 'gray' },
    { value: 'Booked', label: 'Booked', icon: Bed, color: 'blue' },
    { value: 'Checked-In', label: 'Checked-In', icon: CheckCircle, color: 'green' },
    { value: 'Checked-Out', label: 'Checked-Out', icon: Clock, color: 'purple' },
    { value: 'Cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
  ];

  useEffect(() => {
    loadStatusStats();
  }, []);

  const loadStatusStats = async () => {
    setLoading(true);
    try {
      // Use the new optimized booking queries
      const [bookedBookings, checkedInBookings, checkedOutBookings, cancelledBookings] = await Promise.all([
        api.getBookingsByStatus('Booked'),
        api.getBookingsByStatus('Checked-In'),
        api.getBookingsByStatus('Checked-Out'),
        api.getBookingsByStatus('Cancelled')
      ]);

      setStatusStats({
        Booked: Array.isArray(bookedBookings) ? bookedBookings.length : 0,
        'Checked-In': Array.isArray(checkedInBookings) ? checkedInBookings.length : 0,
        'Checked-Out': Array.isArray(checkedOutBookings) ? checkedOutBookings.length : 0,
        Cancelled: Array.isArray(cancelledBookings) ? cancelledBookings.length : 0,
        All: (Array.isArray(bookedBookings) ? bookedBookings.length : 0) +
             (Array.isArray(checkedInBookings) ? checkedInBookings.length : 0) +
             (Array.isArray(checkedOutBookings) ? checkedOutBookings.length : 0) +
             (Array.isArray(cancelledBookings) ? cancelledBookings.length : 0)
      });
    } catch (error) {
      console.error('Error loading status stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    onStatusChange(status);
  };

  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    // Only trigger change if both dates are set
    if (newDateRange.startDate && newDateRange.endDate) {
      onDateRangeChange(newDateRange);
    }
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'gray';
  };

  const getStatusIcon = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.icon : Filter;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center">
          <Filter className="w-5 h-5 mr-2 text-text-secondary" />
          Filter Bookings
        </h3>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Booking Status
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedStatus === option.value;
            const count = statusStats[option.value] || 0;
            
            return (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? `border-${option.color}-500 bg-${option.color}-50`
                    : 'border-border bg-white hover:border-border dark:border-slate-600'
                }`}
              >
                <div className="flex flex-col items-center">
                  <Icon className={`w-5 h-5 mb-1 ${
                    isSelected ? `text-${option.color}-600` : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isSelected ? `text-${option.color}-700` : 'text-gray-600'
                  }`}>
                    {option.label}
                  </span>
                  <span className={`text-xs ${
                    isSelected ? `text-${option.color}-600` : 'text-gray-500'
                  }`}>
                    ({count})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Date Range
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start date"
            />
          </div>
          <div>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End date"
            />
          </div>
        </div>
        {dateRange.startDate && dateRange.endDate && (
          <div className="mt-2 text-sm text-blue-600">
            Filtering bookings from {dateRange.startDate} to {dateRange.endDate}
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedBookingStatusFilter;
