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

  const activeGuests = guests.filter(g => (g.total_bookings || 0) > 0).length;
  const totalBookings = guests.reduce((sum, g) => sum + (g.total_bookings || 0), 0);

  const headerStats = [
    { label: 'Total Guests', value: guests.length },
    { label: 'Active Guests', value: activeGuests },
    { label: 'Total Bookings', value: totalBookings }
  ];

  const handleExport = () => {
    if (!guests || !guests.length) return alert('No data to export');
    const header = ['guest_id', 'full_name', 'email', 'phone', 'id_proof_type', 'id_proof_number', 'nationality', 'total_bookings'];
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
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
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
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Guest Directory"
          description="Manage guest information and records across all properties"
          icon={Users}
          stats={headerStats}
        />

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold" style={{ color: '#1a237e' }}>
              Guest Records
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: 'white',
                  color: '#1a237e',
                  border: '2px solid #e9ecef'
                }}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                  boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)'
                }}
              >
                <Plus className="w-5 h-5" />
                Add Guest
              </button>
            </div>
          </div>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ backgroundColor: '#e3f2fd' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    Guest ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    ID Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    ID Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    Nationality
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    Bookings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#1a237e' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#e9ecef' }}>
                {guests.map((guest) => (
                  <tr key={guest.guest_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#1a237e' }}>
                      #{guest.guest_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full mr-3" style={{ backgroundColor: '#e3f2fd' }}>
                          <UserCircle className="w-5 h-5" style={{ color: '#0d47a1' }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: '#333' }}>{guest.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6c757d' }}>
                      {guest.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6c757d' }}>
                      {guest.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6c757d' }}>
                      {guest.id_proof_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6c757d' }}>
                      {guest.id_proof_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#6c757d' }}>
                      {guest.nationality || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: guest.total_bookings > 0 ? '#d4edda' : '#e9ecef',
                          color: guest.total_bookings > 0 ? '#155724' : '#6c757d'
                        }}
                      >
                        {guest.total_bookings || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(guest)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}
                          title="Edit Guest"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(guest.guest_id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}
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
                    <td colSpan="9" className="px-6 py-12 text-center" style={{ color: '#6c757d' }}>
                      No guests found. Add your first guest to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t px-6 py-4" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm" style={{ color: '#6c757d' }}>
                Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-semibold">{pagination.total}</span> guests
              </div>

              <div className="flex items-center gap-2 text-sm" style={{ color: '#6c757d' }}>
                <label>Per page:</label>
                <SearchableDropdown
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
                  className="min-w-[120px]"
                />
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => loadGuests(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'white', color: '#1a237e', border: '1px solid #dee2e6' }}
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
                        className="min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-all"
                        style={pageNum === pagination.page ? {
                          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(26, 35, 126, 0.3)'
                        } : {
                          backgroundColor: 'white',
                          color: '#1a237e',
                          border: '1px solid #dee2e6'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => loadGuests(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'white', color: '#1a237e', border: '1px solid #dee2e6' }}
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

// Create Guest Modal
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

  const idProofOptions = [
    { id: 'NIC', name: 'NIC (National Identity Card)' },
    { id: 'Passport', name: 'Passport' },
    { id: 'Driving License', name: 'Driving License' },
    { id: 'Other', name: 'Other' },
  ];

  const genderOptions = [
    { id: '', name: 'Select gender' },
    { id: 'Male', name: 'Male' },
    { id: 'Female', name: 'Female' },
    { id: 'Other', name: 'Other' },
  ];

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ minWidth: '600px' }}>
        <div className="px-6 py-5 border-b sticky top-0 z-10 flex justify-between items-center" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
          <h2 className="text-2xl font-bold" style={{ color: '#1a237e' }}>Add New Guest</h2>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'white', color: '#6c757d' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333' }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333' }}
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative z-30">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
                ID Proof Type *
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
            <div className="relative z-20">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
                ID Proof Number *
              </label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="Enter ID number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative z-20">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Nationality</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="e.g., Sri Lankan"
              />
            </div>
            <div className="relative z-10">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Gender</label>
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
            <div className="relative z-10">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium transition-colors"
              style={{ backgroundColor: '#e9ecef', color: '#495057' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Guest Modal
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

  const idProofOptions = [
    { id: 'NIC', name: 'NIC (National Identity Card)' },
    { id: 'Passport', name: 'Passport' },
    { id: 'Driving License', name: 'Driving License' },
    { id: 'Other', name: 'Other' },
  ];

  const genderOptions = [
    { id: '', name: 'Select gender' },
    { id: 'Male', name: 'Male' },
    { id: 'Female', name: 'Female' },
    { id: 'Other', name: 'Other' },
  ];

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ minWidth: '600px' }}>
        <div className="px-6 py-5 border-b sticky top-0 z-10 flex justify-between items-center" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
          <h2 className="text-2xl font-bold" style={{ color: '#1a237e' }}>Edit Guest</h2>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'white', color: '#6c757d' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333' }}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative z-30">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>ID Type *</label>
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
            <div className="relative z-20">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>ID Number *</label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="Enter ID number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative z-20">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Nationality</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ borderColor: '#e9ecef', color: '#333' }}
                placeholder="e.g., Sri Lankan"
              />
            </div>
            <div className="relative z-10">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Gender</label>
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

          <div className="relative z-10">
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Date of Birth</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333' }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e9ecef', color: '#333' }}
              rows="3"
              placeholder="Enter address"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium transition-colors"
              style={{ backgroundColor: '#e9ecef', color: '#495057' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestsPage;
