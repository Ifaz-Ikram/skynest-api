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
      // Backend returns { services: [...] } or just [...]
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

  // Calculate stats
  const totalServices = services.length;
  const activeServices = services.filter(s => s.is_active !== false).length;
  const totalRevenue = services.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0);

  if (loading) {
    return <LoadingSpinner size="xl" message="Loading services..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Services</h1>
        <div className="card bg-red-900/20 border border-red-700">
          <div className="flex items-center gap-3 text-red-200">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Error loading services</p>
              <p className="text-sm">{error}</p>
              <button onClick={loadServices} className="btn-secondary mt-3 text-sm">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary dark:bg-slate-950 p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Services"
          description="Hotel amenities and services catalog"
          icon={ShoppingBag}
          stats={[
            { label: 'Total Services', value: totalServices, trend: `${activeServices} active` },
            { label: 'Revenue Potential', value: `Rs ${totalRevenue.toFixed(2)}`, trend: 'Combined rates' },
            { label: 'Categories', value: new Set(services.map(s => s.category || 'Other')).size, trend: 'Available' },
          ]}
          actions={isAdmin ? [{
            label: 'Add Service',
            icon: Plus,
            onClick: () => setShowCreateModal(true),
            variant: 'secondary'
          }] : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ShoppingBag className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300">No services found</p>
            {isAdmin && (
              <button onClick={() => setShowCreateModal(true)} className="mt-4 btn-primary">
                Add First Service
              </button>
            )}
          </div>
        ) : (
          services.map(service => (
            <div key={service.service_id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{service.service_name || service.name}</h3>
                    {!service.active && (
                      <span className="px-2 py-1 bg-surface-tertiary text-slate-300 text-xs rounded-full">Inactive</span>
                    )}
                  </div>
                  {service.code && (
                    <p className="text-xs text-slate-400 mt-1">Code: {service.code}</p>
                  )}
                  {(service.category || service.description) && (
                    <p className="text-sm text-slate-300 mt-1">{service.category || service.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Price:</span>
                  <span className="text-xl font-bold text-luxury-gold">Rs {parseFloat(service.price || service.unit_price || 0).toFixed(2)}</span>
                </div>
                {service.tax_rate_percent > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Tax Rate:</span>
                    <span>{service.tax_rate_percent}%</span>
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.service_id)}
                    className="flex-1 bg-red-900/20 text-red-600 hover:bg-red-800/30 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
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

// Service Modal (Create/Edit)
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
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-display font-bold text-white">
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Service Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., RMSERV, LAUNDRY, SPA"
              required
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-slate-400 mt-1">Service code cannot be changed</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="e.g., Room Service, Laundry, Spa"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="e.g., Food & Beverage, Housekeeping"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Unit Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.unit_price}
              onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.tax_rate_percent}
              onChange={(e) => setFormData({...formData, tax_rate_percent: e.target.value})}
              className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-5 h-5 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-all"
              />
              <span className="text-slate-300 font-medium">Active (Available for booking)</span>
            </label>
          </div>
        </form>
        <div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky bottom-0 z-10">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 text-slate-300 font-semibold rounded-lg hover:bg-slate-700/60 hover:border-slate-500 hover:text-white transition-all duration-200 flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 flex-1"
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Service' : 'Create Service')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
