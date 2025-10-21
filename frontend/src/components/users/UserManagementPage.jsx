// frontend/src/components/users/UserManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  RefreshCw,
  Eye,
  MoreVertical,
  Building2,
  Crown,
  CreditCard,
  ClipboardList,
  UserCog,
  X
} from 'lucide-react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

const UserManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [page, roleFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, employeesData, customersData, branchesData] = await Promise.all([
        api.getAllUsers(),
        api.getAllEmployees(),
        api.getCustomers(),
        api.getBranches()
      ]);
      
      setUsers(usersData?.users || usersData || []);
      setEmployees(employeesData?.employees || employeesData || []);
      setCustomers(customersData?.customers || customersData || []);
      setBranches(branchesData?.branches || branchesData || []);
      
      setTotal(users.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'Manager': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'Receptionist': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'Accountant': return <CreditCard className="w-4 h-4 text-orange-600" />;
      case 'Customer': return <Users className="w-4 h-4 text-slate-300" />;
      default: return <UserCog className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-800/30 text-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Manager': return 'bg-blue-800/30 text-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Receptionist': return 'bg-green-800/30 text-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'Accountant': return 'bg-orange-800/30 text-orange-200 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Customer': return 'bg-slate-800 text-slate-100';
      default: return 'bg-slate-800 text-slate-100';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-800/30 text-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive': return 'bg-red-800/30 text-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'suspended': return 'bg-yellow-800/30 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-slate-800 text-slate-100';
    }
  };

  const filteredUsers = users.filter(user => {
    // Filter by active tab
    const matchesTab = activeTab === 'employees' 
      ? ['Admin', 'Manager', 'Receptionist', 'Accountant'].includes(user.role)
      : user.role === 'Customer';
    
    const matchesSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.guest_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesTab && matchesSearch && matchesRole;
  });

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.deleteUser(userId);
        alert('User deleted successfully!');
        loadData();
      } catch (error) {
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const renderUserTable = () => {
    if (loading) return <LoadingSpinner />;

    if (filteredUsers.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
          <p className="text-slate-400">No users match your current filters.</p>
        </div>
      );
    }

    // Check if any user has contact information
    const hasContactInfo = filteredUsers.some(user => {
      return user.employee_email || user.employee_contact || user.guest_email || user.guest_phone;
    });

    return (
      <div className="bg-surface-secondary dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto border border-border dark:border-slate-700 rounded-xl">
          <table className="min-w-full divide-y divide-border dark:divide-slate-700">
            <thead className="bg-surface-tertiary dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                {hasContactInfo && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Contact
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-secondary dark:bg-slate-800 divide-y divide-border dark:divide-slate-700">
              {filteredUsers.map((user) => {
                const branch = branches.find(br => br.branch_id === user.branch_id);
                
                return (
                  <tr key={user.user_id} className="hover:bg-surface-tertiary dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.employee_name || user.guest_name || user.username}
                          </div>
                          <div className="text-sm text-slate-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                      {branch && (
                        <div className="text-xs text-slate-400 mt-1">
                          {branch.branch_name}
                        </div>
                      )}
                    </td>
                    {hasContactInfo && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        <div className="space-y-1">
                          {user.employee_email && (
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.employee_email}
                            </div>
                          )}
                          {user.employee_contact && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.employee_contact}
                            </div>
                          )}
                          {user.guest_email && (
                            <div className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.guest_email}
                            </div>
                          )}
                          {user.guest_phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.guest_phone}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor('active')}`}>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        User ID: {user.user_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const stats = [
      {
        label: 'Total Users',
        value: users.length,
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-800/30'
      },
      {
        label: 'Admins',
        value: users.filter(u => u.role === 'Admin').length,
        icon: Crown,
        color: 'text-purple-600',
        bgColor: 'bg-purple-800/30'
      },
      {
        label: 'Managers',
        value: users.filter(u => u.role === 'Manager').length,
        icon: Shield,
        color: 'text-blue-600',
        bgColor: 'bg-blue-800/30'
      },
      {
        label: 'Staff',
        value: users.filter(u => ['Receptionist', 'Accountant'].includes(u.role)).length,
        icon: UserCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-800/30'
      },
      {
        label: 'Customers',
        value: users.filter(u => u.role === 'Customer').length,
        icon: Users,
        color: 'text-slate-200',
        bgColor: 'bg-slate-800'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-surface-secondary rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-primary dark:bg-slate-950 p-6 space-y-6 transition-colors">
      <LuxuryPageHeader
        title="User Management"
        subtitle="Manage employees and customer accounts"
        icon={Users}
      />

      {/* Stats */}
      {renderStats()}

      {/* Tabs */}
      <div className="bg-surface-secondary rounded-lg shadow">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-300 hover:text-slate-100 hover:border-border dark:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Employees</span>
                <span className="bg-blue-800/30 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {users.filter(u => ['Admin', 'Manager', 'Receptionist', 'Accountant'].includes(u.role)).length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-300 hover:text-slate-100 hover:border-border dark:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Customers</span>
                <span className="bg-green-800/30 text-green-600 text-xs px-2 py-1 rounded-full">
                  {users.filter(u => u.role === 'Customer').length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>
              
              {activeTab === 'employees' && (
                <SearchableDropdown
                  options={[
                    { value: '', label: 'All Employee Roles' },
                    { value: 'Admin', label: 'Admin' },
                    { value: 'Manager', label: 'Manager' },
                    { value: 'Receptionist', label: 'Receptionist' },
                    { value: 'Accountant', label: 'Accountant' }
                  ]}
                  value={roleFilter}
                  onChange={setRoleFilter}
                  placeholder="Filter by role"
                  searchPlaceholder="Search roles..."
                  className="w-full sm:w-48"
                  displayKey="label"
                  valueKey="value"
                  searchKeys={['label']}
                  renderOption={(role) => (
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role.value)}
                      <span>{role.label}</span>
                    </div>
                  )}
                  renderSelected={(role) => (
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role.value)}
                      <span>{role.label}</span>
                    </div>
                  )}
                  emptyMessage="No roles found"
                />
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={loadData}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleCreate}
                className="btn-primary flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add {activeTab === 'employees' ? 'Employee' : 'Customer'}</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          {renderUserTable()}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {(showCreateModal || showEditModal) && (
        <UserModal
          user={editingUser}
          branches={branches}
          users={users}
          activeTab={activeTab}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingUser(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ user, branches, users, activeTab, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: activeTab === 'employees' ? 'Manager' : 'Customer',
    branch_id: '',
    name: '',
    email: '',
    contact_no: ''
  });

  // Reset form when user or activeTab changes
  useEffect(() => {
    setFormData({
      username: user?.username || '',
      password: '',
      role: user?.role || (activeTab === 'employees' ? 'Manager' : 'Customer'),
      branch_id: user?.branch_id || '',
      name: user?.name || '',
      email: user?.email || '',
      contact_no: user?.contact_no || ''
    });
  }, [user, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.role) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!user && !formData.password) {
      alert('Password is required for new users');
      return;
    }
    
    // Validate contact information for all roles
    if (!formData.name || !formData.email || !formData.contact_no) {
      alert('Please fill in all contact information (Name, Email, Contact Number)');
      return;
    }
    
    // Check for duplicate username (client-side validation)
    if (!user && users.some(u => u.username === formData.username)) {
      alert('Username already exists. Please choose a different username.');
      return;
    }
    
    setLoading(true);
    
    // Debug: Log the form data being sent
    console.log('Form data being sent:', formData);
    
    try {
      if (user) {
        await api.updateUser(user.user_id, formData);
        alert('User updated successfully!');
      } else {
        await api.createUser(formData);
        alert('User created successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('User creation/update error:', error);
      if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        alert('Username already exists. Please choose a different username.');
      } else {
        alert('Failed to save user: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password {user ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!user}
              />
            </div>

            <div className="relative z-30">
              <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
              <SearchableDropdown
                options={activeTab === 'employees' ? [
                  { value: 'Admin', label: 'Admin' },
                  { value: 'Manager', label: 'Manager' },
                  { value: 'Receptionist', label: 'Receptionist' },
                  { value: 'Accountant', label: 'Accountant' }
                ] : [
                  { value: 'Customer', label: 'Customer' }
                ]}
                value={formData.role}
                onChange={(value) => setFormData({...formData, role: value})}
                placeholder="Select role"
                searchPlaceholder="Search roles..."
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                displayKey="label"
                valueKey="value"
                searchKeys={['label']}
                renderOption={(role) => (
                  <div className="flex items-center space-x-2">
                    {role.value === 'Admin' && <Crown className="w-4 h-4 text-purple-600" />}
                    {role.value === 'Manager' && <Shield className="w-4 h-4 text-blue-600" />}
                    {role.value === 'Receptionist' && <UserCheck className="w-4 h-4 text-green-600" />}
                    {role.value === 'Accountant' && <CreditCard className="w-4 h-4 text-orange-600" />}
                    {role.value === 'Customer' && <Users className="w-4 h-4 text-slate-300" />}
                    <span>{role.label}</span>
                  </div>
                )}
                renderSelected={(role) => (
                  <div className="flex items-center space-x-2">
                    {role.value === 'Admin' && <Crown className="w-4 h-4 text-purple-600" />}
                    {role.value === 'Manager' && <Shield className="w-4 h-4 text-blue-600" />}
                    {role.value === 'Receptionist' && <UserCheck className="w-4 h-4 text-green-600" />}
                    {role.value === 'Accountant' && <CreditCard className="w-4 h-4 text-orange-600" />}
                    {role.value === 'Customer' && <Users className="w-4 h-4 text-slate-300" />}
                    <span>{role.label}</span>
                  </div>
                )}
                emptyMessage="No roles found"
              />
            </div>

            {formData.role !== 'Customer' && (
              <div className="relative z-20">
                <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                <SearchableDropdown
                  options={branches}
                  value={formData.branch_id}
                  onChange={(value) => setFormData({...formData, branch_id: value})}
                  placeholder="Select branch"
                  searchPlaceholder="Search branches..."
                  className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  displayKey="branch_name"
                  valueKey="branch_id"
                  searchKeys={['branch_name', 'branch_code']}
                  renderOption={(branch) => (
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className="font-medium">{branch.branch_name}</div>
                        <div className="text-sm text-slate-300">{branch.branch_code}</div>
                      </div>
                    </div>
                  )}
                  renderSelected={(branch) => (
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{branch.branch_name}</span>
                      <span className="text-sm text-slate-300">{branch.branch_code}</span>
                    </div>
                  )}
                  emptyMessage="No branches found"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contact Number *</label>
              <input
                type="tel"
                value={formData.contact_no}
                onChange={(e) => setFormData({...formData, contact_no: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagementPage;
