import {
  Home, Calendar, Clock, UserCircle, Bed, ShoppingBag, TrendingUp,
  CreditCard, FileText, BarChart3, Users, Hotel, Settings
} from 'lucide-react';

export const Sidebar = ({ user, currentPage, onNavigate, isOpen }) => {
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
