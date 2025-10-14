import { Menu, Bell, LogOut, Hotel } from 'lucide-react';

export const Header = ({ user, onLogout, onToggleSidebar }) => {
  return (
    <nav className="luxury-gradient text-white shadow-lg fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors mr-4"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Hotel className="w-8 h-8 text-luxury-gold mr-3" />
            <span className="text-xl font-display font-bold">SkyNest Hotel</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
              aria-label="Notifications"
            >
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
                aria-label="Logout"
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
