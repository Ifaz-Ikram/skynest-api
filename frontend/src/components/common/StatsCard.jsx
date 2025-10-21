import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-900/200',
    green: 'bg-green-900/200',
    yellow: 'bg-yellow-900/200',
    purple: 'bg-purple-900/200',
    gold: 'bg-luxury-gold',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={`${colorClasses[color]} p-4 rounded-xl`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
