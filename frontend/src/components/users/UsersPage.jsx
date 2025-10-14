import { useState, useEffect } from 'react';
import { Users, UserCircle } from 'lucide-react';
import api from '../../utils/api';
import { CreateUserModal } from './CreateUserModal';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('🔍 Loading users from /api/admin/users...');
      const data = await api.request('/api/admin/users');
      console.log('✅ Users loaded:', data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Create and manage employee accounts (Admin/Manager)</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Users className="w-5 h-5 mr-2 inline" />
          Add Employee
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {users.map(user => (
              <div key={user.user_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center">
                      <UserCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};
