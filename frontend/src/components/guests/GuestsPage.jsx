import React, { useState, useEffect, useMemo } from 'react';
import { UserCircle, Plus, X, Users, Download, Calendar, CheckCircle, Edit, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { LuxuryPageHeader, LoadingSpinner } from '../common';
import SearchableDropdown from '../common/SearchableDropdown';

const GuestsPage = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const pageSizeOptions = useMemo(
    () => [
      { id: '25', name: '25 per page' },
      { id: '50', name: '50 per page' },
      { id: '100', name: '100 per page' },
    ],
    [],
  );

  const idProofOptions = useMemo(
    () => [
      { id: 'NIC', name: 'NIC (National Identity Card)' },
      { id: 'Passport', name: 'Passport' },
      { id: 'Driving License', name: 'Driving License' },
      { id: 'Other', name: 'Other' },
    ],
    [],
  );

  const genderOptions = useMemo(
    () => [
      { id: '', name: 'Select gender' },
      { id: 'Male', name: 'Male' },
      { id: 'Female', name: 'Female' },
      { id: 'Other', name: 'Other' },
    ],
    [],
  );

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: filters.limit || pagination.limit,
        ...filters
      };
      
      const response = await api.getGuests(params);
      console.log('Guests data received:', response);
      
      // Handle both paginated and non-paginated responses
      const guestsList = response?.guests || response?.data || response || [];
      const total = response?.total || guestsList.length;
      const totalPages = Math.ceil(total / (filters.limit || pagination.limit));
      
      setGuests(Array.isArray(guestsList) ? guestsList : []);
      
      setPagination(prev => ({
        ...prev,
        page,
        total,
        totalPages
      }));
    } catch (error) {
      console.error('Failed to load guests:', error);
      alert(`Failed to load guests: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        icon={Users}
        message="Loading guests..."
        submessage="Fetching guest records"
      />
    );
  }

  // Calculate stats for header
  const activeGuests = guests.filter(g => (g.total_bookings || 0) > 0).length;
  const totalBookings = guests.reduce((sum, g) => sum + (g.total_bookings || 0), 0);

  const headerStats = [
    { label: 'Total Guests', value: guests.length },
    { label: 'Active Guests', value: activeGuests },
    { label: 'Total Bookings', value: totalBookings }
  ];

  const handleExport = () => {
    if (!guests || !guests.length) return alert('No data to export');
    const header = ['guest_id','full_name','email','phone','id_proof_type','id_proof_number','nationality','total_bookings'];
    const rows = guests.map(g => [
      g.guest_id,
      g.full_name,
      g.email || '',
      g.phone || '',
      g.id_proof_type || '',
      g.id_proof_number || '',
      g.nationality || '',
      g.total_bookings || 0
    ]);
    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (guest) => {
    setEditingGuest(guest);
    setShowEditModal(true);
  };

  const handleDelete = async (guestId) => {
    if (!window.confirm('Are you sure you want to delete this guest? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteGuest(guestId);
      alert('Guest deleted successfully!');
      loadGuests(pagination.page);
    } catch (error) {
      alert('Failed to delete guest: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Keep the Luxury Gradient Header */}
        <LuxuryPageHeader
          title="Guest Directory"
          description="Manage guest information and records across all properties"
          icon={Users}
          stats={headerStats}
        />

        {/* Action Bar - White Card Style */}
        <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-text-secondary">
            Guest Records
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Guest
            </button>
          </div>
        </div>
      </div>

      {/* Guests Table */}
      <div className="card bg-surface-secondary dark:bg-slate-800">
        <div className="overflow-x-auto border border-border dark:border-slate-700 rounded-xl">
          <table className="min-w-full divide-y divide-border dark:divide-slate-700">
            <thead>
              <tr className="bg-surface-tertiary">
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Guest ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  ID Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  ID Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Total Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-secondary dark:bg-slate-800 divide-y divide-border dark:divide-slate-700">
              {guests.map((guest) => (
                <tr key={guest.guest_id} className="hover:bg-surface-tertiary dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    #{guest.guest_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircle className="w-5 h-5 text-text-tertiary mr-2" />
                      <span className="text-sm font-medium text-text-primary">{guest.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {guest.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {guest.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {guest.id_proof_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {guest.id_proof_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {guest.nationality || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {guest.total_bookings || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(guest)}
                        className="text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 p-1 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/20"
                        title="Edit Guest"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(guest.guest_id)}
                        className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 p-1 rounded transition-colors hover:bg-red-50 dark:hover:bg-red-500/20"
                        title="Delete Guest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-text-tertiary">
                    No guests found. Add your first guest to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls & Info */}
        <div className="mt-6 border-t pt-6 px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-text-secondary">
              Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> guests
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <label htmlFor="pageSize">Per page:</label>
              <SearchableDropdown
                id="pageSize"
                value={String(pagination.limit)}
                onChange={(value) => {
                  const newLimit = Number(value);
                  const resolvedLimit = Number.isNaN(newLimit) ? pagination.limit : newLimit;
                  setPagination({ ...pagination, limit: resolvedLimit, page: 1 });
                  loadGuests(1, { limit: resolvedLimit });
                }}
                options={pageSizeOptions}
                hideSearch
                clearable={false}
                className="min-w-[140px]"
                buttonClassName="!px-2 !py-1 border border-border dark:border-slate-600 rounded-md text-sm focus-visible:!ring-luxury-gold focus-visible:!ring-offset-0"
              />
            </div>
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => loadGuests(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm font-medium border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 6, pagination.page - 3)) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => loadGuests(pageNum)}
                      className={`min-w-[40px] px-3 py-2 text-sm font-medium border rounded-md transition-all ${
                        pageNum === pagination.page
                          ? 'bg-luxury-gold text-white border-luxury-gold shadow-md scale-105'
                          : 'border-border dark:border-slate-600 hover:bg-surface-tertiary dark:bg-slate-700/30 hover:border-gray-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => loadGuests(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium border border-border dark:border-slate-600 rounded-md hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Guest Modal */}
      {showCreateModal && (
        <CreateGuestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGuests(pagination.page);
          }}
        />
      )}

      {/* Edit Guest Modal */}
      {showEditModal && editingGuest && (
        <EditGuestModal
          guest={editingGuest}
          onClose={() => {
            setShowEditModal(false);
            setEditingGuest(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingGuest(null);
            loadGuests(pagination.page);
          }}
        />
      )}
      </div>
    </div>
  );
};

// Create Guest Modal Component
const CreateGuestModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    nationality: '',
    gender: '',
    date_of_birth: '',
    id_proof_type: '',
    id_proof_number: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createGuest(formData);
      alert('Guest created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Failed to create guest:', error);
      alert(error.message || 'Failed to create guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-secondary border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-text-primary">Add New Guest</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                ID Proof Type <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                value={formData.id_proof_type}
                onChange={(value) => setFormData({ ...formData, id_proof_type: value })}
                options={idProofOptions}
                placeholder="Select ID type"
                className="w-full"
                clearable={false}
                hideSearch
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                ID Proof Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="input-field"
                placeholder="Enter ID number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="input-field"
                placeholder="e.g., Sri Lankan, American"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Gender
              </label>
              <SearchableDropdown
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                options={genderOptions}
                placeholder="Select gender"
                className="w-full"
                hideSearch
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Guest Modal Component
const EditGuestModal = ({ guest, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: guest?.full_name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    id_proof_type: guest?.id_proof_type || '',
    id_proof_number: guest?.id_proof_number || '',
    nationality: guest?.nationality || '',
    gender: guest?.gender || '',
    date_of_birth: guest?.date_of_birth || '',
    address: guest?.address || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (guest) {
      setFormData({
        full_name: guest.full_name || '',
        email: guest.email || '',
        phone: guest.phone || '',
        id_proof_type: guest.id_proof_type || '',
        id_proof_number: guest.id_proof_number || '',
        nationality: guest.nationality || '',
        gender: guest.gender || '',
        date_of_birth: guest.date_of_birth || '',
        address: guest.address || ''
      });
    }
  }, [guest]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateGuest(guest.guest_id, formData);
      alert('Guest updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      alert('Failed to update guest: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-display font-bold text-text-primary">
            Edit Guest
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input-field"
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                ID Type <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                value={formData.id_proof_type}
                onChange={(value) => setFormData({ ...formData, id_proof_type: value })}
                options={idProofOptions}
                placeholder="Select ID Type"
                className="w-full"
                hideSearch
                clearable={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                ID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="input-field"
                placeholder="Enter ID number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="input-field"
                placeholder="e.g., Sri Lankan, American"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Gender
              </label>
              <SearchableDropdown
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                options={genderOptions}
                placeholder="Select gender"
                className="w-full"
                hideSearch
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Enter address"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestsPage;
