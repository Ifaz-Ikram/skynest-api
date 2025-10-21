import React from 'react';

/**
 * Luxury Page Header Component
 * 
 * A reusable gradient header component for all pages featuring:
 * - Gradient background with luxury styling
 * - Icon with backdrop blur effect
 * - Title and description
 * - Optional stats cards
 * - Fully responsive design
 * 
 * @param {Object} props
 * @param {string} props.title - Main page title
 * @param {string} props.description - Page description text
 * @param {React.Component} props.icon - Lucide icon component
 * @param {Array} props.stats - Array of stat objects: [{ label, value, sublabel }]
 * @param {string} props.gradientClass - Optional custom gradient class (default: 'luxury-gradient')
 */
const LuxuryPageHeader = ({ 
  title, 
  description, 
  icon: Icon, 
  stats = [],
  gradientClass = 'luxury-gradient',
  action = null,
  actions = null,
}) => {
  return (
    <div className={`${gradientClass} rounded-2xl p-8 text-white shadow-xl`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section - Title and Icon */}
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">{title}</h1>
            <p className="text-blue-100 text-lg">{description}</p>
          </div>
        </div>

        {/* Right Section - Actions or Stats */}
        <div className="mt-2 md:mt-0 flex items-center gap-3">
          {action ? (
            // Single custom action (can be a button or a JSX element)
            <div>{action}</div>
          ) : null}

          {Array.isArray(actions) && actions.length > 0 ? (
            <div className="flex items-center gap-2">
              {actions.map((a, idx) => (
                <button
                  key={idx}
                  onClick={a.onClick}
                  className={
                    a.className ||
                    (a.variant === 'secondary'
                      ? 'px-4 py-2 rounded-xl bg-surface-secondary dark:bg-slate-800 text-text-primary dark:text-slate-100 border border-border dark:border-slate-700 hover:bg-surface-tertiary dark:hover:bg-slate-700/40 shadow-sm flex items-center gap-2 transition-colors'
                      : 'px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20 border border-white/30 shadow-sm flex items-center gap-2 transition-colors')
                  }
                >
                  {a.icon ? <a.icon className="w-4 h-4" /> : null}
                  <span className="font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {(!action && (!actions || actions.length === 0) && stats && stats.length > 0) ? (
            <div className="flex gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                  {stat.sublabel && (
                    <div className="text-xs text-blue-200 mt-1">{stat.sublabel}</div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LuxuryPageHeader;
