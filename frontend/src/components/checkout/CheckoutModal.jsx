import React, { useState, useEffect } from 'react';
import { X, CreditCard, Receipt, FileText, AlertTriangle, CheckCircle, DollarSign, Calendar, User, Bed } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';

export const CheckoutModal = ({ booking, onClose, onSuccess }) => {
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Checkout form state
  const [finalPayment, setFinalPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [signature, setSignature] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Additional charge form
  const [newCharge, setNewCharge] = useState({ description: '', amount: '', department: '' });
  const [showAddCharge, setShowAddCharge] = useState(false);

  // If no booking provided or invalid booking, show a message
  if (!booking || !booking.booking_id || typeof booking.booking_id !== 'number' || booking.booking_id <= 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Checkout</h1>
            <p className="text-text-secondary mt-1">Process guest checkouts and payments</p>
          </div>
        </div>
        
        <div className="card">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Valid Booking Selected</h3>
            <p className="text-text-secondary mb-4">
              To process a checkout, please go to the Bookings page and click the "Check Out" button on a checked-in booking.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => window.location.href = '/app/bookings'}
                className="btn-primary"
              >
                Go to Bookings
              </button>
            </div>
            <p className="text-sm text-text-tertiary mt-4">
              Only bookings with "Checked-In" status can be checked out.
            </p>
            {booking && (
              <p className="text-sm text-red-500 mt-2">
                Invalid booking data: {JSON.stringify(booking)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log('CheckoutModal received booking:', booking);
    console.log('Booking ID:', booking?.booking_id);
    console.log('Booking status:', booking?.status);
    
    // Don't load folio if booking doesn't exist
    if (!booking || !booking.booking_id) {
      console.error('No booking data provided');
      return;
    }
    
    if (typeof booking.booking_id !== 'number' || booking.booking_id <= 0) {
      console.error('Invalid booking ID:', booking.booking_id);
      setError(`Invalid booking ID: ${booking.booking_id}. Please select a valid booking.`);
      return;
    }
    
    loadFolio();
  }, [booking?.booking_id]);

  const loadFolio = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading folio for booking ID:', booking.booking_id);
      
      const folioData = await api.getFolioReview(booking.booking_id, {
        include_services: true,
        include_payments: true,
        include_adjustments: true
      });
      setFolio(folioData);
      
      // Set initial final payment to balance if positive
      if (folioData.totals.balance > 0) {
        setFinalPayment(folioData.totals.balance);
      }
    } catch (error) {
      console.error('Error loading folio:', error);
      if (error.message.includes('Booking not found')) {
        setError(`Booking #${booking.booking_id} not found. Please check if the booking exists and try again.`);
      } else {
        setError('Failed to load folio data: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCharge = () => {
    if (newCharge.description && newCharge.amount) {
      setAdditionalCharges([...additionalCharges, {
        description: newCharge.description,
        amount: parseFloat(newCharge.amount),
        department: newCharge.department || 'Front Desk'
      }]);
      setNewCharge({ description: '', amount: '', department: '' });
      setShowAddCharge(false);
    }
  };

  const handleRemoveCharge = (index) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const checkoutData = {
        booking_id: booking.booking_id,
        final_payment_amount: finalPayment > 0 ? finalPayment : undefined,
        payment_method: finalPayment > 0 ? paymentMethod : undefined,
        payment_reference: finalPayment > 0 ? paymentReference : undefined,
        signature_data: signature,
        additional_charges: additionalCharges.length > 0 ? additionalCharges : undefined,
        notes: notes
      };
      
      const result = await api.processCheckout(checkoutData);
      
      if (result.success) {
        onSuccess(result.receipt_data);
        onClose();
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      setError(error.message || 'Failed to process checkout');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center">
        <div className="bg-surface-secondary rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!folio) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center">
        <div className="bg-surface-secondary rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p>Failed to load folio data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const finalBalance = folio.totals.balance + totalAdditionalCharges - finalPayment;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-surface-secondary rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Checkout - {folio.booking.guest_name}</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <div className="bg-surface-tertiary rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Bed className="w-5 h-5 mr-2" />
              Booking Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Room:</span> {folio.booking.room_number} ({folio.booking.room_type})
              </div>
              <div>
                <span className="font-medium">Nights:</span> {folio.charges.room.nights}
              </div>
              <div>
                <span className="font-medium">Check-in:</span> {format(new Date(folio.booking.check_in_date), 'dd/MM/yyyy')}
              </div>
              <div>
                <span className="font-medium">Check-out:</span> {format(new Date(folio.booking.check_out_date), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>

          {/* Folio Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Folio Review
            </h3>
            
            {/* Charges */}
            <div className="bg-surface-secondary border rounded-lg p-4">
              <h4 className="font-medium mb-3">Charges</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{folio.charges.room.description}</span>
                  <span>Rs {folio.charges.room.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{folio.charges.tax.description}</span>
                  <span>Rs {folio.charges.tax.amount.toFixed(2)}</span>
                </div>
                {folio.services.map((service, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{service.service_name} (x{service.quantity})</span>
                    <span>Rs {parseFloat(service.total_amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="bg-surface-secondary border rounded-lg p-4">
              <h4 className="font-medium mb-3">Payments</h4>
              <div className="space-y-2">
                {folio.booking.advance_payment > 0 && (
                  <div className="flex justify-between">
                    <span>Advance Payment</span>
                    <span className="text-green-600">Rs {parseFloat(folio.booking.advance_payment).toFixed(2)}</span>
                  </div>
                )}
                {folio.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{payment.payment_method} - {payment.payment_reference}</span>
                    <span className="text-green-600">Rs {parseFloat(payment.amount).toFixed(2)}</span>
                  </div>
                ))}
                {folio.adjustments.map((adjustment, index) => (
                  <div key={index} className="flex justify-between">
                    <span>Adjustment: {adjustment.reason}</span>
                    <span className={adjustment.amount >= 0 ? "text-green-600" : "text-red-600"}>
                      Rs {parseFloat(adjustment.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Charges */}
            <div className="bg-surface-secondary border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Additional Charges</h4>
                <button
                  onClick={() => setShowAddCharge(true)}
                  className="btn-secondary text-sm"
                >
                  Add Charge
                </button>
              </div>
              
              {showAddCharge && (
                <div className="bg-surface-tertiary p-3 rounded-lg mb-3">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={newCharge.description}
                      onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
                      className="input-field"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newCharge.amount}
                      onChange={(e) => setNewCharge({...newCharge, amount: e.target.value})}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Department"
                      value={newCharge.department}
                      onChange={(e) => setNewCharge({...newCharge, department: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddCharge} className="btn-primary text-sm">
                      Add
                    </button>
                    <button onClick={() => setShowAddCharge(false)} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {additionalCharges.map((charge, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span>{charge.description} ({charge.department})</span>
                  <div className="flex items-center gap-2">
                    <span>Rs {charge.amount.toFixed(2)}</span>
                    <button
                      onClick={() => handleRemoveCharge(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {additionalCharges.length === 0 && !showAddCharge && (
                <p className="text-text-tertiary text-sm">No additional charges</p>
              )}
            </div>

            {/* Final Payment */}
            <div className="bg-surface-secondary border rounded-lg p-4">
              <h4 className="font-medium mb-3">Final Payment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input
                    type="number"
                    value={finalPayment}
                    onChange={(e) => setFinalPayment(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <SearchableDropdown
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Credit Card', label: 'Credit Card' },
                      { value: 'Debit Card', label: 'Debit Card' },
                      { value: 'Bank Transfer', label: 'Bank Transfer' }
                    ]}
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    placeholder="Select payment method"
                    searchPlaceholder="Search payment methods..."
                    className="input-field"
                    displayKey="label"
                    valueKey="value"
                    searchKeys={['label']}
                    renderOption={(option) => (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-text-tertiary" />
                        <span>{option.label}</span>
                      </div>
                    )}
                    renderSelected={(option) => (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-text-tertiary" />
                        <span>{option.label}</span>
                      </div>
                    )}
                    emptyMessage="No payment methods found"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Payment Reference</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="input-field"
                    placeholder="Transaction ID, check number, etc."
                  />
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="bg-surface-secondary border rounded-lg p-4">
              <h4 className="font-medium mb-3">Guest Signature</h4>
              <textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="input-field h-20"
                placeholder="Guest signature or acknowledgment..."
              />
            </div>

            {/* Notes */}
            <div className="bg-surface-secondary border rounded-lg p-4">
              <h4 className="font-medium mb-3">Checkout Notes</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field h-20"
                placeholder="Additional notes about checkout..."
              />
            </div>

            {/* Final Totals */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">Final Totals</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Charges:</span>
                  <span>Rs {(folio.totals.charges + totalAdditionalCharges).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Payments:</span>
                  <span className="text-green-600">Rs {folio.totals.payments.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Payment:</span>
                  <span className="text-green-600">Rs {finalPayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Final Balance:</span>
                  <span className={finalBalance === 0 ? "text-green-600" : finalBalance > 0 ? "text-red-600" : "text-blue-600"}>
                    Rs {finalBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={processing || finalBalance < 0}
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Process Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;