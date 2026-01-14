import React from 'react';
import { Calendar, BarChart3, Users, History, LogIn, LogOut, Bed, CreditCard, FileText, Receipt, AlertCircle, Home, User, Sparkles } from 'lucide-react';

const iconMap = {
  Calendar,
  BarChart3,
  Users,
  History,
  LogIn,
  LogOut,
  Bed,
  CreditCard,
  FileText,
  Receipt,
  AlertCircle,
  Home,
  User,
  Sparkles,
};

export const QuickActions = ({ actions, onNavigate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1a237e' }}>
        <Sparkles className="w-5 h-5" style={{ color: '#0d47a1' }} />
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || Calendar;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.navigate)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 group"
              style={{
                background: 'white',
                border: '2px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)';
                e.currentTarget.style.borderColor = '#1a237e';
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(26, 35, 126, 0.3)';
                const icon = e.currentTarget.querySelector('.icon-container');
                const text = e.currentTarget.querySelector('.action-text');
                if (icon) {
                  icon.style.background = 'rgba(255, 255, 255, 0.2)';
                  icon.style.transform = 'scale(1.1) rotate(5deg)';
                }
                if (text) text.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                const icon = e.currentTarget.querySelector('.icon-container');
                const text = e.currentTarget.querySelector('.action-text');
                if (icon) {
                  icon.style.background = '#e3f2fd';
                  icon.style.transform = 'scale(1) rotate(0deg)';
                }
                if (text) text.style.color = '#1a237e';
              }}
            >
              <div className="icon-container p-3 rounded-lg transition-all duration-300" style={{ backgroundColor: '#e3f2fd' }}>
                <Icon className="w-6 h-6 transition-all duration-300" style={{ color: '#0d47a1' }} />
              </div>
              <span className="action-text text-sm font-semibold transition-all duration-300 text-center" style={{ color: '#1a237e' }}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
