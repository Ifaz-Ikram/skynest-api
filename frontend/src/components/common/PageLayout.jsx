import React from 'react';

/**
 * PageLayout Component
 * Provides a consistent, beautiful layout wrapper for all pages
 * with proper spacing, background colors, and structure
 */
const PageLayout = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-slate-900 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
