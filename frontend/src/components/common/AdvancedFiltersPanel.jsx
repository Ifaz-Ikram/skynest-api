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
        className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 group font-medium"
      >
        <Filter className="w-5 h-5" />
        <span>Advanced Filters</span>
        {activeFiltersCount > 0 && (
          <span className="px-2.5 py-0.5 bg-white/30 text-white text-sm font-bold rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-overlay)' }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel - Glassmorphism Design */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              zIndex: 1100,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
            }}
          >
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Filter className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Advanced Filters</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-105"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[28rem] overflow-y-auto">
              {/* Branch Filter */}
              {showBranchFilter && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-600/30 backdrop-blur-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-slate-200">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      <Building2 className="w-4 h-4 text-slate-300" />
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
                <div className="p-4 rounded-xl bg-blue-900/50 border border-blue-600/30 backdrop-blur-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-blue-100">
                    <div className="p-2 bg-blue-700 rounded-lg">
                      <Bed className="w-4 h-4 text-blue-200" />
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
                <div className="p-4 rounded-xl bg-green-900/50 border border-green-600/30 backdrop-blur-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-green-100">
                    <div className="p-2 bg-green-700 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-200" />
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
                <div className="p-4 rounded-xl bg-purple-900/50 border border-purple-600/30 backdrop-blur-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-purple-100">
                    <div className="p-2 bg-purple-700 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-200" />
                    </div>
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-2 block text-purple-200">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        max={filters.endDate || undefined}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-2 block text-purple-200">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        min={filters.startDate || undefined}
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Type Filter */}
              {showGuestTypeFilter && (
                <div className="p-4 rounded-xl bg-orange-900/50 border border-orange-600/30 backdrop-blur-sm">
                  <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-orange-100">
                    <div className="p-2 bg-orange-700 rounded-lg">
                      <Users className="w-4 h-4 text-orange-200" />
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
            <div className="p-5 pt-0 mt-0">
              <div className="flex gap-3">
                <button
                  onClick={handleClear}
                  className="flex-1 px-5 py-2.5 border-2 border-slate-600/60 bg-slate-800/40 rounded-xl hover:bg-slate-700/60 transition-all text-slate-200 font-semibold hover:border-slate-500"
                >
                  Clear All
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all font-bold hover:from-yellow-600 hover:to-amber-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="pt-4 mt-4 border-t border-border">
                <p className="text-xs text-muted mb-2 font-medium">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.branch !== 'all' && (
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full font-medium">
                      Branch: {branches.find(b => b.branch_id == filters.branch)?.branch_name || filters.branch}
                    </span>
                  )}
                  {filters.roomType !== 'all' && (
                    <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full font-medium">
                      Room: {filters.roomType}
                    </span>
                  )}
                  {filters.status !== 'all' && (
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded-full font-medium">
                      Status: {filters.status}
                    </span>
                  )}
                  {filters.startDate && (
                    <span className="px-3 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full font-medium">
                      From: {format(new Date(filters.startDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {filters.endDate && (
                    <span className="px-3 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full font-medium">
                      To: {format(new Date(filters.endDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {filters.guestType !== 'all' && (
                    <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded-full font-medium">
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
