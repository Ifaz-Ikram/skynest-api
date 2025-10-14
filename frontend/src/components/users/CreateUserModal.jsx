import { useState, useEffect } from 'react';
import api from '../../utils/api';

export const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [fetchingRoles, setFetchingRoles] = useState(true);

  useEffect(() => {
    loadAllowedRoles();
  }, []);

  const loadAllowedRoles = async () => {
    try {
      const data = await api.request('/api/admin/allowed-roles');
      setAllowedRoles(data.allowedRoles || []);
      if (data.allowedRoles && data.allowedRoles.length > 0) {
        setFormData(prev => ({ ...prev, role: data.allowedRoles[0] }));
      }
    } catch (error) {
      console.error('Failed to load allowed roles:', error);
      // Fallback to basic roles if fetch fails
      setAllowedRoles(['Receptionist', 'Accountant']);
      setFormData(prev => ({ ...prev, role: 'Receptionist' }));
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use the new employee creation endpoint
      await api.request('/api/admin/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (error) {
      alert('Failed to create employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Create Employee Account</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new employee to the system</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Account Information */}
          <div className="space-y-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Account Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="input-field"
                placeholder="e.g., john.manager"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input-field"
                placeholder="Minimum 6 characters"
                minLength="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              {fetchingRoles ? (
                <div className="input-field text-gray-400">Loading roles...</div>
              ) : allowedRoles.length === 0 ? (
                <div className="input-field text-red-600">No roles available</div>
              ) : (
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input-field"
                  required
                >
                  {allowedRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                You can only create roles you have permission for
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="input-field"
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-field"
                placeholder="employee@skynest.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="input-field"
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || fetchingRoles || allowedRoles.length === 0} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
