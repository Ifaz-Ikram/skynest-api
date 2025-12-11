// frontend/src/components/users/UserManagementPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Edit, Trash2, Search, Shield, UserCheck, Mail, Phone, Calendar, RefreshCw, Building2, Crown, CreditCard, UserCog, X
} from 'lucide-react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

const UserManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [activeTab, setActiveTab] = useState('employees');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, branchesData] = await Promise.all([api.getAllUsers(), api.getBranches()]);
      setUsers(usersData?.users || usersData || []);
      setBranches(branchesData?.branches || branchesData || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const getRoleIcon = (role) => {
    const iconMap = {
      'Admin': <Crown className="w-4 h-4" style={{ color: '#6f42c1' }} />,
      'Manager': <Shield className="w-4 h-4" style={{ color: '#0d6efd' }} />,
      'Receptionist': <UserCheck className="w-4 h-4" style={{ color: '#28a745' }} />,
      'Accountant': <CreditCard className="w-4 h-4" style={{ color: '#fd7e14' }} />,
      'Customer': <Users className="w-4 h-4" style={{ color: '#6c757d' }} />
    };
    return iconMap[role] || <UserCog className="w-4 h-4" style={{ color: '#6c757d' }} />;
  };

  const getRoleBadgeStyle = (role) => {
    const styleMap = {
      'Admin': { backgroundColor: '#e8d4f8', color: '#6f42c1' },
      'Manager': { backgroundColor: '#cfe2ff', color: '#0d47a1' },
      'Receptionist': { backgroundColor: '#d4edda', color: '#155724' },
      'Accountant': { backgroundColor: '#ffe5d0', color: '#984c0c' },
      'Customer': { backgroundColor: '#e9ecef', color: '#495057' }
    };
    return styleMap[role] || { backgroundColor: '#e9ecef', color: '#495057' };
  };

  const filteredUsers = users.filter(user => {
    const matchesTab = activeTab === 'employees'
      ? ['Admin', 'Manager', 'Receptionist', 'Accountant'].includes(user.role)
      : user.role === 'Customer';
    const matchesSearch = !searchTerm ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.guest_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesTab && matchesSearch && matchesRole;
  });

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try { await api.deleteUser(userId); loadData(); }
      catch (error) { alert('Failed to delete user: ' + error.message); }
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: '#0d6efd', bg: '#cfe2ff' },
    { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, icon: Crown, color: '#6f42c1', bg: '#e8d4f8' },
    { label: 'Managers', value: users.filter(u => u.role === 'Manager').length, icon: Shield, color: '#0d6efd', bg: '#cfe2ff' },
    { label: 'Staff', value: users.filter(u => ['Receptionist', 'Accountant'].includes(u.role)).length, icon: UserCheck, color: '#28a745', bg: '#d4edda' },
    { label: 'Customers', value: users.filter(u => u.role === 'Customer').length, icon: Users, color: '#6c757d', bg: '#e9ecef' }
  ];

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#f8f9fa' }}>
      <LuxuryPageHeader title="User Management" subtitle="Manage employees and customer accounts" icon={Users} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: stat.bg }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#6c757d' }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: '#1a237e' }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b" style={{ borderColor: '#dee2e6' }}>
          <nav className="flex space-x-4 px-6">
            {['employees', 'customers'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="py-4 px-2 text-sm font-medium transition-colors"
                style={activeTab === tab
                  ? { borderBottom: '2px solid #0d47a1', color: '#0d47a1' }
                  : { color: '#6c757d' }}
              >
                <div className="flex items-center gap-2">
                  {tab === 'employees' ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
                    {users.filter(u => tab === 'employees' ? ['Admin', 'Manager', 'Receptionist', 'Accountant'].includes(u.role) : u.role === 'Customer').length}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#6c757d' }} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg w-64 border-2 focus:outline-none focus:border-blue-500"
                  style={{ borderColor: '#e9ecef', color: '#333' }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={loadData} className="px-4 py-2 rounded-lg font-medium flex items-center gap-2" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={() => { setEditingUser(null); setShowCreateModal(true); }} className="px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
                <UserPlus className="w-4 h-4" /> Add {activeTab === 'employees' ? 'Employee' : 'Customer'}
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? <LoadingSpinner /> : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#dee2e6' }} />
              <p style={{ color: '#6c757d' }}>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: '#e3f2fd' }}>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#e9ecef' }}>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e9ecef' }}>
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: '#1a237e' }}>{user.employee_name || user.guest_name || user.username}</div>
                            <div className="text-sm" style={{ color: '#6c757d' }}>@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full" style={getRoleBadgeStyle(user.role)}>{user.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6c757d' }}>
                        {user.employee_email || user.guest_email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: '#d4edda', color: '#155724' }}>Active</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingUser(user); setShowEditModal(true); }} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(user.user_id)} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {(showCreateModal || showEditModal) && (
        <UserModal
          user={editingUser}
          branches={branches}
          users={users}
          activeTab={activeTab}
          onClose={() => { setShowCreateModal(false); setShowEditModal(false); setEditingUser(null); }}
          onSuccess={() => { setShowCreateModal(false); setShowEditModal(false); setEditingUser(null); loadData(); }}
        />
      )}
    </div>
  );
};

const UserModal = ({ user, branches, users, activeTab, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    role: user?.role || (activeTab === 'employees' ? 'Manager' : 'Customer'),
    branch_id: user?.branch_id || '',
    name: user?.name || '',
    email: user?.email || '',
    contact_no: user?.contact_no || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.role || (!user && !formData.password)) {
      alert('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      if (user) await api.updateUser(user.user_id, formData);
      else await api.createUser(formData);
      onSuccess();
    } catch (error) { alert('Failed: ' + error.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
          <h2 className="text-2xl font-bold" style={{ color: '#1a237e' }}>{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'white', color: '#6c757d' }}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Username *</label>
              <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Password {user ? '(optional)' : '*'}</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required={!user} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Full Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Contact Number *</label>
              <input type="tel" value={formData.contact_no} onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 rounded-xl font-medium" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>{loading ? 'Saving...' : (user ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagementPage;
