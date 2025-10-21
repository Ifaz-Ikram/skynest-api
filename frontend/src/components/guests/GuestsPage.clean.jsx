import React, { useState, useEffect } from 'react';
import { UserCircle, Plus, X } from 'lucide-react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';

const ID_PROOF_OPTIONS = [
  { id: 'NIC', name: 'NIC (National Identity Card)' },
  { id: 'Passport', name: 'Passport' },
  { id: 'Driving License', name: 'Driving License' },
  { id: 'Other', name: 'Other' },
];

const GENDER_OPTIONS = [
  { id: 'Male', name: 'Male' },
  { id: 'Female', name: 'Female' },
  { id: 'Other', name: 'Other' },
];

const GuestsPage = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const data = await api.getGuests();
      console.log('Guests data received:', data);
      setGuests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load guests:', error);
      alert(`Failed to load guests: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading guests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Guests</h1>
          <p className="text-slate-300 mt-1">Manage guest information and records</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Guest
        </button>
      </div>

      {/* Guests Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead>
              <tr className="bg-surface-tertiary">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Guest ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  ID Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  ID Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Total Bookings
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {guests.map((guest) => (
                <tr key={guest.guest_id} className="hover:bg-surface-tertiary">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    #{guest.guest_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircle className="w-5 h-5 text-slate-400 mr-2" />
                      <span className="text-sm font-medium text-white">{guest.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {guest.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {guest.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {guest.id_proof_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {guest.id_proof_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {guest.nationality || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {guest.total_bookings || 0}
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No guests found. Add your first guest to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Guest Modal */}
      {showCreateModal && (
        <CreateGuestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGuests();
          }}
        />
      )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-secondary border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-white">Add New Guest</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ID Proof Type
              </label>
              <SearchableDropdown
                value={formData.id_proof_type}
                onChange={(value) => setFormData({ ...formData, id_proof_type: value })}
                options={ID_PROOF_OPTIONS}
                placeholder="Select ID type"
                className="w-full"
                hideSearch
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ID Proof Number
              </label>
              <input
                type="text"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                placeholder="Enter ID number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                placeholder="e.g., Sri Lankan, American"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gender
              </label>
              <SearchableDropdown
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
                options={GENDER_OPTIONS}
                placeholder="Select gender"
                className="w-full"
                hideSearch
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
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

export default GuestsPage;
