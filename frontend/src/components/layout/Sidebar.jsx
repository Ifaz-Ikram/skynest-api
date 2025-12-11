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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-[var(--z-overlay)]"
          onClick={() => onNavigate && onNavigate(currentPage)} // Close sidebar on overlay click
          style={{ top: '4rem' }}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] backdrop-blur-sm shadow-lg transition-all duration-300 ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:w-0'
        } lg:translate-x-0`} 
        style={{ 
          zIndex: 'var(--z-sidebar)',
          background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
          borderRight: '1px solid #e0e0e0',
        }}
      >
      <nav className="h-full overflow-y-auto py-4 px-3">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-5">
            {/* Section Header */}
            <div className="px-3 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6c757d' }}>
                {section.title}
              </h3>
            </div>

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.description}
                    className="dropdown-option-button w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group sidebar-menu-item"
                    style={{
                      background: isActive 
                        ? 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' 
                        : 'transparent',
                      fontWeight: isActive ? '600' : '500',
                      boxShadow: isActive ? '0 4px 12px rgba(26, 35, 126, 0.3)' : 'none',
                      transform: 'translateX(0)',
                    }}
                    ref={(el) => {
                      if (el) {
                        // Force reset styles when not active
                        if (!isActive) {
                          el.style.setProperty('background', 'transparent', 'important');
                          el.style.fontWeight = '500';
                          el.style.boxShadow = 'none';
                          el.style.transform = 'translateX(0)';
                        } else {
                          el.style.setProperty('background', 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', 'important');
                        }
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.setProperty('background', 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 'important');
                        e.currentTarget.style.fontWeight = '600';
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(26, 35, 126, 0.15)';
                        // Update icon and text colors
                        const icon = e.currentTarget.querySelector('svg');
                        const text = e.currentTarget.querySelector('span');
                        if (icon) icon.style.color = '#1a237e';
                        if (text) text.style.color = '#1a237e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.setProperty('background', 'transparent', 'important');
                        e.currentTarget.style.fontWeight = '500';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        // Reset icon and text colors
                        const icon = e.currentTarget.querySelector('svg');
                        const text = e.currentTarget.querySelector('span');
                        if (icon) icon.style.color = '#495057';
                        if (text) text.style.color = '#495057';
                      }
                    }}
                  >
                    <Icon 
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'active-sidebar-icon' : 'inactive-sidebar-icon'}`}
                      ref={(el) => {
                        if (el) {
                          if (isActive) {
                            el.style.color = '#ffffff';
                            el.style.stroke = '#ffffff';
                          } else {
                            el.style.color = '#495057';
                            el.style.stroke = '#495057';
                          }
                        }
                      }}
                    />
                    <span 
                      className={`text-sm ${isActive ? 'active-sidebar-text' : 'inactive-sidebar-text'}`}
                      ref={(el) => {
                        if (el) {
                          if (isActive) {
                            el.style.color = '#ffffff';
                          } else {
                            el.style.color = '#495057';
                          }
                        }
                      }}
                    >
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Section Divider */}
            {sectionIndex < menuSections.length - 1 && (
              <div className="mx-3 mt-4" style={{ borderTop: '1px solid #e9ecef' }} />
            )}
          </div>
        ))}
      </nav>
    </aside>
    </>
  );
};
