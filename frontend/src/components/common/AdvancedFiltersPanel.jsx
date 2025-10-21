import React, { useState, useEffect, useMemo } from 'react';
import { Filter, X, Calendar, Building2, Bed, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import SearchableDropdown from './SearchableDropdown';

const AdvancedFiltersPanel = ({ 
  onApplyFilters, 
  onClearFilters,
  branches = [],
  roomTypes = [],
  bookingStatuses = [],
  showBranchFilter = true,
  showRoomTypeFilter = true,
  showStatusFilter = true,
  showDateFilter = true,
  showGuestTypeFilter = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    branch: 'all',
    roomType: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    guestType: 'all',
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const branchOptions = useMemo(() => {
    const safeBranches = Array.isArray(branches) ? branches : [];
    const mapped = safeBranches.map((branch) => ({
      id: branch?.branch_id ? String(branch.branch_id) : branch?.value ?? '',
      name: branch?.branch_name ?? branch?.label ?? 'Branch',
    }));
    return [
      { id: 'all', name: 'All Branches' },
      ...mapped.filter((option) => option.id),
    ];
  }, [branches]);

  const roomTypeOptions = useMemo(() => {
    const safeRoomTypes = Array.isArray(roomTypes) ? roomTypes : [];
    const mapped = safeRoomTypes.map((type) => ({
      id: typeof type === 'object' ? String(type.id ?? type.value ?? type.name ?? '') : String(type),
      name: typeof type === 'object' ? type.name ?? type.label ?? String(type.id ?? '') : String(type),
    }));
    return [
      { id: 'all', name: 'All Room Types' },
      ...mapped.filter((option) => option.name && option.id),
    ];
  }, [roomTypes]);

  const statusOptions = useMemo(() => {
    const defaults = [
      { id: 'Pre-Booked', name: 'Pre-Booked' },
      { id: 'Checked-In', name: 'Checked-In' },
      { id: 'Checked-Out', name: 'Checked-Out' },
      { id: 'Cancelled', name: 'Cancelled' },
      { id: 'No-Show', name: 'No-Show' },
    ];

    if (!Array.isArray(bookingStatuses) || bookingStatuses.length === 0) {
      return [{ id: 'all', name: 'All Statuses' }, ...defaults];
    }

    const mapped = bookingStatuses.map((status) => ({
      id: typeof status === 'object' ? status.id ?? status.value ?? status.name ?? '' : status,
      name: typeof status === 'object' ? status.name ?? status.label ?? String(status.id ?? '') : status,
    }));

    return [{ id: 'all', name: 'All Statuses' }, ...mapped.filter((option) => option.name && option.id)];
  }, [bookingStatuses]);

  const guestTypeOptions = useMemo(
    () => [
      { id: 'all', name: 'All Guests' },
      { id: 'individual', name: 'Individual' },
      { id: 'corporate', name: 'Corporate' },
      { id: 'vip', name: 'VIP' },
      { id: 'group', name: 'Group' },
    ],
    [],
  );

  useEffect(() => {
    // Count active filters
    const count = Object.values(filters).filter(
      value => value && value !== 'all' && value !== ''
    ).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    const clearedFilters = {
      branch: 'all',
      roomType: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      guestType: 'all',
    };
    setFilters(clearedFilters);
    
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-luxury-navy to-indigo-900 text-white rounded-xl hover:shadow-lg transition-all duration-300 group"
      >
        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg group-hover:bg-white/30 transition-all">
          <Filter className="w-5 h-5" />
        </div>
        <span className="font-semibold">Advanced Filters</span>
        {activeFiltersCount > 0 && (
          <span className="ml-1 px-3 py-1 bg-luxury-gold text-white text-sm font-bold rounded-full animate-pulse">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-surface-secondary rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
            <div className="bg-gradient-to-r from-luxury-navy to-indigo-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Advanced Filters</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Branch Filter */}
              {showBranchFilter && (
                <div className="bg-surface-tertiary p-4 rounded-xl border border-border">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
                    <div className="p-2 bg-luxury-navy rounded-lg">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    Branch Location
                  </label>
                  <SearchableDropdown
                    value={filters.branch}
                    onChange={(value) => handleFilterChange('branch', value || 'all')}
                    options={branchOptions}
                    placeholder="All Branches"
                    className="w-full"
                    hideSearch={branchOptions.length <= 6}
                    clearable={false}
                  />
                </div>
              )}

              {/* Room Type Filter */}
              {showRoomTypeFilter && (
                <div className="bg-surface-tertiary p-4 rounded-xl border border-border">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Bed className="w-4 h-4 text-white" />
                    </div>
                    Room Type
                  </label>
                  <SearchableDropdown
                    value={filters.roomType}
                    onChange={(value) => handleFilterChange('roomType', value || 'all')}
                    options={roomTypeOptions}
                    placeholder="All Room Types"
                    className="w-full"
                    hideSearch={roomTypeOptions.length <= 6}
                    clearable={false}
                  />
                </div>
              )}

              {/* Booking Status Filter */}
              {showStatusFilter && (
                <div className="bg-surface-tertiary p-4 rounded-xl border border-border">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    Booking Status
                  </label>
                  <SearchableDropdown
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value || 'all')}
                    options={statusOptions}
                    placeholder="All Statuses"
                    className="w-full"
                    hideSearch={statusOptions.length <= 6}
                    clearable={false}
                  />
                </div>
              )}

              {/* Date Range Filter */}
              {showDateFilter && (
                <div className="bg-surface-tertiary p-4 rounded-xl border border-border">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary mb-2 block">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        max={filters.endDate || undefined}
                        className="w-full px-3 py-2 border-2 border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary mb-2 block">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        min={filters.startDate || undefined}
                        className="w-full px-3 py-2 border-2 border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Type Filter */}
              {showGuestTypeFilter && (
                <div className="bg-surface-tertiary p-4 rounded-xl border border-border">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    Guest Type
                  </label>
                  <SearchableDropdown
                    value={filters.guestType}
                    onChange={(value) => handleFilterChange('guestType', value || 'all')}
                    options={guestTypeOptions}
                    hideSearch
                    clearable={false}
                    placeholder="All Guests"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 border-t border-border pt-6">
              <button
                onClick={handleClear}
                className="flex-1 px-6 py-3 border-2 border-border dark:border-slate-600 rounded-xl hover:bg-surface-tertiary transition-all text-text-secondary font-semibold hover:border-gray-400"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-luxury-gold to-yellow-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
              >
                Apply Filters
              </button>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-tertiary mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.branch !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded">
                      Branch: {branches.find(b => b.branch_id == filters.branch)?.branch_name || filters.branch}
                    </span>
                  )}
                  {filters.roomType !== 'all' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded">
                      Room: {filters.roomType}
                    </span>
                  )}
                  {filters.status !== 'all' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded">
                      Status: {filters.status}
                    </span>
                  )}
                  {filters.startDate && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-xs rounded">
                      From: {format(new Date(filters.startDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {filters.endDate && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 text-xs rounded">
                      To: {format(new Date(filters.endDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {filters.guestType !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                      Guest: {filters.guestType}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedFiltersPanel;
