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
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border bg-surface-primary/95 shadow-xl dark:bg-surface-secondary/95"
                  role="menu"
                  aria-label="User menu"
                  style={{ borderColor: controlBorder }}
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-white">{user?.username}</p>
                    <p className="text-xs text-slate-300">{user?.email ?? 'No email linked'}</p>
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

    </header>
  );
};
