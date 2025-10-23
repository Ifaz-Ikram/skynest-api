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
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-luxury-gold" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || Calendar;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.navigate)}
              className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-luxury-gold/20 hover:to-luxury-gold/10 rounded-xl border border-slate-600/50 hover:border-luxury-gold/50 transition-all duration-200 group"
            >
              <div className="p-3 bg-luxury-gold/10 rounded-lg group-hover:bg-luxury-gold/20 transition-colors">
                <Icon className="w-6 h-6 text-luxury-gold" />
              </div>
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors text-center">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
