import React, { useState, useEffect, useRef } from 'react';
import { Building2, Plus, X, MapPin, Edit, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => { loadBranches(); }, []);

  const loadBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this branch?')) {
      try { await api.deleteBranch(id); loadBranches(); }
      catch (error) { alert('Failed: ' + error.message); }
    }
  };

  if (loading) return <LoadingSpinner size="xl" message="Loading branches..." />;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader title="Branches" description="Manage hotel branch locations" icon={Building2}
          stats={[{ label: 'Total', value: branches.length }, { label: 'Active', value: branches.filter(b => b.is_active !== false).length }]}
          actions={[{ label: 'Add Branch', icon: Plus, onClick: () => setShowCreateModal(true) }]}
        />

        <div className="bg-white rounded-xl shadow-lg p-6">
          {branches.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-20 h-20 mx-auto mb-4" style={{ color: '#dee2e6' }} />
              <p style={{ color: '#6c757d' }}>No branches found</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div key={branch.branch_id} className="rounded-xl p-6" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#e3f2fd' }}>
                      <Building2 className="w-6 h-6" style={{ color: '#0d47a1' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: '#1a237e' }}>{branch.branch_name}</h3>
                      <p className="text-sm flex items-center gap-1" style={{ color: '#6c757d' }}><MapPin className="w-4 h-4" />{branch.location || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid #e9ecef' }}>
                    <button onClick={() => { setSelectedBranch(branch); setShowEditModal(true); }} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}><Edit className="w-4 h-4" />Edit</button>
                    <button onClick={() => handleDelete(branch.branch_id)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}><Trash2 className="w-4 h-4" />Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && <BranchModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadBranches(); }} />}
        {showEditModal && selectedBranch && <BranchModal branch={selectedBranch} onClose={() => { setShowEditModal(false); setSelectedBranch(null); }} onSuccess={() => { setShowEditModal(false); setSelectedBranch(null); loadBranches(); }} />}
      </div>
    </div>
  );
};

const BranchModal = ({ branch, onClose, onSuccess }) => {
  const isEdit = !!branch;
  const [formData, setFormData] = useState({ branch_name: branch?.branch_name || '', branch_code: branch?.branch_code || '', city: branch?.city || '', phone: branch?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await api.updateBranch(branch.branch_id, formData);
      else await api.createBranch({ branch_name: formData.branch_name, branch_code: formData.branch_code, address: formData.city, contact_number: formData.phone });
      onSuccess();
    } catch (error) { alert('Failed: ' + error.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="px-6 py-5 border-b flex justify-between items-center" style={{ backgroundColor: '#e3f2fd' }}>
          <h2 className="text-2xl font-bold" style={{ color: '#1a237e' }}>{isEdit ? 'Edit Branch' : 'Add Branch'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'white' }}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Branch Name *</label><input type="text" value={formData.branch_name} onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef' }} required /></div>
          <div><label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Branch Code *</label><input type="text" value={formData.branch_code} onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef' }} required /></div>
          <div><label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>City *</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef' }} required /></div>
          <div><label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Contact</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef' }} /></div>
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 rounded-xl" style={{ backgroundColor: '#e9ecef' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>{loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchesPage;
