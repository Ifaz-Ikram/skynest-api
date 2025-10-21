import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const InteractiveDataTable = ({ 
  data = [], 
  columns = [], 
  pageSize = 10,
  searchable = true,
  sortable = true,
  paginated = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }

      // String sorting
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortConfig, sortable]);

  // Search/filter logic
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return sortedData;

    return sortedData.filter(row => {
      return columns.some(column => {
        const value = row[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [sortedData, searchTerm, columns, searchable]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, paginated]);

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey) => {
    if (!sortable) return null;
    
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-slate-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-luxury-gold" />
      : <ChevronDown className="w-4 h-4 text-luxury-gold" />;
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const displayData = paginatedData;

  return (
    <div className="w-full">
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-slate-400 mt-2">
              Found {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-border dark:border-slate-700 rounded-lg bg-surface-secondary dark:bg-slate-800">
        <table className="min-w-full divide-y divide-border dark:divide-slate-700">
          <thead className="bg-surface-tertiary dark:bg-slate-800/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider transition-colors ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-surface-tertiary dark:hover:bg-slate-700/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface-secondary dark:bg-slate-800 divide-y divide-border dark:divide-slate-700">
            {displayData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-8 text-center text-slate-400"
                >
                  {searchTerm ? 'No matching results found' : 'No data available'}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="hover:bg-surface-tertiary dark:hover:bg-slate-700/40 transition-colors"
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-white dark:text-slate-100"
                    >
                      {column.render 
                        ? column.render(row[column.key], row) 
                        : row[column.key] ?? '-'
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-300">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-border dark:border-slate-600 rounded-lg hover:bg-surface-tertiary dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-surface-secondary dark:bg-slate-800 text-slate-300 dark:text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-luxury-gold text-white'
                        : 'border border-border dark:border-slate-600 bg-surface-secondary dark:bg-slate-800 text-slate-300 dark:text-slate-200 hover:bg-surface-tertiary dark:hover:bg-slate-700/40'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-border dark:border-slate-600 rounded-lg hover:bg-surface-tertiary dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-surface-secondary dark:bg-slate-800 text-slate-300 dark:text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveDataTable;
