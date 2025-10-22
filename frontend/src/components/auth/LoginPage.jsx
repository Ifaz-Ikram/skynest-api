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
      
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full" style={{minWidth: '420px'}}>
            {/* Enhanced Logo & Header */}
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-lg opacity-75 animate-pulse-glow"></div>
                <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
                  <Hotel className="w-14 h-14 text-white drop-shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-yellow-800" />
                  </div>
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-3 drop-shadow-lg">
                SkyNest Hotel
              </h1>
              <p className="text-xl text-blue-200 font-medium tracking-wide">Luxury Management System</p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
            </div>

            {/* Enhanced Login Form */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-slate-300">Sign in to your account</p>
                </div>
                
                {error && (
                  <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-6 flex items-center backdrop-blur-sm">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-200">Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-4 bg-slate-700/50 backdrop-blur-sm border-2 rounded-xl text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                          focusedField === 'username' 
                            ? 'border-blue-500 bg-slate-700/70' 
                            : 'border-slate-600/50 hover:border-slate-500/70'
                        }`}
                        placeholder="Enter your username"
                        required
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 pointer-events-none shimmer"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-200">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-4 pr-12 bg-slate-700/50 backdrop-blur-sm border-2 rounded-xl text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                          focusedField === 'password' 
                            ? 'border-blue-500 bg-slate-700/70' 
                            : 'border-slate-600/50 hover:border-slate-500/70'
                        }`}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25"
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
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <p className="text-xs font-semibold text-slate-200 mb-3 text-center">Demo Accounts</p>
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
                          className={`group relative overflow-hidden bg-gradient-to-r ${user.color} p-2 rounded-lg text-left transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">{user.role}</div>
                              <div className="text-xs text-white/80">{user.username}</div>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Register Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-300">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setShowRegister(true)}
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 hover:underline"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-400 text-sm mt-8">
              © 2025 SkyNest Hotel. All rights reserved.
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
