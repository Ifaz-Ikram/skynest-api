// frontend/src/components/common/OptimizedGuestSearch.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Mail, Phone, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const OptimizedGuestSearch = ({ onGuestSelect, placeholder = "Search guests by email or name...", className = "" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (term) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (term.length >= 2) {
            performSearch(term);
          } else {
            setGuests([]);
            setShowDropdown(false);
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const performSearch = async (term) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the new optimized search methods
      let results = [];
      
      if (term.includes('@')) {
        // Email search - uses idx_guest_email index
        results = await api.searchGuestsByEmail(term);
      } else {
        // Name search
        results = await api.searchGuestsByName(term);
      }
      
      setGuests(Array.isArray(results) ? results : []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Guest search error:', error);
      setError('Failed to search guests');
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSelect = (guest) => {
    setSelectedGuest(guest);
    setSearchTerm(`${guest.full_name} (${guest.email || guest.phone || `ID: ${guest.guest_id}`})`);
    setShowDropdown(false);
    onGuestSelect(guest);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value) {
      setSelectedGuest(null);
      onGuestSelect(null);
    }
  };

  const handleInputFocus = () => {
    if (guests.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => setShowDropdown(false), 150);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-text-tertiary animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-text-tertiary" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-border dark:border-slate-600 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-surface-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {error ? (
            <div className="px-4 py-2 text-sm text-red-600 flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          ) : guests.length === 0 && searchTerm.length >= 2 ? (
            <div className="px-4 py-2 text-sm text-text-tertiary">
              No guests found matching "{searchTerm}"
            </div>
          ) : (
            guests.map((guest) => (
              <div
                key={guest.guest_id}
                onClick={() => handleGuestSelect(guest)}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 hover:text-blue-900"
              >
                <div className="flex items-center">
                  <User className="h-4 w-4 text-text-tertiary mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {guest.full_name}
                    </div>
                    <div className="flex items-center text-sm text-text-tertiary">
                      {guest.email && (
                        <>
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate">{guest.email}</span>
                        </>
                      )}
                      {guest.phone && (
                        <>
                          <Phone className="h-3 w-3 ml-2 mr-1" />
                          <span>{guest.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Guest Display */}
      {selectedGuest && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center text-sm text-green-800">
            <User className="h-4 w-4 mr-2" />
            <span className="font-medium">Selected:</span>
            <span className="ml-1">{selectedGuest.full_name}</span>
            {selectedGuest.email && (
              <span className="ml-2 text-green-600">({selectedGuest.email})</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedGuestSearch;
