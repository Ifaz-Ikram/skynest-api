import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Hotel,
  LogOut,
  Menu,
  Settings,
  User,
} from 'lucide-react';
import { ThemeToggle } from '../common';
import { useTheme } from '../../context/ThemeContext';

const breadcrumbLookup = {
  dashboard: 'Dashboard Overview',
  bookings: 'Bookings',
  'room-availability': 'Room Availability',
  rooms: 'Rooms',
  services: 'Services',
  payments: 'Payments',
  serviceusage: 'Service Usage',
  housekeeping: 'Housekeeping',
  guests: 'Guests',
  reports: 'Reports',
  'reports-dashboard': 'Reporting Dashboard',
  'reports-old': 'Legacy Reports',
  auditlog: 'Audit Log',
  users: 'User Management',
  roomtypes: 'Room Types',
  branches: 'Branches',
  prebookings: 'Pre-Bookings',
  'customer-portal': 'Customer Portal',
};

export const Header = ({
  user,
  onLogout,
  onToggleSidebar,
  currentPage,
  onNavigate,
  isSidebarOpen,
}) => {
  const { theme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  const notifications = useMemo(
    () => [
      {
        id: 1,
        title: 'New booking confirmed',
        message: 'Deluxe Suite | Jul 21 - Jul 24',
        time: '5m ago',
        icon: CalendarDays,
      },
      {
        id: 2,
        title: 'Payment received',
        message: 'INV-2045 | LKR 120,000',
        time: '12m ago',
        icon: Settings,
      },
      {
        id: 3,
        title: 'Housekeeping alert',
        message: 'Suite 804 requires inspection',
        time: '24m ago',
        icon: User,
      },
    ],
    [],
  );

  const unreadCount = notifications.length;
  const breadcrumbLabel = breadcrumbLookup[currentPage] ?? 'Dashboard Overview';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border" role="banner">
      <div
        className="bg-surface-primary backdrop-blur-xl transition-colors duration-300"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.82)',
        }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-primary shadow-sm transition-all duration-200 hover:shadow-md dark:bg-surface-secondary"
            >
              <span className="sr-only">Toggle sidebar</span>
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span
                  className={`absolute block h-0.5 w-5 rounded-full bg-text-primary transition-transform duration-200 ${
                    isSidebarOpen ? 'translate-y-0 rotate-45' : '-translate-y-1.5 rotate-0'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`absolute block h-0.5 w-5 rounded-full bg-text-primary transition-opacity duration-200 ${
                    isSidebarOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`absolute block h-0.5 w-5 rounded-full bg-text-primary transition-transform duration-200 ${
                    isSidebarOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1.5 rotate-0'
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-md">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor:
                      theme === 'dark' ? 'rgba(253, 184, 19, 0.1)' : 'rgba(212, 175, 55, 0.12)',
                  }}
                >
                  <Hotel className="h-5 w-5 text-accent-primary" strokeWidth={1.4} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary sm:text-base">SkyNest Command</p>
                <p className="text-xs text-text-secondary">Luxury Hospitality Console</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-primary shadow-sm transition-all duration-200 hover:shadow-md dark:bg-surface-secondary"
              >
                <Bell className="h-5 w-5 text-text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-5 min-w-[1.15rem] rounded-full bg-accent-secondary px-1 text-[10px] font-semibold leading-5 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-surface-primary shadow-xl dark:bg-surface-secondary"
                  role="menu"
                  aria-label="Notifications"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-text-primary">Notifications</p>
                    <p className="text-xs text-text-secondary">
                      You have {unreadCount} new updates
                    </p>
                  </div>
                  <div className="max-h-80 divide-y divide-border overflow-y-auto">
                    {notifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <button
                          key={notification.id}
                          type="button"
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-secondary"
                        >
                          <span
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                            style={{
                              backgroundColor:
                                theme === 'dark'
                                  ? 'rgba(96, 165, 250, 0.12)'
                                  : 'rgba(59, 130, 246, 0.12)',
                            }}
                          >
                            <Icon className="h-4 w-4 text-accent-secondary" />
                          </span>
                          <span className="flex flex-1 flex-col gap-1">
                            <span className="text-sm font-medium text-text-primary">
                              {notification.title}
                            </span>
                            <span className="text-xs text-text-secondary">
                              {notification.message}
                            </span>
                          </span>
                          <span className="text-xs text-text-tertiary">{notification.time}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-border px-4 py-2">
                    <button
                      type="button"
                      className="w-full rounded-md bg-surface-secondary px-3 py-2 text-sm font-medium text-text-primary transition-all duration-150 hover:bg-surface-tertiary dark:bg-surface-tertiary"
                    >
                      View all alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-border bg-surface-primary pl-2 pr-3 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-surface-secondary"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-accent-primary"
                  style={{
                    backgroundColor:
                      theme === 'dark' ? 'rgba(253, 184, 19, 0.14)' : 'rgba(212, 175, 55, 0.16)',
                  }}
                >
                  {user?.username?.slice(0, 1)?.toUpperCase() ?? 'U'}
                </span>
                <span className="hidden flex-col text-left sm:flex">
                  <span className="text-sm font-semibold leading-tight text-text-primary">
                    {user?.username}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    {user?.role ?? 'Guest'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface-primary shadow-xl dark:bg-surface-secondary"
                  role="menu"
                  aria-label="User menu"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-text-primary">{user?.username}</p>
                    <p className="text-xs text-text-secondary">{user?.email ?? 'No email linked'}</p>
                  </div>
                  <div className="flex flex-col py-2">
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary transition-colors duration-150 hover:bg-surface-secondary"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate?.('users');
                      }}
                    >
                      <User className="h-4 w-4 text-text-tertiary" />
                      Profile
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary transition-colors duration-150 hover:bg-surface-secondary"
                    >
                      <Settings className="h-4 w-4 text-text-tertiary" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-border bg-surface-secondary px-4 py-2 dark:bg-surface-tertiary">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--error)]"
                      style={{
                        backgroundColor:
                          theme === 'dark' ? 'rgba(248, 113, 113, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: 'var(--error)',
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="border-t border-border"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.82)' : 'rgba(249, 250, 251, 0.9)',
        }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <nav aria-label="Current page" className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
            <button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              className="flex items-center gap-1 text-xs font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              Overview
            </button>
            <ChevronRight className="h-3 w-3 text-text-tertiary" aria-hidden="true" />
            <span className="text-xs font-medium text-text-primary">{breadcrumbLabel}</span>
          </nav>
          <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {user?.role ?? 'Guest'} Workspace
          </span>
        </div>
      </div>
    </header>
  );
};
