import React from 'react';
import { Search, Filter, Download, Plus } from 'lucide-react';

/**
 * Action Bar Component
 * 
 * A reusable action bar for list pages featuring:
 * - Search input with icon
 * - Filter button
 * - Export button
 * - Primary action button (Add New, etc.)
 * - Fully customizable
 * 
 * @param {Object} props
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {Function} props.onSearch - Callback when search value changes
 * @param {Function} props.onFilter - Callback when filter button clicked
 * @param {Function} props.onExport - Callback when export button clicked
 * @param {Function} props.onPrimaryAction - Callback when primary action button clicked
 * @param {string} props.primaryActionLabel - Label for primary action button
 * @param {React.Component} props.primaryActionIcon - Icon for primary action button
 * @param {boolean} props.showSearch - Show/hide search input (default: true)
 * @param {boolean} props.showFilter - Show/hide filter button (default: true)
 * @param {boolean} props.showExport - Show/hide export button (default: true)
 * @param {boolean} props.showPrimaryAction - Show/hide primary action button (default: true)
 */
const ActionBar = ({
  searchPlaceholder = 'Search...',
  onSearch,
  onFilter,
  onExport,
  onPrimaryAction,
  primaryActionLabel = 'Add New',
  primaryActionIcon: PrimaryIcon = Plus,
  showSearch = true,
  showFilter = true,
  showExport = true,
  showPrimaryAction = true,
  children
}) => {
  return (
    <div className="card">
      <div className="flex justify-between items-center">
        {/* Left Section - Search and Filter */}
        <div className="flex items-center gap-3">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch && onSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
          )}
          
          {showFilter && onFilter && (
            <button 
              onClick={onFilter}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          )}
          
          {/* Custom Children (for additional left-side controls) */}
          {children}
        </div>

        {/* Right Section - Export and Primary Action */}
        <div className="flex items-center gap-3">
          {showExport && onExport && (
            <button 
              onClick={onExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
          
          {showPrimaryAction && onPrimaryAction && (
            <button 
              onClick={onPrimaryAction}
              className="btn-primary flex items-center gap-2"
            >
              <PrimaryIcon className="w-5 h-5" />
              {primaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
