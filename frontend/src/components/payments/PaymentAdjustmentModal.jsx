import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';

export const PaymentAdjustmentModal = ({ payment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    adjustment_type: 'Refund',
    adjustment_amount: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const adjustmentTypeOptions = [
    { id: 'Refund', name: 'Refund' },
    { id: 'Chargeback', name: 'Chargeback' },
    { id: 'Correction', name: 'Correction' },
    { id: 'Discount', name: 'Discount' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const amount = parseFloat(formData.adjustment_amount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid adjustment amount greater than 0');
      return;
    }
    
    setLoading(true);
    try {
      await api.adjustPayment({
        booking_id: payment.booking_id,
        amount: Math.abs(amount),
        reason: formData.reason,
        type: formData.adjustment_type === 'Refund' ? 'refund' : 
              formData.adjustment_type === 'Chargeback' ? 'chargeback' : 
              'manual_adjustment'
      });
      onSuccess();
    } catch (error) {
      alert('Failed to adjust payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex items-center justify-between" style={{ zIndex: 'var(--z-sticky)' }}>
          <h2 className="text-2xl font-bold text-white">Adjust Payment</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 p-4 bg-surface-tertiary rounded-lg">
            <p className="text-sm text-slate-300">Original Payment</p>
            <p className="text-lg font-bold text-white mt-1">Rs {payment.amount}</p>
            <p className="text-sm text-slate-300 mt-1">Booking #{payment.booking_id}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative z-30">
              <label className="block text-sm font-medium text-slate-300 mb-2">Adjustment Type</label>
              <SearchableDropdown
                value={formData.adjustment_type}
                onChange={(value) => setFormData({ ...formData, adjustment_type: value })}
                options={adjustmentTypeOptions}
                placeholder="Select adjustment type"
                hideSearch
                clearable={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Adjustment Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.adjustment_amount}
                onChange={(e) => setFormData({...formData, adjustment_amount: e.target.value})}
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"
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
