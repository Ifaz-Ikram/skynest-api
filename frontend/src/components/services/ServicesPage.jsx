import { useState, useEffect } from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setError(null);
      const data = await api.request('/api/catalog/services');
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setError(error.message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 text-red-800">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Hotel amenities and services catalog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="card h-40 skeleton"></div>
          ))
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No services found</p>
          </div>
        ) : (
          services.map(service => (
            <div key={service.service_id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{service.service_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-xl font-bold text-luxury-gold">${service.price}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
