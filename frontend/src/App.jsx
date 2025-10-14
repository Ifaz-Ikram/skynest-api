import { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Layout Components
import { Header, Sidebar } from './components/layout';

// Pages
import { LoginPage } from './components/auth';
import { Dashboard } from './components/dashboard';
import { BookingsPage } from './components/bookings';
import { RoomsPage } from './components/rooms';
import { ServicesPage } from './components/services';
import { PaymentsPage } from './components/payments';
import { ReportsPage } from './components/reports';
import { UsersPage } from './components/users';
import { GuestsPage } from './components/guests';
import { PreBookingsPage } from './components/prebookings';
import { ServiceUsagePage } from './components/serviceusage';
import { InvoicesPage } from './components/invoices';
import { BranchesPage } from './components/branches';
import { AuditLogPage } from './components/auditlog';

/**
 * Main App Component
 * 
 * This is the simplified, professional App.jsx following MedSync structure.
 * - Clean component imports
 * - Separated layout components (Header, Sidebar)
 * - Page routing logic
 * - Authentication handling
 */
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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <Header 
        user={user} 
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Collapsible Sidebar */}
      <Sidebar 
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
      />

      {/* Main Content Area */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6 sm:p-8 max-w-7xl mx-auto">
          {/* Page Routing */}
          {currentPage === 'dashboard' && <Dashboard user={user} />}
          {currentPage === 'bookings' && <BookingsPage />}
          {currentPage === 'rooms' && <RoomsPage />}
          {currentPage === 'services' && <ServicesPage />}
          {currentPage === 'payments' && <PaymentsPage />}
          {currentPage === 'reports' && <ReportsPage />}
          
          {/* Admin/Manager Pages */}
          {currentPage === 'users' && (user?.role === 'Admin' || user?.role === 'Manager') && <UsersPage />}
          
          {/* Admin Only Pages */}
          {currentPage === 'branches' && user?.role === 'Admin' && <BranchesPage />}
          {currentPage === 'auditlog' && user?.role === 'Admin' && <AuditLogPage />}
          
          {/* Pages to be extracted */}
          {currentPage === 'prebookings' && <PreBookingsPage />}
          {currentPage === 'guests' && <GuestsPage />}
          {currentPage === 'serviceusage' && <ServiceUsagePage />}
          {currentPage === 'invoices' && <InvoicesPage />}
        </div>
      </main>
    </div>
  );
};

export default App;
