import React, { useState, useEffect } from 'react';
import { Hotel, AlertCircle, Eye, EyeOff, Sparkles, Shield, Users, CreditCard, UserCheck } from 'lucide-react';
import api from '../../utils/api';
import RegistrationModal from './RegistrationModal';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Add some floating animation for the background
  useEffect(() => {
    const createFloatingElement = () => {
      const element = document.createElement('div');
      element.className = 'floating-element';
      element.style.cssText = `
        position: fixed;
        width: ${Math.random() * 100 + 50}px;
        height: ${Math.random() * 100 + 50}px;
        background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 100}vh;
        animation: float ${Math.random() * 20 + 10}s linear infinite;
      `;
      document.body.appendChild(element);
      
      setTimeout(() => {
        element.remove();
      }, 30000);
    };

    const interval = setInterval(createFloatingElement, 2000);
    return () => clearInterval(interval);
  }, []);

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
    { username: 'admin', password: 'admin123', role: 'Admin', icon: Shield, color: 'from-red-500 to-red-600' },
    { username: 'manager', password: 'manager123', role: 'Manager', icon: Users, color: 'from-purple-500 to-purple-600' },
    { username: 'receptionist', password: 'receptionist123', role: 'Receptionist', icon: UserCheck, color: 'from-blue-500 to-blue-600' },
    { username: 'accountant', password: 'accountant123', role: 'Accountant', icon: CreditCard, color: 'from-green-500 to-green-600' },
    { username: 'customer', password: 'customer123', role: 'Customer', icon: Users, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
      
      <div className="min-h-screen relative overflow-hidden" style={{ background: '#F8FAFC' }}>
        {/* Gradient Overlay */}
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.03) 0%, rgba(13, 71, 161, 0.05) 100%)' 
        }}></div>
        
        {/* Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a237e' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse" style={{ background: 'rgba(26, 35, 126, 0.08)' }}></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full blur-3xl animate-pulse delay-1000" style={{ background: 'rgba(13, 71, 161, 0.08)' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full blur-3xl animate-pulse delay-500" style={{ background: 'rgba(26, 35, 126, 0.06)' }}></div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full" style={{minWidth: '420px'}}>
            {/* Enhanced Logo & Header */}
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-3xl blur-lg opacity-50" style={{ background: 'rgba(26, 35, 126, 0.1)' }}></div>
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
                  <Hotel className="w-14 h-14 text-white drop-shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-yellow-800" />
                  </div>
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-3" style={{ color: '#1a237e' }}>
                SkyNest Hotels
              </h1>
              <p className="text-xl font-medium tracking-wide" style={{ color: '#495057' }}>Luxury Hospitality Management</p>
              <div className="w-24 h-1 mx-auto mt-4 rounded-full" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}></div>
            </div>

            {/* Enhanced Login Form */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-20" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}></div>
              <div className="relative rounded-3xl p-8" style={{ 
                background: 'white',
                boxShadow: '0 20px 60px rgba(26, 35, 126, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(226, 232, 240, 0.8)'
              }}>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#1a237e' }}>Welcome Back</h2>
                  <p style={{ color: '#495057' }}>Sign in to your account</p>
                </div>
                
                {error && (
                  <div className="px-4 py-3 rounded-xl mb-6 flex items-center" style={{ 
                    background: '#fee2e2', 
                    border: '2px solid #ef4444', 
                    color: '#991b1b' 
                  }}>
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: '#dc2626' }} />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold" style={{ color: '#495057' }}>Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={(e) => {
                          setFocusedField('username');
                          e.target.style.borderColor = '#1a237e';
                          e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
                        }}
                        onBlur={(e) => {
                          setFocusedField(null);
                          e.target.style.borderColor = '#dee2e6';
                          e.target.style.boxShadow = 'none';
                        }}
                        className="w-full px-4 py-4 border-2 rounded-xl transition-all duration-300 focus:outline-none"
                        style={{
                          background: 'white',
                          borderColor: '#dee2e6',
                          color: '#495057',
                        }}
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold" style={{ color: '#495057' }}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={(e) => {
                          setFocusedField('password');
                          e.target.style.borderColor = '#1a237e';
                          e.target.style.boxShadow = '0 0 0 3px rgba(26, 35, 126, 0.1)';
                        }}
                        onBlur={(e) => {
                          setFocusedField(null);
                          e.target.style.borderColor = '#dee2e6';
                          e.target.style.boxShadow = 'none';
                        }}
                        className="w-full px-4 py-4 pr-12 border-2 rounded-xl transition-all duration-300 focus:outline-none"
                        style={{
                          background: 'white',
                          borderColor: '#dee2e6',
                          color: '#495057',
                        }}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
                        style={{ color: '#6c757d' }}
                        onMouseEnter={(e) => e.target.style.color = '#1a237e'}
                        onMouseLeave={(e) => e.target.style.color = '#6c757d'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="dropdown-option-button w-full py-4 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                      boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.boxShadow = '0 6px 20px rgba(26, 35, 126, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.target.style.boxShadow = '0 4px 12px rgba(26, 35, 126, 0.3)';
                      }
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Enhanced Demo Credentials */}
                <div className="mt-6 pt-4" style={{ borderTop: '1px solid #dee2e6' }}>
                  <p className="text-xs font-semibold mb-3 text-center" style={{ color: '#495057' }}>Demo Accounts</p>
                  <div className="grid grid-cols-2 gap-2">
                    {demoUsers.map((user) => {
                      const IconComponent = user.icon;
                      return (
                        <button
                          key={user.username}
                          onClick={() => {
                            setUsername(user.username);
                            setPassword(user.password);
                          }}
                          className="dropdown-option-button group relative overflow-hidden p-2 rounded-lg text-left transition-all duration-300 transform hover:scale-[1.02]"
                          style={{
                            background: '#f8f9fa',
                            border: '1px solid #dee2e6',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.setProperty('background', 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 'important');
                            e.currentTarget.style.borderColor = '#1a237e';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#dee2e6';
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold" style={{ color: '#1a237e' }}>{user.role}</div>
                              <div className="text-xs" style={{ color: '#6c757d' }}>{user.username}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Register Link */}
                <div className="mt-6 text-center px-4">
                  <p className="text-sm" style={{ color: '#495057' }}>
                    Don't have an account?{' '}
                    <span
                      onClick={() => setShowRegister(true)}
                      className="font-semibold transition-colors duration-200 hover:underline cursor-pointer"
                      style={{ color: '#1a237e' }}
                    >
                      Create Account
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm mt-8" style={{ color: '#6c757d' }}>
              © 2025 SkyNest Hotels. All rights reserved.
            </p>
          </div>
        </div>
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
    </>
  );
};

export default LoginPage;
