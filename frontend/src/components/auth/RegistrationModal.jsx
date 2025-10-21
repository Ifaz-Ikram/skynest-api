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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0" style={{ zIndex: 'var(--z-sticky)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-slate-300 mt-1">Register as a customer to book rooms</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" style={{width: '100%'}}>
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Account Information</h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4 pt-4 border-t border-slate-700/50">
            <h3 className="text-lg font-semibold text-white">Personal Information</h3>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none resize-vertical"
                placeholder="Street address, city, country"
                rows="2"
              />
            </div>
          </div>

        </form>
        <div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky bottom-0" style={{ zIndex: 'var(--z-sticky)' }}>
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;
