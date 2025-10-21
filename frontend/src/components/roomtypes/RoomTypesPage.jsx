import React, { useState, useEffect } from 'react';
import { Bed, Plus, X, Edit, Trash2, Users, Calculator } from 'lucide-react';
import api from '../../utils/api';
import { LuxuryPageHeader, LoadingSpinner } from '../common';

const RoomTypesPage = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      const data = await api.getRoomTypes();
      console.log('Room types data:', data);
      setRoomTypes(Array.isArray(data) ? data : data.roomTypes || []);
    } catch (error) {
      console.error('Failed to load room types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roomType) => {
    setSelectedRoomType(roomType);
    setShowEditModal(true);
  };

  const handleQuote = (roomType) => {
    setSelectedRoomType(roomType);
    setShowQuoteModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room type? This action cannot be undone.')) {
      try {
        await api.deleteRoomType(id);
        alert('Room type deleted successfully!');
        loadRoomTypes(); // Refresh the list
      } catch (error) {
        alert('Failed to delete room type: ' + error.message);
      }
    }
  };

  // Calculate stats
  const totalRoomTypes = roomTypes.length;
  const avgRate = roomTypes.length > 0 
    ? roomTypes.reduce((sum, rt) => sum + parseFloat(rt.base_rate || 0), 0) / roomTypes.length 
    : 0;
  const totalCapacity = roomTypes.reduce((sum, rt) => sum + parseInt(rt.max_occupancy || 0), 0);

  if (loading) {
    return <LoadingSpinner size="xl" message="Loading room types..." />;
  }

  return (
    <div className="min-h-screen bg-surface-primary dark:bg-slate-950 p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Room Types"
          description="Manage room type configurations"
          icon={Bed}
          stats={[
            { label: 'Total Types', value: totalRoomTypes, trend: 'Active configurations' },
            { label: 'Average Rate', value: `Rs ${avgRate.toFixed(2)}`, trend: 'Per night' },
            { label: 'Total Capacity', value: totalCapacity, trend: 'Max guests' },
          ]}
          actions={[{
            label: 'Add Room Type',
            icon: Plus,
            onClick: () => setShowCreateModal(true),
            variant: 'secondary'
          }]}
        />

        <div className="bg-surface-secondary dark:bg-slate-800 rounded-xl shadow-md border border-border dark:border-slate-700 overflow-hidden">
        {roomTypes.length === 0 ? (
          <div className="text-center py-12">
            <Bed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-text-secondary">No room types found</p>
            <button onClick={() => setShowCreateModal(true)} className="mt-4 btn-primary">
              Add First Room Type
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border dark:border-slate-700">
            <table className="min-w-full divide-y divide-border dark:divide-slate-700">
              <thead className="bg-surface-tertiary dark:bg-slate-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Room Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Base Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Max Occupancy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Amenities
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-secondary dark:bg-slate-800 divide-y divide-border dark:divide-slate-700">
                {roomTypes.map((type) => (
                  <tr key={type.room_type_id} className="hover:bg-surface-tertiary dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-luxury-gold/10 rounded-lg">
                          <Bed className="w-5 h-5 text-luxury-gold" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{type.name}</div>
                          {type.amenities && (
                            <div className="text-sm text-text-tertiary">{type.amenities}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-luxury-gold">
                        Rs {parseFloat(type.daily_rate || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-text-primary">
                        <Users className="w-4 h-4 text-text-tertiary" />
                        {type.capacity || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary max-w-xs truncate">
                        {type.amenities || 'No amenities listed'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleQuote(type)}
                        className="text-text-secondary hover:text-text-primary mr-4"
                        title="Get Rate Quote"
                      >
                        <Calculator className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(type)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.room_type_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <RoomTypeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRoomTypes();
          }}
        />
      )}

      {showEditModal && selectedRoomType && (
        <RoomTypeModal
          roomType={selectedRoomType}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRoomType(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRoomType(null);
            loadRoomTypes();
          }}
        />
      )}

      {showQuoteModal && selectedRoomType && (
        <RateQuoteModal
          roomType={selectedRoomType}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedRoomType(null);
          }}
        />
      )}
      </div>
    </div>
  );
};

// Room Type Modal (Create/Edit)
const RoomTypeModal = ({ roomType, onClose, onSuccess }) => {
  const isEdit = !!roomType;
  const [formData, setFormData] = useState({
    name: roomType?.name || '',
    daily_rate: roomType?.daily_rate || '',
    capacity: roomType?.capacity || '',
    amenities: roomType?.amenities || '',
  });
  const [loading, setLoading] = useState(false);

// Rate Quote Modal
const RateQuoteModal = ({ roomType, onClose }) => {
  const [form, setForm] = useState({ check_in: '', check_out: '', promo: '' });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  const getQuote = async () => {
    if (!form.check_in || !form.check_out) return;
    setLoading(true);
    setQuote(null);
    try {
      const data = await api.getRateQuote({ room_type_id: roomType.room_type_id, ...form });
      setQuote(data);
    } catch (e) {
      alert('Failed to get quote: ' + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-text-primary">Rate Quote · {roomType.name}</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Check In</label>
              <input type="date" className="input-field" value={form.check_in} onChange={(e)=>setForm({...form, check_in:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Check Out</label>
              <input type="date" className="input-field" value={form.check_out} onChange={(e)=>setForm({...form, check_out:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Promo Code</label>
            <input type="text" className="input-field" placeholder="Optional" value={form.promo} onChange={(e)=>setForm({...form, promo:e.target.value})} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={getQuote} className="btn-primary" disabled={loading || !form.check_in || !form.check_out}>
              {loading ? 'Calculating...' : 'Get Quote'}
            </button>
            {quote && (
              <div className="text-sm text-text-secondary">
                {quote.nights} night{quote.nights>1?'s':''} · Total Rs {parseFloat(quote.total).toFixed(2)} (Base Rs {parseFloat(quote.base_rate).toFixed(2)})
              </div>
            )}
          </div>
          {quote?.nightly?.length ? (
            <div className="bg-surface-tertiary border border-border rounded-lg p-3">
              <div className="text-sm font-medium text-text-primary mb-2">Nightly Rates</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {quote.nightly.map(n => (
                  <div key={n.date} className="flex justify-between">
                    <span className="text-text-secondary">{new Date(n.date).toLocaleDateString()}</span>
                    <span className="text-text-primary">Rs {parseFloat(n.rate).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.request(`/api/admin/room-types/${roomType.room_type_id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        alert('Room type updated successfully!');
      } else {
        // Map UI fields to API payload
        const payload = {
          room_type_name: formData.name,
          base_rate: Number(formData.daily_rate),
          capacity: Number(formData.capacity),
          description: formData.amenities || null,
        };
        await api.createRoomType(payload);
        alert('Room type created successfully!');
      }
      onSuccess();
    } catch (error) {
      alert(`Failed to ${isEdit ? 'update' : 'create'} room type: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-secondary dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-surface-secondary dark:bg-slate-800">
          <h2 className="text-2xl font-display font-bold text-text-primary">
            {isEdit ? 'Edit Room Type' : 'Add New Room Type'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input-field"
              placeholder="e.g., Deluxe Suite, Standard Room"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Base Rate (per night) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.daily_rate}
              onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Max Occupancy <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              className="input-field"
              placeholder="Number of guests"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Amenities</label>
            <textarea
              value={formData.amenities}
              onChange={(e) => setFormData({...formData, amenities: e.target.value})}
              className="input-field"
              rows="3"
              placeholder="e.g., WiFi, TV, Mini Bar, Ocean View"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomTypesPage;
