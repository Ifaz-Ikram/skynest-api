import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableDropdown = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  optionClassName = '',
  inputClassName = '',
  disabled = false,
  required = false,
  displayKey = 'name',
  valueKey = 'id',
  searchKeys = [], // Array of keys to search in
  renderOption = null, // Custom render function for options
  renderSelected = null, // Custom render function for selected value
  emptyMessage = 'No options found',
  loading = false,
  loadingMessage = 'Loading...',
  clearable = true,
  hideSearch = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = (Array.isArray(options) ? options : []).filter(option => {
    if (!searchTerm) return true;
    
    const searchString = searchTerm.toLowerCase();
    
    // If searchKeys is provided, search in those specific keys
    if (searchKeys.length > 0) {
      return searchKeys.some(key => {
        const value = option[key];
        return value && value.toString().toLowerCase().includes(searchString);
      });
    }
    
    // Otherwise, search in displayKey and other common keys
    const searchableKeys = [displayKey, 'name', 'title', 'label', 'text', 'email', 'phone'];
    return searchableKeys.some(key => {
      const value = option[key];
      return value && value.toString().toLowerCase().includes(searchString);
    });
  });

  // Get selected option
  const selectedOption = (Array.isArray(options) ? options : []).find(option => option[valueKey] === value);

  // Handle option selection
  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  const getDisplayValue = (option) => {
    if (renderSelected && option) {
      return renderSelected(option);
    }
    return option ? option[displayKey] : '';
  };

  const getOptionDisplay = (option) => {
    if (renderOption) {
      return renderOption(option);
    }
    return option[displayKey];
  };

  const baseButtonClasses = `
    w-full px-3 py-2 text-left rounded-lg border border-border bg-surface-primary text-white shadow-sm
    transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    focus-visible:ring-accent-secondary dark:bg-surface-secondary
  `;

  const disabledClasses = disabled
    ? 'bg-surface-tertiary/60 text-slate-400 cursor-not-allowed opacity-70'
    : 'hover:border-accent-secondary';

  const requiredClasses =
    required && !value
      ? 'border-state-error focus-visible:ring-state-error focus-visible:ring-offset-0'
      : '';

  const buttonClasses = `${baseButtonClasses} ${disabledClasses} ${requiredClasses} ${buttonClassName}`.replace(/\s+/g, ' ');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main dropdown button */}
      <button
        type="button"
        className={buttonClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        {...props}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${!value ? 'text-slate-400' : ''}`}>
            {value ? getDisplayValue(selectedOption) : placeholder}
          </span>
          <div className="flex items-center">
            {value && clearable && !disabled && (
              <div
                className="mr-1 text-slate-400 hover:text-white cursor-pointer transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
              >
                <X className="w-4 h-4" />
              </div>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute mt-2 w-full overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-800 shadow-2xl backdrop-blur-xl ${dropdownClassName}`}
          style={{ zIndex: 'var(--z-dropdown)' }}
        >
          {!hideSearch && (
            <div className="p-3 border-b border-slate-600">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={`w-full rounded-lg border-2 border-slate-600 bg-slate-700/50 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-400 outline-none transition-all duration-150 focus:border-blue-500 focus:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500/50 ${inputClassName}`}
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-slate-300 text-center">
                {loadingMessage}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-300 text-center">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option[valueKey]}
                  type="button"
                  className={`
                    w-full px-4 py-3 text-left text-sm font-medium transition-all duration-150
                    ${highlightedIndex === index ? 'bg-blue-600/20 text-white' : ''}
                    ${option[valueKey] === value ? 'bg-blue-600/30 text-white font-bold border-l-4 border-blue-500' : 'text-slate-100 hover:text-white'}
                    hover:bg-blue-600/20 hover:border-l-4 hover:border-blue-500/50 focus-visible:outline-none focus-visible:bg-blue-600/20
                    border-l-4 border-transparent
                    ${optionClassName}
                  `}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {getOptionDisplay(option)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
