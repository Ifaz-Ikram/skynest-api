import React, { useState } from 'react';
import { Hotel, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import RegistrationModal from './RegistrationModal';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(username, password);
      
      // Store token and user data in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Call onLogin to update App state
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Admin' },
    { username: 'manager', password: 'manager123', role: 'Manager' },
    { username: 'receptionist', password: 'receptionist123', role: 'Receptionist' },
    { username: 'accountant', password: 'accountant123', role: 'Accountant' },
    { username: 'customer', password: 'customer123', role: 'Customer' },
  ];

  return (
    <div className="min-h-screen luxury-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full" style={{minWidth: '400px'}}>
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-luxury-gold rounded-2xl mb-4 shadow-luxury">
            <Hotel className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">SkyNest Hotel</h1>
          <p className="text-blue-100">Luxury Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-surface-secondary rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
          
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" style={{width: '100%'}}>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.20)',
                  borderColor: 'rgba(203, 213, 225, 0.7)',
                  color: 'rgb(255, 255, 255)',
                  fontWeight: '500'
                }}
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.20)',
                  borderColor: 'rgba(203, 213, 225, 0.7)',
                  color: 'rgb(255, 255, 255)',
                  fontWeight: '500'
                }}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-medium text-slate-200 mb-3">Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.username}
                  onClick={() => {
                    setUsername(user.username);
                    setPassword(user.password);
                  }}
                  className="text-xs px-3 py-2 rounded-lg text-left transition-colors border-2"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(203, 213, 225, 0.5)',
                    color: 'rgb(255, 255, 255)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.5)';
                  }}
                >
                  <div className="font-medium text-white">{user.role}</div>
                  <div className="text-slate-300">{user.username}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-200">
              Don't have an account?{' '}
              <button
                onClick={() => setShowRegister(true)}
                className="text-luxury-gold hover:text-luxury-darkGold font-medium"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-100 text-sm mt-6">
          © 2025 SkyNest Hotel. All rights reserved.
        </p>
      </div>

      {/* Registration Modal */}
      {showRegister && (
        <RegistrationModal 
          onClose={() => setShowRegister(false)}
          onSuccess={(username, password) => {
            setShowRegister(false);
            setUsername(username);
            setPassword(password);
            setError('');
          }}
        />
      )}
    </div>
  );
};

export default LoginPage;
