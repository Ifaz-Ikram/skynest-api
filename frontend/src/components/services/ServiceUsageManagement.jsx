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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-surface-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            {editingUsage ? 'Edit Service Usage' : 'Add Service Usage'}
          </h2>
          <button onClick={() => { setShowModal(false); setEditingUsage(null); }} className="text-text-tertiary hover:text-text-secondary">
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Service</label>
            <SearchableDropdown
              options={[{ value: '', label: 'All Services' }, ...(services || [])]}
              value={filters.service_id}
              onChange={(value) => handleFilterChange('service_id', value)}
              placeholder="All Services"
              searchPlaceholder="Search services..."
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              displayKey="name"
              valueKey="service_id"
              searchKeys={['name', 'description']}
              renderOption={(service) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{service.name || service.label}</div>
                    {service.description && (
                      <div className="text-sm text-text-secondary">{service.description}</div>
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
                    <span className="text-sm text-text-secondary">
                      Rs {service.unit_price && !isNaN(parseFloat(service.unit_price)) ? parseFloat(service.unit_price).toFixed(2) : '0.00'}
                    </span>
                  )}
          </div>
              )}
              emptyMessage="No services found"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Branch</label>
            <SearchableDropdown
              options={[{ value: '', label: 'All Branches' }, ...(branches || [])]}
              value={filters.branch_id}
              onChange={(value) => handleFilterChange('branch_id', value)}
              placeholder="All Branches"
              searchPlaceholder="Search branches..."
              className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              displayKey="branch_name"
              valueKey="branch_id"
              searchKeys={['branch_name', 'branch_code']}
              renderOption={(branch) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{branch.branch_name || branch.label}</div>
                    {branch.branch_code && (
                      <div className="text-sm text-text-secondary">{branch.branch_code}</div>
                    )}
                  </div>
                  {branch.address && (
                    <div className="text-right">
                      <div className="text-xs text-text-tertiary">{branch.address}</div>
                    </div>
                  )}
                </div>
              )}
              renderSelected={(branch) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{branch.branch_name || branch.label}</span>
                  {branch.branch_code && (
                    <span className="text-sm text-text-secondary">{branch.branch_code}</span>
                  )}
                </div>
              )}
              emptyMessage="No branches found"
            />
          </div>
        </div>
      </div>

      {/* Service Usage Table */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Service Usage Records</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-text-secondary">Loading service usage data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border dark:border-slate-700 rounded-xl bg-surface-secondary dark:bg-slate-800">
            <table className="min-w-full divide-y divide-border dark:divide-slate-700">
              <thead className="bg-surface-tertiary dark:bg-slate-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-secondary dark:bg-slate-800 divide-y divide-border dark:divide-slate-700">
                {serviceUsages.map((usage, index) => (
                  <tr key={index} className="hover:bg-surface-tertiary dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">#{usage.booking_id}</div>
                      <div className="text-sm text-text-tertiary">{usage.guest_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary">{usage.service_name}</div>
                      <div className="text-sm text-text-tertiary">{usage.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">
                        Rs {usage.unit_price_at_use && usage.qty ? 
                          (parseFloat(usage.unit_price_at_use) * parseInt(usage.qty)).toFixed(2) : 
                          '0.00'}
                      </div>
                      {usage.tax_amount > 0 && (
                        <div className="text-sm text-text-tertiary">Tax: Rs {usage.tax_amount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-tertiary">
                      {format(new Date(usage.created_at), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(usage)}
                          className="text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(usage.service_usage_id)}
                          className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 transition-colors"
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
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              Load More Services ({serviceUsages.length} loaded)
            </button>
          </div>
        )}
        
        {!loading && serviceUsages.length > 0 && (
          <div className="mt-4 text-center text-sm text-text-secondary">
            Load more services for better search results
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && serviceUsages.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="text-sm text-text-secondary">
              Showing <span className="font-medium">{serviceUsages.length}</span> filtered results from{' '}
              <span className="font-medium">{total}</span> loaded services
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 border border-border dark:border-slate-600 rounded text-sm font-medium text-text-secondary hover:bg-surface-tertiary dark:hover:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'border-border dark:border-slate-600 text-text-secondary dark:text-slate-200 hover:bg-surface-tertiary dark:hover:bg-slate-700/30'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border border-border dark:border-slate-600 rounded text-sm font-medium text-text-secondary hover:bg-surface-tertiary dark:hover:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Booking ID *</label>
          <SearchableDropdown
            options={bookings || []}
            value={formData.booking_id}
            onChange={(value) => setFormData(prev => ({ ...prev, booking_id: value }))}
            placeholder="Select booking"
            searchPlaceholder="Search bookings..."
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            displayKey="booking_display"
            valueKey="booking_id"
            searchKeys={['booking_id', 'guest_name', 'room_number']}
            renderOption={(booking) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-medium">Booking #{booking.booking_id}</div>
                  <div className="text-sm text-text-secondary">
                    {booking.guest_name} - Room {booking.room_number}
                  </div>
                </div>
                <div className="text-xs text-text-tertiary">
                  {format(new Date(booking.check_in_date), 'dd/MM/yyyy')} to {format(new Date(booking.check_out_date), 'dd/MM/yyyy')}
                </div>
              </div>
            )}
            renderSelected={(booking) => (
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">Booking #{booking.booking_id}</span>
                <span className="text-sm text-text-secondary">
                  {booking.guest_name} - Room {booking.room_number}
                </span>
              </div>
            )}
            emptyMessage="No bookings found"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Service</label>
          <SearchableDropdown
            options={services || []}
            value={formData.service_id}
            onChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
            placeholder="Select Service"
            searchPlaceholder="Search by service name..."
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            displayKey="displayText"
            valueKey="service_id"
            searchKeys={['name', 'description']}
            renderOption={(service) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-text-secondary">
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
                  <span className="ml-2 text-text-secondary">
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


        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Unit Price at Use</label>
          <input
            type="number"
            step="0.01"
            name="unit_price_at_use"
            value={formData.unit_price_at_use}
            onChange={(e) => setFormData(prev => ({ ...prev, unit_price_at_use: e.target.value }))}
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Will be set automatically from service price"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Quantity</label>
          <input
            type="number"
            name="qty"
            value={formData.qty}
            onChange={(e) => setFormData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
            min="1"
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </div>


      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border dark:border-slate-600 rounded-md text-text-secondary hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
      </div>
    </form>
  );
};

export default ServiceUsageManagement;
