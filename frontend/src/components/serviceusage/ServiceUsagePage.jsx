import React, { useState, useEffect } from 'react';
import { Wrench, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';

const ServiceUsagePage = () => {
  const [serviceUsage, setServiceUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceUsage();
  }, []);

  const loadServiceUsage = async () => {
    try {
      // If you have a service usage endpoint
      const data = await api.getServices(); // Using services for now
      setServiceUsage(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load service usage:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Service Usage</h1>
        <p className="text-gray-600 mt-1">Track hotel service usage and requests</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading service usage...</p>
          </div>
        ) : serviceUsage.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No service usage records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceUsage.map((service) => (
                  <tr key={service.service_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${service.price || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.category || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceUsagePage;
