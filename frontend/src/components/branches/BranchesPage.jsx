import React, { useState, useEffect } from 'react';
import { Building2, Plus, X, MapPin } from 'lucide-react';
import api from '../../utils/api';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Branches</h1>
          <p className="text-gray-600 mt-1">Manage hotel branch locations</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Branch
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No branches found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <div key={branch.branch_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-luxury-gold/10 rounded-lg">
                    <Building2 className="w-6 h-6 text-luxury-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{branch.branch_name}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {branch.location || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium text-gray-900">{branch.contact_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manager:</span>
                    <span className="font-medium text-gray-900">{branch.manager_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateBranchModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBranches();
          }}
        />
      )}
    </div>
  );
};

// Create Branch Modal
const CreateBranchModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    branch_name: '',
    location: '',
    contact_number: '',
    manager_id: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createBranch(formData);
      alert('Branch created successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to create branch: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-gray-900">Add New Branch</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
            <input
              type="text"
              value={formData.branch_name}
              onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <input
              type="tel"
              value={formData.contact_number}
              onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Manager ID</label>
            <input
              type="number"
              value={formData.manager_id}
              onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchesPage;
