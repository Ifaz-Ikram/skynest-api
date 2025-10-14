import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';

export const PaymentAdjustmentModal = ({ payment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    adjustment_type: 'Refund',
    adjustment_amount: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.adjustPayment({
        payment_id: payment.payment_id,
        ...formData
      });
      onSuccess();
    } catch (error) {
      alert('Failed to adjust payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Adjust Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Original Payment</p>
            <p className="text-lg font-bold text-gray-900 mt-1">${payment.amount}</p>
            <p className="text-sm text-gray-600 mt-1">Booking #{payment.booking_id}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
              <select
                value={formData.adjustment_type}
                onChange={(e) => setFormData({...formData, adjustment_type: e.target.value})}
                className="input-field"
              >
                <option value="Refund">Refund</option>
                <option value="Chargeback">Chargeback</option>
                <option value="Correction">Correction</option>
                <option value="Discount">Discount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.adjustment_amount}
                onChange={(e) => setFormData({...formData, adjustment_amount: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="input-field"
                rows="3"
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Processing...' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
