import { useState, useEffect } from 'react';
import { ShoppingBag, AlertCircle, Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadServices();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadServices = async () => {
    try {
      setError(null);
      const data = await api.getServices();
      const servicesList = data?.services || data || [];
      setServices(Array.isArray(servicesList) ? servicesList : []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setError(error.message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await api.deleteService(id);
      alert('Service deleted successfully!');
      loadServices();
    } catch (error) {
      alert('Failed to delete service: ' + error.message);
    }
  };

  const isAdmin = currentUser?.role === 'Admin';

  const totalServices = services.length;
  const activeServices = services.filter(s => s.is_active !== false).length;
  const totalRevenue = services.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0);

  if (loading) {
    return <LoadingSpinner size="xl" message="Loading services..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#f8d7da' }}>
                <AlertCircle className="w-8 h-8" style={{ color: '#dc3545' }} />
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: '#dc3545' }}>Error loading services</p>
                <p className="text-sm" style={{ color: '#6c757d' }}>{error}</p>
                <button
                  onClick={loadServices}
                  className="mt-3 px-4 py-2 rounded-lg font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Services"
          description="Hotel amenities and services catalog"
          icon={ShoppingBag}
          stats={[
            { label: 'Total Services', value: totalServices },
            { label: 'Active', value: activeServices },
            { label: 'Categories', value: new Set(services.map(s => s.category || 'Other')).size },
          ]}
          actions={isAdmin ? [{
            label: 'Add Service',
            icon: Plus,
            onClick: () => setShowCreateModal(true),
          }] : undefined}
        />

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="bg-white rounded-xl shadow-lg p-12">
                <ShoppingBag className="w-20 h-20 mx-auto mb-6" style={{ color: '#dee2e6' }} />
                <p className="text-lg mb-4" style={{ color: '#6c757d' }}>No services found</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}
                  >
                    Add First Service
                  </button>
                )}
              </div>
            </div>
          ) : (
            services.map(service => (
              <div
                key={service.service_id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                style={{ border: '1px solid #e9ecef' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold" style={{ color: '#1a237e' }}>
                        {service.service_name || service.name}
                      </h3>
                      {!service.active && (
                        <span
                          className="px-2 py-1 text-xs rounded-full font-medium"
                          style={{ backgroundColor: '#e9ecef', color: '#6c757d' }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    {service.code && (
                      <p className="text-xs mt-1" style={{ color: '#6c757d' }}>Code: {service.code}</p>
                    )}
                    {(service.category || service.description) && (
                      <p className="text-sm mt-2" style={{ color: '#495057' }}>
                        {service.category || service.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: '#6c757d' }}>Price:</span>
                    <span className="text-2xl font-bold" style={{ color: '#1a237e' }}>
                      Rs {parseFloat(service.price || service.unit_price || 0).toFixed(2)}
                    </span>
                  </div>
                  {service.tax_rate_percent > 0 && (
                    <div className="flex justify-between items-center text-xs" style={{ color: '#6c757d' }}>
                      <span>Tax Rate:</span>
                      <span>{service.tax_rate_percent}%</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors"
                      style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.service_id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors"
                      style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {showCreateModal && (
          <ServiceModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadServices();
            }}
          />
        )}

        {showEditModal && selectedService && (
          <ServiceModal
            service={selectedService}
            onClose={() => {
              setShowEditModal(false);
              setSelectedService(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedService(null);
              loadServices();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Service Modal
const ServiceModal = ({ service, onClose, onSuccess }) => {
  const isEdit = !!service;
  const [formData, setFormData] = useState({
    code: service?.code || '',
    name: service?.service_name || service?.name || '',
    category: service?.description || service?.category || '',
    unit_price: service?.price || service?.unit_price || '',
    tax_rate_percent: service?.tax_rate_percent || 0,
    active: service?.active !== undefined ? service.active : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateServiceCatalog(service.service_id, formData);
        alert('Service updated successfully!');
      } else {
        await api.createService(formData);
        alert('Service created successfully!');
      }
      onSuccess();
    } catch (error) {
      alert(`Failed to ${isEdit ? 'update' : 'create'} service: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div
          className="px-6 py-5 border-b flex justify-between items-center sticky top-0 z-10"
          style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: '#1a237e' }}>
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'white', color: '#6c757d' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
              Service Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333', backgroundColor: isEdit ? '#f8f9fa' : 'white' }}
              placeholder="e.g., RMSERV, LAUNDRY, SPA"
              required
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs mt-1" style={{ color: '#6c757d' }}>Service code cannot be changed</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333' }}
              placeholder="e.g., Room Service, Laundry, Spa"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333' }}
              placeholder="e.g., Food & Beverage, Housekeeping"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
                Unit Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tax_rate_percent}
                onChange={(e) => setFormData({ ...formData, tax_rate_percent: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 rounded border-2 cursor-pointer accent-blue-600"
                style={{ borderColor: '#dee2e6' }}
              />
              <span className="font-medium" style={{ color: '#333' }}>Active (Available for booking)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl font-medium transition-colors"
              style={{ backgroundColor: '#e9ecef', color: '#495057' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Service' : 'Create Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
