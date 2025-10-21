import React from 'react';

/**
 * Loading Spinner Component
 * 
 * A beautiful animated loading spinner with icon and customizable messages.
 * Features:
 * - Spinning outer ring with gradient
 * - Pulsing icon in center
 * - Primary and secondary text
 * - Fully customizable
 * 
 * @param {Object} props
 * @param {React.Component} props.icon - Lucide icon component to show in center
 * @param {string} props.message - Primary loading message
 * @param {string} props.submessage - Secondary loading message (optional)
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'xl' (default: 'lg')
 */
const LoadingSpinner = ({ 
  icon: Icon, 
  message = 'Loading...', 
  submessage = '',
  size = 'lg'
}) => {
  const sizeClasses = {
    sm: { spinner: 'h-8 w-8', icon: 'w-3 h-3', text: 'text-sm', subtext: 'text-xs' },
    md: { spinner: 'h-12 w-12', icon: 'w-5 h-5', text: 'text-base', subtext: 'text-sm' },
    lg: { spinner: 'h-16 w-16', icon: 'w-6 h-6', text: 'text-lg', subtext: 'text-sm' },
    xl: { spinner: 'h-24 w-24', icon: 'w-10 h-10', text: 'text-xl', subtext: 'text-base' }
  };

  const classes = sizeClasses[size] || sizeClasses.lg;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Spinning Ring */}
        <div className={`animate-spin rounded-full ${classes.spinner} border-4 border-border border-t-blue-600`}></div>
        
        {/* Center Icon */}
        {Icon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`${classes.icon} text-blue-600 animate-pulse`} />
          </div>
        )}
      </div>
      
      {/* Loading Text */}
      {message && (
        <span className={`mt-4 ${classes.text} font-medium text-slate-100`}>
          {message}
        </span>
      )}
      
      {/* Submessage */}
      {submessage && (
        <span className={`${classes.subtext} text-slate-300 mt-1`}>
          {submessage}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
