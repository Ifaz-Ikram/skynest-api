import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Hotel, LogOut } from 'lucide-react';
import { ThemeToggle } from '../common';
import { useTheme } from '../../context/ThemeContext';

export const Header = ({
  user,
  onLogout,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { theme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const isDark = theme === 'dark';
  const containerBackground = isDark
    ? 'linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
    : 'linear-gradient(90deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)';
  const controlBackground = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';
  const controlBorder = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)';
  const accentBackground = isDark ? 'rgba(253, 184, 19, 0.18)' : 'rgba(212, 175, 55, 0.18)';
  const avatarBackground = 'transparent';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 border-b border-border" role="banner" style={{ zIndex: 'var(--z-header)' }}>
      <div
        className="backdrop-blur-xl transition-colors duration-300"
        style={{ background: containerBackground }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border text-white transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
              style={{
                backgroundColor: controlBackground,
                borderColor: controlBorder,
              }}
            >
              <span className="sr-only">Toggle sidebar</span>
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span
                  className={`absolute block h-0.5 w-5 rounded-full bg-white transition-transform duration-200 ${
                    isSidebarOpen ? 'translate-y-0 rotate-45' : '-translate-y-1.5 rotate-0'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`absolute block h-0.5 w-5 rounded-full bg-white transition-opacity duration-200 ${
                    isSidebarOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`absolute block h-0.5 w-5 rounded-full bg-white transition-transform duration-200 ${
                    isSidebarOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1.5 rotate-0'
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: accentBackground,
                  borderColor: controlBorder,
                }}
              >
                <Hotel className="h-5 w-5 text-accent-primary" strokeWidth={1.4} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white sm:text-base">SkyNest Command</p>
                <p className="text-xs text-slate-200">Luxury Hospitality Console</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border pl-2 pr-3 text-white transition-all duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
                style={{
                  backgroundColor: controlBackground,
                  borderColor: controlBorder,
                }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{
                    backgroundColor: avatarBackground,
                    border: 'none',
                  }}
                >
                  {user?.username?.slice(0, 1)?.toUpperCase() ?? 'U'}
                </span>
                <span className="hidden flex-col text-left sm:flex">
                  <span className="text-sm font-semibold leading-tight text-white">
                    {user?.username}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {user?.role ?? 'Guest'}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-1/2 transform translate-x-1/2 mt-2 w-56 overflow-hidden rounded-xl shadow-xl backdrop-blur-xl"
                  role="menu"
                  aria-label="User menu"
                  style={{ 
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
                    border: isDark 
                      ? '1px solid rgba(148, 163, 184, 0.2)' 
                      : '1px solid rgba(148, 163, 184, 0.3)',
                    boxShadow: isDark 
                      ? '0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                      : '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {/* User Info Section */}
                  <div className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold text-white shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                        }}
                      >
                        {user?.username?.slice(0, 1)?.toUpperCase() ?? 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                        <p className="text-xs text-slate-300 truncate">{user?.email ?? 'No email linked'}</p>
                        <div className="mt-1">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                          >
                            {user?.role ?? 'Guest'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div 
                    className="mx-4 h-px"
                    style={{
                      background: isDark 
                        ? 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.3) 50%, transparent 100%)'
                        : 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.2) 50%, transparent 100%)'
                    }}
                  ></div>

                  {/* Action Section */}
                  <div className="px-4 py-3">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500/50"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171'
                      }}
                    >
                      <div 
                        className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-200 group-hover:bg-red-500/20"
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <LogOut className="h-3 w-3" />
                      </div>
                      <span>Sign Out</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </header>
  );
};
