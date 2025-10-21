import {
  Home, Calendar, Clock, UserCircle, Bed, ShoppingBag, TrendingUp,
  CreditCard, FileText, BarChart3, Users, Hotel, Settings, Layers,
  Shield, DollarSign, MessageSquare, Receipt, Moon, Star, Crown,
  Calculator, Building, Zap, Wrench, MessageSquare as MessageSquareIcon,
  Percent, PieChart, User, Lock, Cog, Key, ChartBar, ClipboardList,
  UserCheck, Globe, CreditCard as CreditCardIcon, FileSpreadsheet,
  Target, AlertTriangle, CheckCircle, Eye, Edit3, Trash2, Plus,
  CalendarDays, Sparkles, ClipboardCheck, DoorOpen, History
} from 'lucide-react';

export const Sidebar = ({ user, currentPage, onNavigate, isOpen }) => {
  // Organize menu items into sections for better navigation
  const menuSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: Home, description: 'Main overview' },
      ]
    },
    {
      title: 'Reservations',
      items: [
        { id: 'bookings', name: 'Bookings', icon: Calendar, description: 'Manage bookings' },
        { id: 'prebookings', name: 'Pre-Bookings', icon: Clock, description: 'Booking inquiries' },
        // REMOVED: Checkout - handled via modal from Bookings page
        // { id: 'checkout', name: 'Checkout', icon: DoorOpen, description: 'Guest checkout' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'rooms', name: 'Rooms', icon: Bed, description: 'Room management' },
        { id: 'room-availability', name: 'Availability', icon: CalendarDays, description: 'Room availability' },
        { id: 'housekeeping', name: 'Housekeeping', icon: Sparkles, description: 'Cleaning status' },
        { id: 'guests', name: 'Guests', icon: UserCircle, description: 'Guest profiles' },
      ]
    },
    {
      title: 'Services & Payments',
      items: [
        { id: 'services', name: 'Services', icon: ShoppingBag, description: 'Service catalog' },
        { id: 'serviceusage', name: 'Service Usage', icon: ClipboardCheck, description: 'Usage tracking' },
        { id: 'payments', name: 'Payments', icon: CreditCard, description: 'Payment records' },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { id: 'reports', name: 'Reports', icon: BarChart3, description: 'Business reports' },
      ]
    },
  ];

  // Admin-only section
  if (user?.role === 'Admin') {
    menuSections.push({
      title: 'Administration',
      items: [
        { id: 'users', name: 'User Management', icon: Users, description: 'Manage all users' },
        { id: 'roomtypes', name: 'Room Types', icon: Layers, description: 'Manage room types' },
        { id: 'branches', name: 'Branches', icon: Hotel, description: 'Branch management' },
        { id: 'auditlog', name: 'Audit Log', icon: History, description: 'System activity log' },
      ]
    });
  }

  // Staff-only section (Admin, Manager, Receptionist, Accountant)
  if (['Admin', 'Manager', 'Receptionist', 'Accountant'].includes(user?.role)) {
    // Check if audit log is not already in admin section
    const hasAuditLog = menuSections.some(section => 
      section.items.some(item => item.id === 'auditlog')
    );
    
    if (!hasAuditLog) {
      menuSections.push({
        title: 'Security & Compliance',
        items: [
          { id: 'auditlog', name: 'Audit Log', icon: History, description: 'System activity log' },
        ]
      });
    }
  }

  // Customer portal section
  if (user?.role === 'Customer') {
    menuSections.push({
      title: 'My Account',
      items: [
        { id: 'customer-portal', name: 'Customer Portal', icon: Globe, description: 'Your bookings' },
      ]
    });
  }

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-surface-secondary/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-border dark:border-slate-800 shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-0 -translate-x-full'
    }`}>
      <nav className="h-full overflow-y-auto py-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-6">
            {/* Section Header */}
            <div className="px-6 mb-2">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                {section.title}
              </h3>
            </div>

            {/* Section Items */}
            <div className="px-3 space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.description}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                      isActive 
                        ? 'bg-luxury-gold text-white shadow-md scale-[1.02]' 
                        : 'text-text-secondary dark:text-slate-300 hover:bg-surface-tertiary dark:hover:bg-slate-800 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Section Divider */}
            {sectionIndex < menuSections.length - 1 && (
              <div className="mx-6 mt-4 border-t border-border" />
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};
