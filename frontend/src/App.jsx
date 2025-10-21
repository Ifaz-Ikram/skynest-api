import { useState } from 'react';

// Layout Components
import { Header, Sidebar } from './components/layout';

// Pages
import { LoginPage } from './components/auth';
import { Dashboard } from './components/dashboard';
import { BookingsPage } from './components/bookings';
import { RoomsPage } from './components/rooms';
import { ServicesPage } from './components/services';
import { PaymentsPage } from './components/payments';
import { ReportsPage, ReportsPageEnhanced } from './components/reports';
import UserManagementPage from './components/users/UserManagementPage';
import { GuestsPage } from './components/guests';
import { PreBookingsPage } from './components/prebookings';
import { ServiceUsagePage } from './components/serviceusage';
import { BranchesPage } from './components/branches';
import AuditLogPage from './components/auditlog/AuditLogPage';
import RoomTypesPage from './components/roomtypes/RoomTypesPage';
import ReportingDashboard from './components/reports/ReportingDashboard';
import CustomerPortal from './components/customer/CustomerPortal';
import ServiceUsageManagement from './components/services/ServiceUsageManagement';
import HousekeepingPage from './components/housekeeping/HousekeepingPage';
import RoomAvailabilityPage from './components/availability/RoomAvailabilityPage';

const App = () => {
  // State management
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Auth state from localStorage
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  const [isAuthenticated, setIsAuthenticated] = useState(!!savedToken);
  const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);

  // Auth handlers
  const handleLogin = () => {
    const newUser = localStorage.getItem('user');
    setUser(JSON.parse(newUser));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('dashboard');
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Main authenticated app layout
  return (
    <div className="dark min-h-screen bg-surface-secondary text-text-primary transition-colors duration-300">
      <Header
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <Sidebar
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
      />

      <main
        className={`pt-24 transition-[margin] duration-300 ease-smooth ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={setCurrentPage} />}
          {currentPage === 'bookings' && <BookingsPage />}
          {currentPage === 'rooms' && <RoomsPage />}
          {currentPage === 'room-availability' && <RoomAvailabilityPage />}
          {currentPage === 'services' && <ServicesPage />}
          {currentPage === 'payments' && <PaymentsPage />}
          {currentPage === 'reports' && <ReportsPageEnhanced />}
          {currentPage === 'serviceusage' && <ServiceUsageManagement />}
          {currentPage === 'housekeeping' && <HousekeepingPage />}
          {currentPage === 'guests' && <GuestsPage />}
          {currentPage === 'reports-old' && <ReportsPage />}
          {currentPage === 'reports-dashboard' && <ReportingDashboard />}
          {currentPage === 'auditlog' && <AuditLogPage />}
          {currentPage === 'customer-portal' && user?.role === 'Customer' && <CustomerPortal />}
          {currentPage === 'users' && (user?.role === 'Admin' || user?.role === 'Manager') && (
            <UserManagementPage />
          )}
          {currentPage === 'roomtypes' && (user?.role === 'Admin' || user?.role === 'Manager') && (
            <RoomTypesPage />
          )}
          {currentPage === 'branches' && user?.role === 'Admin' && <BranchesPage />}
          {currentPage === 'prebookings' && <PreBookingsPage />}
        </div>
      </main>
    </div>
  );
};

export default App;
