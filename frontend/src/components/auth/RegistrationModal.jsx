import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const RegistrationModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.register({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
      
      onSuccess(formData.username, formData.password);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
      <div className="backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{minWidth: '600px', background: 'white', border: '2px solid #e0e0e0'}}>
        <div className="px-6 py-5 sticky top-0 rounded-t-2xl z-10" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Register as a customer to book rooms</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" style={{width: '100%', background: '#f8f9fa'}}>
          {error && (
            <div className="px-4 py-3 rounded-lg flex items-center" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: '#495057' }}>Account Information</h3>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 outline-none"
                style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }}
                onFocus={(e) => { e.target.style.borderColor = '#1a237e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none'; }}
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 outline-none"
                  style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }}
                  onFocus={(e) => { e.target.style.borderColor = '#1a237e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none'; }}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 outline-none"
                  style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }}
                  onFocus={(e) => { e.target.style.borderColor = '#1a237e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4 pt-4" style={{ borderTop: '1px solid #e0e0e0' }}>
            <h3 className="text-lg font-semibold" style={{ color: '#495057' }}>Personal Information</h3>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 outline-none"
                style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }}
                onFocus={(e) => { e.target.style.borderColor = '#1a237e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none'; }}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 outline-none"
                  style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }}
                  onFocus={(e) => { e.target.style.borderColor = '#1a237e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none'; }}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 outline-none"
                  style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }}
                  onFocus={(e) => { e.target.style.borderColor = '#1a237e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none'; }}
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#495057' }}>Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 outline-none resize-vertical"
                style={{ borderColor: '#dee2e6', background: 'white', color: '#495057' }}
                onFocus={(e) => { e.target.style.borderColor = '#1a237e'; e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; e.target.style.boxShadow = 'none'; }}
                placeholder="Street address, city, country"
                rows="2"
              />
            </div>
          </div>

        </form>
        <div className="px-6 py-5 sticky bottom-0 z-10" style={{ borderTop: '2px solid #e0e0e0', background: 'white' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="dropdown-option-button px-6 py-3 font-semibold rounded-xl transition-all duration-200 flex-1"
              style={{ background: 'white', border: '2px solid #1a237e', color: '#1a237e', boxShadow: '0 2px 8px rgba(26, 35, 126, 0.15)' }}
              onMouseEnter={(e) => { e.target.style.setProperty('background', 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', 'important'); e.target.style.setProperty('color', 'white', 'important'); e.target.style.setProperty('box-shadow', '0 4px 12px rgba(26, 35, 126, 0.3)', 'important'); }}
              onMouseLeave={(e) => { e.target.style.setProperty('background', 'white', 'important'); e.target.style.setProperty('color', '#1a237e', 'important'); e.target.style.setProperty('box-shadow', '0 2px 8px rgba(26, 35, 126, 0.15)', 'important'); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="dropdown-option-button px-6 py-3 font-bold rounded-xl transition-all hover:scale-105 border-0 flex-1"
              style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)', color: 'white', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;
