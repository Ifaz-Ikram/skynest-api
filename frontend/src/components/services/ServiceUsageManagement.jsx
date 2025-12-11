// frontend/src/components/services/ServiceUsageManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ClipboardList,
  Building2
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

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
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
    loadBranches();
  }, [filters, page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const loadBranches = async () => {
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
        api.getBookings()
      ]);

      if (usagesResponse.data && usagesResponse.pagination) {
        setServiceUsages(usagesResponse.data);
        setTotal(usagesResponse.pagination.total);
        setTotalPages(usagesResponse.pagination.totalPages);
      } else {
        setServiceUsages(usagesResponse);
        setTotal(usagesResponse.length);
        setTotalPages(1);
      }

      setServices(servicesData?.services || servicesData || []);
      setBookings(bookingsData?.bookings || bookingsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usage) => {
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
      const transformedData = {
        booking_id: usageData.booking_id,
        service_id: usageData.service_id,
        usage_date: new Date().toISOString().split('T')[0],
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

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#f8f9fa' }}>
      <LuxuryPageHeader
        title="Service Usage Management"
        subtitle="Manage service charges and usage records"
        icon={ClipboardList}
        actions={[{
          label: 'Add Service Usage',
          icon: Plus,
          onClick: () => setShowModal(true),
        }]}
      />

      {error && (
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4" style={{ borderLeftColor: '#dc3545' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" style={{ color: '#dc3545' }} />
            <span style={{ color: '#dc3545' }}>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" style={{ color: '#6c757d' }} />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1a237e' }}>Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
              Date From
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
              style={{ borderColor: '#e9ecef', color: '#333' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
              Date To
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
              style={{ borderColor: '#e9ecef', color: '#333' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Service</label>
            <SearchableDropdown
              options={[{ value: '', label: 'All Services' }, ...(services || [])]}
              value={filters.service_id}
              onChange={(value) => handleFilterChange('service_id', value)}
              placeholder="All Services"
              displayKey="name"
              valueKey="service_id"
              searchKeys={['name', 'description']}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Branch</label>
            <SearchableDropdown
              options={[{ value: '', label: 'All Branches' }, ...(branches || [])]}
              value={filters.branch_id}
              onChange={(value) => handleFilterChange('branch_id', value)}
              placeholder="All Branches"
              displayKey="branch_name"
              valueKey="branch_id"
              searchKeys={['branch_name', 'branch_code']}
            />
          </div>
          <div className="flex items-end">
            {(filters.date_from || filters.date_to) && (
              <button
                onClick={() => {
                  handleFilterChange('date_from', '');
                  handleFilterChange('date_to', '');
                }}
                className="px-4 py-3 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Service Usage Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
          <h3 className="text-lg font-bold" style={{ color: '#1a237e' }}>Service Usage Records</h3>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#0d47a1' }}></div>
            <p className="mt-3" style={{ color: '#6c757d' }}>Loading service usage data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ backgroundColor: '#e3f2fd' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Booking</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Service</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#e9ecef' }}>
                {serviceUsages.map((usage, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1a237e' }}>#{usage.booking_id}</div>
                      <div className="text-sm" style={{ color: '#6c757d' }}>{usage.guest_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#333' }}>{usage.service_name}</div>
                      <div className="text-sm" style={{ color: '#6c757d' }}>{usage.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold" style={{ color: '#1a237e' }}>
                        Rs {usage.unit_price_at_use && usage.qty ?
                          (parseFloat(usage.unit_price_at_use) * parseInt(usage.qty)).toFixed(2) :
                          '0.00'}
                      </div>
                      {usage.tax_amount > 0 && (
                        <div className="text-xs" style={{ color: '#6c757d' }}>Tax: Rs {usage.tax_amount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6c757d' }}>
                      {format(new Date(usage.created_at), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(usage)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(usage.service_usage_id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {serviceUsages.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center" style={{ color: '#6c757d' }}>
                      No service usage records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && serviceUsages.length > 0 && totalPages > 1 && (
          <div className="border-t px-6 py-4" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }}>
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: '#6c757d' }}>
                Showing <span className="font-semibold">{serviceUsages.length}</span> of{' '}
                <span className="font-semibold">{total}</span> records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'white', color: '#1a237e', border: '1px solid #dee2e6' }}
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="w-10 h-10 rounded-lg text-sm font-medium transition-all"
                      style={page === pageNum ? {
                        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                        color: 'white'
                      } : {
                        backgroundColor: 'white',
                        color: '#1a237e',
                        border: '1px solid #dee2e6'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'white', color: '#1a237e', border: '1px solid #dee2e6' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
              <h2 className="text-2xl font-bold" style={{ color: '#1a237e' }}>
                {editingUsage ? 'Edit Service Usage' : 'Add Service Usage'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingUsage(null); }}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'white', color: '#6c757d' }}
              >
                <X className="w-5 h-5" />
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
      )}
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

  useEffect(() => {
    if (formData.service_id) {
      const selectedService = services.find(s => s.service_id == formData.service_id);
      if (selectedService) {
        const servicePrice = parseFloat(selectedService.unit_price);
        if (!isNaN(servicePrice) && servicePrice > 0) {
          setFormData(prev => ({ ...prev, unit_price_at_use: servicePrice.toFixed(2) }));
        } else {
          setFormData(prev => ({ ...prev, unit_price_at_use: '0.00' }));
        }
      }
    }
  }, [formData.service_id, services]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative z-40">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Booking ID *</label>
          <SearchableDropdown
            options={bookings || []}
            value={formData.booking_id}
            onChange={(value) => setFormData(prev => ({ ...prev, booking_id: value }))}
            placeholder="Select booking"
            displayKey="booking_display"
            valueKey="booking_id"
            searchKeys={['booking_id', 'guest_name', 'room_number']}
            required
          />
        </div>

        <div className="relative z-30">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Service *</label>
          <SearchableDropdown
            options={services || []}
            value={formData.service_id}
            onChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}
            placeholder="Select Service"
            displayKey="name"
            valueKey="service_id"
            searchKeys={['name', 'description']}
            required
          />
        </div>

        <div className="relative z-20">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Unit Price *</label>
          <input
            type="number"
            step="0.01"
            value={formData.unit_price_at_use}
            onChange={(e) => setFormData(prev => ({ ...prev, unit_price_at_use: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
            style={{ borderColor: '#e9ecef', color: '#333' }}
            placeholder="Auto-filled from service"
            required
          />
        </div>

        <div className="relative z-10">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Quantity *</label>
          <input
            type="number"
            value={formData.qty}
            onChange={(e) => setFormData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
            min="1"
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500"
            style={{ borderColor: '#e9ecef', color: '#333' }}
            required
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-5 py-3 rounded-xl font-medium transition-colors"
          style={{ backgroundColor: '#e9ecef', color: '#495057' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-5 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}
        >
          <Save className="w-5 h-5" />
          Save Service Usage
        </button>
      </div>
    </form>
  );
};

export default ServiceUsageManagement;
