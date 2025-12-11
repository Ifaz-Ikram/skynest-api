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

  useEffect(() => { loadRoomTypes(); }, []);

  const loadRoomTypes = async () => {
    try {
      const data = await api.getRoomTypes();
      setRoomTypes(Array.isArray(data) ? data : data.roomTypes || []);
    } catch (error) { console.error('Failed to load room types:', error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room type?')) {
      try { await api.deleteRoomType(id); loadRoomTypes(); }
      catch (error) { alert('Failed to delete: ' + error.message); }
    }
  };

  const totalRoomTypes = roomTypes.length;
  const avgRate = roomTypes.length > 0 ? roomTypes.reduce((sum, rt) => sum + parseFloat(rt.base_rate || 0), 0) / roomTypes.length : 0;
  const totalCapacity = roomTypes.reduce((sum, rt) => sum + parseInt(rt.max_occupancy || 0), 0);

  if (loading) return <LoadingSpinner size="xl" message="Loading room types..." />;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Room Types"
          description="Manage room type configurations"
          icon={Bed}
          stats={[
            { label: 'Total Types', value: totalRoomTypes },
            { label: 'Average Rate', value: `Rs ${avgRate.toFixed(2)}` },
            { label: 'Total Capacity', value: totalCapacity },
          ]}
          actions={[{ label: 'Add Room Type', icon: Plus, onClick: () => setShowCreateModal(true) }]}
        />

        {/* Room Types Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {roomTypes.length === 0 ? (
            <div className="text-center py-16">
              <Bed className="w-20 h-20 mx-auto mb-4" style={{ color: '#dee2e6' }} />
              <p style={{ color: '#6c757d' }}>No room types found</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-4 px-6 py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
                Add First Room Type
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: '#e3f2fd' }}>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Room Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Base Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Max Occupancy</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Amenities</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#e9ecef' }}>
                  {roomTypes.map((type) => (
                    <tr key={type.room_type_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: '#e3f2fd' }}>
                            <Bed className="w-5 h-5" style={{ color: '#0d47a1' }} />
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: '#1a237e' }}>{type.name}</div>
                            {type.amenities && <div className="text-sm" style={{ color: '#6c757d' }}>{type.amenities}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold" style={{ color: '#1a237e' }}>Rs {parseFloat(type.daily_rate || 0).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2" style={{ color: '#6c757d' }}>
                          <Users className="w-4 h-4" />
                          {type.capacity || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-xs truncate" style={{ color: '#6c757d' }}>{type.amenities || 'No amenities listed'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setSelectedRoomType(type); setShowQuoteModal(true); }} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#e9ecef', color: '#495057' }} title="Get Rate Quote">
                            <Calculator className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedRoomType(type); setShowEditModal(true); }} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(type.room_type_id)} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: '#f8d7da', color: '#dc3545' }}>
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

        {showCreateModal && <RoomTypeModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadRoomTypes(); }} />}
        {showEditModal && selectedRoomType && <RoomTypeModal roomType={selectedRoomType} onClose={() => { setShowEditModal(false); setSelectedRoomType(null); }} onSuccess={() => { setShowEditModal(false); setSelectedRoomType(null); loadRoomTypes(); }} />}
        {showQuoteModal && selectedRoomType && <RateQuoteModal roomType={selectedRoomType} onClose={() => { setShowQuoteModal(false); setSelectedRoomType(null); }} />}
      </div>
    </div>
  );
};

const RoomTypeModal = ({ roomType, onClose, onSuccess }) => {
  const isEdit = !!roomType;
  const [formData, setFormData] = useState({
    name: roomType?.name || '',
    daily_rate: roomType?.daily_rate || '',
    capacity: roomType?.capacity || '',
    amenities: roomType?.amenities || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.request(`/api/admin/room-types/${roomType.room_type_id}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        await api.createRoomType({ room_type_name: formData.name, base_rate: Number(formData.daily_rate), capacity: Number(formData.capacity), description: formData.amenities || null });
      }
      onSuccess();
    } catch (error) { alert('Failed: ' + error.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="px-6 py-5 border-b flex justify-between items-center" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
          <h2 className="text-2xl font-bold" style={{ color: '#1a237e' }}>{isEdit ? 'Edit Room Type' : 'Add New Room Type'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'white', color: '#6c757d' }}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Type Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Base Rate (per night) *</label>
            <input type="number" step="0.01" value={formData.daily_rate} onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Max Occupancy *</label>
            <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Amenities</label>
            <textarea value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} rows="3" className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} placeholder="e.g., WiFi, TV, Mini Bar" />
          </div>
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#e9ecef' }}>
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 rounded-xl font-medium" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>{loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
    } catch (e) { alert('Failed to get quote: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="px-6 py-5 border-b flex justify-between items-center" style={{ backgroundColor: '#e3f2fd', borderColor: '#dee2e6' }}>
          <h2 className="text-xl font-bold" style={{ color: '#1a237e' }}>Rate Quote · {roomType.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'white', color: '#6c757d' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Check In</label>
              <input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Check Out</label>
              <input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Promo Code</label>
            <input type="text" value={form.promo} onChange={(e) => setForm({ ...form, promo: e.target.value })} placeholder="Optional" className="w-full px-4 py-3 rounded-xl border-2" style={{ borderColor: '#e9ecef', color: '#333' }} />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={getQuote} disabled={loading || !form.check_in || !form.check_out} className="px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
              {loading ? 'Calculating...' : 'Get Quote'}
            </button>
            {quote && <div className="text-sm" style={{ color: '#6c757d' }}>{quote.nights} night(s) · Total Rs {parseFloat(quote.total).toFixed(2)}</div>}
          </div>
          {quote?.nightly?.length > 0 && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#e3f2fd' }}>
              <div className="text-sm font-semibold mb-2" style={{ color: '#1a237e' }}>Nightly Rates</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {quote.nightly.map(n => (
                  <div key={n.date} className="flex justify-between">
                    <span style={{ color: '#6c757d' }}>{new Date(n.date).toLocaleDateString()}</span>
                    <span style={{ color: '#1a237e' }}>Rs {parseFloat(n.rate).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomTypesPage;
