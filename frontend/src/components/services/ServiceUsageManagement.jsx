// frontend/src/components/services/ServiceUsageManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Filter,
  Clock,
  User,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Calendar,
  ShoppingBag,
  Building2,
  ClipboardList
} from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';
import SearchableDropdown from '../common/SearchableDropdown';
import { LuxuryPageHeader } from '../common';

const ServiceUsageManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceUsages, setServiceUsages] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUsage, setEditingUsage] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Fixed at 50 items per page
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    service_id: '',
    branch_id: ''
  });

  useEffect(() => {
    loadData();
    loadBranches(); // NEW: Load branches
  }, [filters, page]);
  
  // Reset page to 1 when filters change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  const loadBranches = async () => { // NEW: Load branches function
    try {
      const branchesData = await api.getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usagesResponse, servicesData, bookingsData] = await Promise.all([
        api.getServiceUsages({ ...filters, page, limit }),
        api.getServices(),
        api.getBookings() // Load bookings instead of staff
      ]);
      
      // Handle paginated response
      if (usagesResponse.data && usagesResponse.pagination) {
        setServiceUsages(usagesResponse.data);
        setTotal(usagesResponse.pagination.total);
        setTotalPages(usagesResponse.pagination.totalPages);
      } else {
        // Fallback for non-paginated response (backward compatibility)
        setServiceUsages(usagesResponse);
        setTotal(usagesResponse.length);
        setTotalPages(1);
      }
      
      setServices(servicesData?.services || servicesData || []);
      setBookings(bookingsData?.bookings || bookingsData || []); // Load bookings data
      
      // Debug: Log services data to see price values
      console.log('Services data:', servicesData?.services || servicesData || []);
      console.log('First service unit_price:', (servicesData?.services || servicesData || [])[0]?.unit_price);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usage) => {
    console.log('Editing usage:', usage);
    console.log('Service usage ID:', usage.service_usage_id);
    setEditingUsage(usage);
    setShowModal(true);
  };

  const handleDelete = async (usageId) => {
    if (window.confirm('Are you sure you want to delete this service usage?')) {
      try {
        await api.deleteServiceUsage(usageId);
        await loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSave = async (usageData) => {
    try {
      // Transform form data to match backend schema
      const transformedData = {
        booking_id: usageData.booking_id,
        service_id: usageData.service_id,
        usage_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        quantity: parseInt(usageData.qty),
        unit_price: parseFloat(usageData.unit_price_at_use),
        total_amount: parseInt(usageData.qty) * parseFloat(usageData.unit_price_at_use)
      };

      if (editingUsage) {
        await api.updateServiceUsage(editingUsage.service_usage_id, transformedData);
      } else {
        await api.createServiceUsage(transformedData);
      }
      setShowModal(false);
      setEditingUsage(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex items-center justify-between" style={{ zIndex: 'var(--z-sticky)' }}>
          <h2 className="text-2xl font-display font-bold text-white">
            {editingUsage ? 'Edit Service Usage' : 'Add Service Usage'}
          </h2>
          <button onClick={() => { setShowModal(false); setEditingUsage(null); }} className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <ServiceUsageForm
          usage={editingUsage}
          services={services}
          bookings={bookings}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditingUsage(null); }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-primary dark:bg-slate-950 p-6 space-y-6 transition-colors">
      <LuxuryPageHeader
        title="Service Usage Management"
        subtitle="Manage service charges and usage records"
        icon={ClipboardList}
        actions={[{
          label: 'Add Service Usage',
          icon: Plus,
          onClick: () => setShowModal(true),
          variant: 'secondary'
        }]}
      />

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date From
              <span className="block text-xs font-normal text-slate-400 mt-0.5">
                {filters.date_to ? 'Service usage from this date...' : 'Service usage from this date onwards'}
              </span>
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => {
                console.log('Date from changed to:', e.target.value);
                handleFilterChange('date_from', e.target.value);
              }}
              className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date To
              <span className="block text-xs font-normal text-slate-400 mt-0.5">
                {filters.date_from ? '...to this date' : 'Service usage up to this date'}
              </span>
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => {
                console.log('Date to changed to:', e.target.value);
                handleFilterChange('date_to', e.target.value);
              }}
              className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Service</label>
            <SearchableDropdown
              options={[{ value: '', label: 'All Services' }, ...(services || [])]}
              value={filters.service_id}
              onChange={(value) => handleFilterChange('service_id', value)}
              placeholder="All Services"
              searchPlaceholder="Search services..."
              className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              displayKey="name"
              valueKey="service_id"
              searchKeys={['name', 'description']}
              renderOption={(service) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{service.name || service.label}</div>
                    {service.description && (
                      <div className="text-sm text-slate-300">{service.description}</div>
                    )}
                  </div>
                  {service.unit_price && (
                    <div className="text-right">
                      <div className="font-bold text-luxury-gold">
                        Rs {service.unit_price && !isNaN(parseFloat(service.unit_price)) ? parseFloat(service.unit_price).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  )}
          </div>
              )}
              renderSelected={(service) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{service.name || service.label}</span>
                  {service.unit_price && (
                    <span className="text-sm text-slate-300">
                      Rs {service.unit_price && !isNaN(parseFloat(service.unit_price)) ? parseFloat(service.unit_price).toFixed(2) : '0.00'}
                    </span>
                  )}
          </div>
              )}
              emptyMessage="No services found"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
            <SearchableDropdown
              options={[{ value: '', label: 'All Branches' }, ...(branches || [])]}
              value={filters.branch_id}
              onChange={(value) => handleFilterChange('branch_id', value)}
              placeholder="All Branches"
              searchPlaceholder="Search branches..."
              className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              displayKey="branch_name"
              valueKey="branch_id"
              searchKeys={['branch_name', 'branch_code']}
              renderOption={(branch) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{branch.branch_name || branch.label}</div>
                    {branch.branch_code && (
                      <div className="text-sm text-slate-300">{branch.branch_code}</div>
                    )}
                  </div>
                  {branch.address && (
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{branch.address}</div>
                    </div>
                  )}
                </div>
              )}
              renderSelected={(branch) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{branch.branch_name || branch.label}</span>
                  {branch.branch_code && (
                    <span className="text-sm text-slate-300">{branch.branch_code}</span>
                  )}
                </div>
              )}
              emptyMessage="No branches found"
            />
          </div>
        </div>
        {/* Clear Date Filters Button */}
        {(filters.date_from || filters.date_to) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                handleFilterChange('date_from', '');
                handleFilterChange('date_to', '');
              }}
              className="px-4 py-2 bg-red-900/20 hover:bg-red-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              Clear Date Filters
            </button>
          </div>
        )}
      </div>

      {/* Service Usage Table */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Service Usage Records</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-300">Loading service usage data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border dark:border-slate-700 rounded-xl bg-surface-secondary dark:bg-slate-800">
            <table className="min-w-full divide-y divide-border dark:divide-slate-700">
              <thead className="bg-surface-tertiary dark:bg-slate-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-secondary dark:bg-slate-800 divide-y divide-border dark:divide-slate-700">
                {serviceUsages.map((usage, index) => (
                  <tr key={index} className="hover:bg-surface-tertiary dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">#{usage.booking_id}</div>
                      <div className="text-sm text-slate-400">{usage.guest_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{usage.service_name}</div>
                      <div className="text-sm text-slate-400">{usage.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        Rs {usage.unit_price_at_use && usage.qty ? 
                          (parseFloat(usage.unit_price_at_use) * parseInt(usage.qty)).toFixed(2) : 
                          '0.00'}
                      </div>
                      {usage.tax_amount > 0 && (
                        <div className="text-sm text-slate-400">Tax: Rs {usage.tax_amount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {format(new Date(usage.created_at), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(usage)}
                          className="text-blue-500 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(usage.service_usage_id)}
                          className="text-red-500 dark:text-red-300 hover:text-red-300 dark:hover:text-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Load More Button */}
        {!loading && serviceUsages.length > 0 && page < totalPages && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-3 bg-yellow-900/200 hover:bg-yellow-600 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              Load More Services ({serviceUsages.length} loaded)
            </button>
          </div>
        )}
        
        {!loading && serviceUsages.length > 0 && (
          <div className="mt-4 text-center text-sm text-slate-300">
            Load more services for better search results
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && serviceUsages.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="text-sm text-slate-300">
              Showing <span className="font-medium">{serviceUsages.length}</span> filtered results from{' '}
              <span className="font-medium">{total}</span> loaded services
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 border border-border dark:border-slate-600 rounded text-sm font-medium text-slate-300 hover:bg-surface-tertiary dark:hover:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[40px] px-3 py-2 border rounded text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-yellow-900/200 text-white border-yellow-500'
                        : 'border-border dark:border-slate-600 text-slate-300 dark:text-slate-200 hover:bg-surface-tertiary dark:hover:bg-slate-700/30'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border border-border dark:border-slate-600 rounded text-sm font-medium text-slate-300 hover:bg-surface-tertiary dark:hover:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && renderModal()}
    </div>
  );
};

// Service Usage Form Component
const ServiceUsageForm = ({ usage, services, bookings, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    booking_id: usage?.booking_id || '',
    service_id: usage?.service_id || '',
    qty: usage?.qty || 1,
    unit_price_at_use: usage?.unit_price_at_use || ''
  });

  // Set unit_price_at_use when service is selected
  useEffect(() => {
    if (formData.service_id) {
      const selectedService = services.find(s => s.service_id == formData.service_id);
      if (selectedService) {
        const servicePrice = parseFloat(selectedService.unit_price);
        if (!isNaN(servicePrice) && servicePrice > 0) {
          setFormData(prev => ({
            ...prev,
            unit_price_at_use: servicePrice.toFixed(2)
          }));
        } else {
          // If price is invalid, set to 0.00
          setFormData(prev => ({
            ...prev,
            unit_price_at_use: '0.00'
          }));
        }
      }
    }
  }, [formData.service_id, services]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6" style={{width: '100%'}}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative z-40">
          <label className="block text-sm font-medium text-slate-200 mb-2">Booking ID *</label>
          <SearchableDropdown
            options={bookings || []}
            value={formData.booking_id}
            onChange={(value) => setFormData(prev => ({ ...prev, booking_id: value }))}
            placeholder="Select booking"
            searchPlaceholder="Search bookings..."
            className="w-full"
            displayKey="booking_display"
            valueKey="booking_id"
            searchKeys={['booking_id', 'guest_name', 'room_number']}
            required
            renderOption={(booking) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-semibold text-white">Booking #{booking.booking_id}</div>
                  <div className="text-sm text-slate-200">
                    {booking.guest_name} - Room {booking.room_number}
                  </div>
                </div>
                <div className="text-xs text-slate-300">
                  {format(new Date(booking.check_in_date), 'dd/MM/yyyy')} to {format(new Date(booking.check_out_date), 'dd/MM/yyyy')}
                </div>
              </div>
            )}
            renderSelected={(booking) => (
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">Booking #{booking.booking_id}</span>
                <span className="text-sm text-slate-300">
                  {booking.guest_name} - Room {booking.room_number}
                </span>
              </div>
            )}
            emptyMessage="No bookings found"
          />
        </div>

        <div className="relative z-30">
          <label className="block text-sm font-medium text-slate-200 mb-2">Service *</label>
          <SearchableDropdown
            options={services || []}
            value={formData.service_id}
            onChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
            placeholder="Select Service"
            searchPlaceholder="Search by service name..."
            className="w-full"
            required
            displayKey="displayText"
            valueKey="service_id"
            searchKeys={['name', 'description']}
            renderOption={(service) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-semibold text-white">{service.name}</div>
                  <div className="text-sm text-slate-200">
                    {service.description || 'No description'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-luxury-gold">
                    Rs {service.unit_price && !isNaN(parseFloat(service.unit_price)) ? parseFloat(service.unit_price).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            )}
            renderSelected={(service) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <span className="font-medium">{service.name}</span>
                  <span className="ml-2 text-slate-300">
                    {service.description || 'No description'}
                  </span>
                </div>
                <div className="font-bold text-luxury-gold">
                  Rs {service.unit_price && !isNaN(parseFloat(service.unit_price)) ? parseFloat(service.unit_price).toFixed(2) : '0.00'}
                </div>
              </div>
            )}
            emptyMessage="No services found"
          />
        </div>


        <div className="relative z-20">
          <label className="block text-sm font-medium text-slate-200 mb-2">Unit Price at Use *</label>
          <input
            type="number"
            step="0.01"
            name="unit_price_at_use"
            value={formData.unit_price_at_use}
            onChange={(e) => setFormData(prev => ({ ...prev, unit_price_at_use: e.target.value }))}
            className="input-field"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.20)',
              borderColor: 'rgba(203, 213, 225, 0.7)',
              color: 'rgb(255, 255, 255)',
              fontWeight: '500'
            }}
            placeholder="Auto-filled from service"
            required
          />
        </div>

        <div className="relative z-10">
          <label className="block text-sm font-medium text-slate-200 mb-2">Quantity *</label>
          <input
            type="number"
            name="qty"
            value={formData.qty}
            onChange={(e) => setFormData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
            min="1"
            className="input-field"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.20)',
              borderColor: 'rgba(203, 213, 225, 0.7)',
              color: 'rgb(255, 255, 255)',
              fontWeight: '500'
            }}
            required
          />
        </div>

      </div>


      <div className="flex gap-3 pt-6 border-t border-slate-700/50">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border-2 border-slate-600 rounded-lg text-white font-medium hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Save className="w-5 h-5" />
          <span>Save Service Usage</span>
        </button>
      </div>
    </form>
  );
};

export default ServiceUsageManagement;
