import React, { useState, useEffect } from 'react';
import { Building2, Plus, X, MapPin, Edit, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

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

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      try {
        await api.deleteBranch(id);
        alert('Branch deleted successfully!');
        loadBranches(); // Refresh the list
      } catch (error) {
        alert('Failed to delete branch: ' + error.message);
      }
    }
  };

  // Calculate stats
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.is_active !== false).length;

  if (loading) {
    return <LoadingSpinner size="xl" message="Loading branches..." />;
  }

  return (
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Branches"
          description="Manage hotel branch locations"
          icon={Building2}
          stats={[
            { label: 'Total Branches', value: totalBranches, trend: `${activeBranches} active` },
            { label: 'Locations', value: new Set(branches.map(b => b.city || b.branch_id)).size, trend: 'Cities' },
            { label: 'Network', value: branches.length > 0 ? 'Multi-branch' : 'Single', trend: 'Hotel chain' },
          ]}
          actions={[{
            label: 'Add Branch',
            icon: Plus,
            onClick: () => setShowCreateModal(true),
            variant: 'secondary'
          }]}
        />

      <div className="card">
        {branches.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-text-secondary">No branches found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <div key={branch.branch_id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-luxury-gold/10 rounded-lg">
                    <Building2 className="w-6 h-6 text-luxury-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary text-lg">{branch.branch_name}</h3>
                    <p className="text-sm text-text-secondary mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {branch.location || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Contact:</span>
                    <span className="font-medium text-text-primary">{branch.contact_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Manager:</span>
                    <span className="font-medium text-text-primary">{branch.manager_name || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(branch.branch_id)}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <BranchModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBranches();
          }}
        />
      )}

      {showEditModal && selectedBranch && (
        <BranchModal
          branch={selectedBranch}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBranch(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedBranch(null);
            loadBranches();
          }}
        />
      )}
      </div>
    </div>
  );
};

// Branch Modal (Create/Edit)
const BranchModal = ({ branch, onClose, onSuccess }) => {
  const isEdit = !!branch;
  const [formData, setFormData] = useState({
    branch_name: branch?.branch_name || '',
    branch_code: branch?.branch_code || '',
    city: branch?.city || branch?.location || '',
    phone: branch?.phone || branch?.contact_number || '',
    manager_id: branch?.manager_id || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateBranch(branch.branch_id, formData);
        alert('Branch updated successfully!');
      } else {
        const payload = {
          branch_name: formData.branch_name,
          branch_code: formData.branch_code,
          address: formData.city, // Map city to address field
          contact_number: formData.phone, // Map phone to contact_number field
        };
        await api.createBranch(payload);
        alert('Branch created successfully!');
      }
      onSuccess();
    } catch (error) {
      alert(`Failed to ${isEdit ? 'update' : 'create'} branch: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-text-primary">
            {isEdit ? 'Edit Branch' : 'Add New Branch'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Branch Name</label>
            <input
              type="text"
              value={formData.branch_name}
              onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Branch Code</label>
            <input
              type="text"
              value={formData.branch_code}
              onChange={(e) => setFormData({...formData, branch_code: e.target.value})}
              className="input-field"
              placeholder="e.g., COL-01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Contact Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Manager ID</label>
            <input
              type="number"
              value={formData.manager_id}
              onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Branch' : 'Create Branch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Legacy wrapper for backward compatibility
const CreateBranchModal = BranchModal;

export default BranchesPage;
