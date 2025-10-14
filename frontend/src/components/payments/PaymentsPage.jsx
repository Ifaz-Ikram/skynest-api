import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import { CreatePaymentModal } from './CreatePaymentModal';
import { PaymentAdjustmentModal } from './PaymentAdjustmentModal';

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await api.request('/api/payments');
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = (payment) => {
    setSelectedPayment(payment);
    setShowAdjustModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track all payment transactions</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <CreditCard className="w-5 h-5 mr-2 inline" />
          Record Payment
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Booking ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{payment.payment_id}</td>
                    <td className="py-4 px-4 text-gray-600">{payment.booking_id}</td>
                    <td className="py-4 px-4 font-bold text-luxury-gold">${payment.amount}</td>
                    <td className="py-4 px-4 text-gray-600">{payment.payment_method}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {payment.payment_date ? format(new Date(payment.payment_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => handleAdjustment(payment)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Adjust
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
        <CreatePaymentModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPayments();
          }}
        />
      )}

      {showAdjustModal && selectedPayment && (
        <PaymentAdjustmentModal 
          payment={selectedPayment}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedPayment(null);
          }}
          onSuccess={() => {
            setShowAdjustModal(false);
            setSelectedPayment(null);
            loadPayments();
          }}
        />
      )}
    </div>
  );
};
