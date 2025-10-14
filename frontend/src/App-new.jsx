import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Home, Calendar, Clock, UserCircle, Bed, ShoppingBag, TrendingUp,
  CreditCard, FileText, BarChart3, Users, Hotel, Settings,
  Menu, Bell, LogOut
} from 'lucide-react';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import { LoginPage } from './components/auth';
import { Dashboard } from './components/dashboard';
import { BookingsPage } from './components/bookings';
import { RoomsPage } from './components/rooms';
import { ServicesPage } from './components/services';
import { PaymentsPage } from './components/payments';
import { ReportsPage } from './components/reports';
import { UsersPage } from './components/users';

// Import original components still in App.jsx (temporary)
// These will be extracted in future phases
const PreBookingsPage = () => <div className="card"><p>Pre-Bookings Page (To be extracted)</p></div>;
const GuestsPage = () => <div className="card"><p>Guests Page (To be extracted)</p></div>;
const ServiceUsagePage = () => <div className="card"><p>Service Usage Page (To be extracted)</p></div>;
const InvoicesPage = () => <div className="card"><p>Invoices Page (To be extracted)</p></div>;
const BranchesPage = () => <div className="card"><p>Branches Page (To be extracted)</p></div>;
const AuditLogPage = () => <div className="card"><p>Audit Log Page (To be extracted)</p></div>;

// Layout Components
const Header = ({ user, onLogout, onToggleSidebar }) => {
  return (
    <nav className="luxury-gradient text-white shadow-lg fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={onToggleSidebar}
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
                <div className="font-medium">{user?.username}</div>
                <div className="text-xs text-blue-100">{user?.role}</div>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = ({ user, currentPage, onNavigate, isOpen }) => {
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

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-0 -translate-x-full'
    }`}>
      <nav className="p-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
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
  );
};

// Main App Component
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get auth context
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  const [isAuthenticated, setIsAuthenticated] = useState(!!savedToken);
  const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);

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

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <Sidebar 
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
      />

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

const App = () => {
  return <AppContent />;
};

// Render
const root = createRoot(document.getElementById('root'));
root.render(<App />);
