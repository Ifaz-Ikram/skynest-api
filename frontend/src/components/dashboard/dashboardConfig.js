// Dashboard Configuration by Role
// Defines what each role can see and access on their dashboard

export const DASHBOARD_CONFIG = {
  Admin: {
    title: 'Admin Dashboard',
    subtitle: 'Complete System Overview & Management',
    sections: {
      stats: true,
      operations: true,
      financials: true,
      analytics: true,
      recentBookings: true,
      recentActivity: true,
      auditLog: true,
      alerts: true,
      charts: true,
      branchComparison: true,
    },
    quickActions: [
      { id: 'new-booking', label: 'New Booking', icon: 'Calendar', navigate: 'bookings' },
      { id: 'view-reports', label: 'View Reports', icon: 'BarChart3', navigate: 'reports' },
      { id: 'manage-users', label: 'Manage Users', icon: 'Users', navigate: 'users' },
      { id: 'audit-log', label: 'Audit Log', icon: 'History', navigate: 'auditlog' },
    ],
    statsToShow: ['totalBookings', 'activeBookings', 'revenue', 'occupancyRate', 'totalGuests', 'totalRooms', 'availableRooms', 'pendingCheckIns'],
    filterByBranch: false,
    showAllBranches: true,
  },
  
  Manager: {
    title: 'Manager Dashboard',
    subtitle: 'Branch Operations & Performance',
    sections: {
      stats: true,
      operations: true,
      financials: true,
      analytics: true,
      recentBookings: true,
      recentActivity: true,
      auditLog: true,
      alerts: true,
      charts: true,
      branchComparison: false,
    },
    quickActions: [
      { id: 'new-booking', label: 'New Booking', icon: 'Calendar', navigate: 'bookings' },
      { id: 'view-reports', label: 'View Reports', icon: 'BarChart3', navigate: 'reports' },
      { id: 'housekeeping', label: 'Housekeeping', icon: 'Sparkles', navigate: 'housekeeping' },
      { id: 'team-activity', label: 'Team Activity', icon: 'Users', navigate: 'auditlog' },
    ],
    statsToShow: ['totalBookings', 'activeBookings', 'revenue', 'occupancyRate', 'totalGuests', 'availableRooms', 'pendingCheckIns'],
    filterByBranch: true,
    showAllBranches: false,
  },
  
  Receptionist: {
    title: 'Front Desk Dashboard',
    subtitle: "Today's Operations & Guest Services",
    sections: {
      stats: false,
      operations: true,
      financials: false,
      analytics: false,
      recentBookings: true,
      recentActivity: false,
      auditLog: false,
      alerts: true,
      charts: false,
      branchComparison: false,
    },
    quickActions: [
      { id: 'new-booking', label: 'New Booking', icon: 'Calendar', navigate: 'bookings' },
      { id: 'check-in', label: 'Check-In Guest', icon: 'LogIn', navigate: 'bookings' },
      { id: 'check-out', label: 'Check-Out Guest', icon: 'LogOut', navigate: 'bookings' },
      { id: 'view-rooms', label: 'Room Status', icon: 'Bed', navigate: 'rooms' },
    ],
    statsToShow: ['pendingCheckIns', 'activeBookings', 'availableRooms', 'totalGuests'],
    filterByBranch: true,
    showAllBranches: false,
    emphasizeOperations: true,
  },
  
  Accountant: {
    title: 'Financial Dashboard',
    subtitle: 'Revenue, Payments & Billing Overview',
    sections: {
      stats: false,
      operations: false,
      financials: true,
      analytics: true,
      recentBookings: false,
      recentActivity: false,
      auditLog: false,
      alerts: true,
      charts: true,
      branchComparison: false,
    },
    quickActions: [
      { id: 'record-payment', label: 'Record Payment', icon: 'CreditCard', navigate: 'payments' },
      { id: 'view-reports', label: 'Financial Reports', icon: 'FileText', navigate: 'reports' },
      { id: 'billing', label: 'Billing Summary', icon: 'Receipt', navigate: 'reports' },
      { id: 'outstanding', label: 'Outstanding Payments', icon: 'AlertCircle', navigate: 'payments' },
    ],
    statsToShow: ['revenue', 'totalBookings', 'activeBookings'],
    filterByBranch: false,
    showAllBranches: true,
    emphasizeFinancials: true,
  },
  
  Customer: {
    title: 'My Bookings',
    subtitle: 'Welcome to SkyNest Hotel',
    sections: {
      stats: false,
      operations: false,
      financials: false,
      analytics: false,
      recentBookings: false,
      recentActivity: false,
      auditLog: false,
      alerts: false,
      charts: false,
      branchComparison: false,
      customerBookings: true,
    },
    quickActions: [
      { id: 'new-booking', label: 'Make Reservation', icon: 'Calendar', navigate: 'customer-portal' },
      { id: 'my-bookings', label: 'My Bookings', icon: 'Home', navigate: 'customer-portal' },
      { id: 'my-profile', label: 'My Profile', icon: 'User', navigate: 'customer-portal' },
    ],
    statsToShow: [],
    filterByCustomer: true,
    showOnlyOwnData: true,
  },
};

// Helper function to get config for a specific role
export const getDashboardConfig = (role) => {
  return DASHBOARD_CONFIG[role] || DASHBOARD_CONFIG.Customer;
};

// Helper to check if a section should be displayed
export const shouldShowSection = (role, sectionName) => {
  const config = getDashboardConfig(role);
  return config.sections[sectionName] === true;
};

// Helper to get stats to display for a role
export const getStatsForRole = (role, allStats) => {
  const config = getDashboardConfig(role);
  const statsToShow = config.statsToShow || [];
  
  return statsToShow.reduce((acc, statKey) => {
    if (allStats[statKey] !== undefined) {
      acc[statKey] = allStats[statKey];
    }
    return acc;
  }, {});
};