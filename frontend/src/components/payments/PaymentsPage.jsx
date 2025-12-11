import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Building2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import { CreatePaymentModal } from './CreatePaymentModal';
import { PaymentAdjustmentModal } from './PaymentAdjustmentModal';
import { LuxuryPageHeader, LoadingSpinner, SearchableDropdown } from '../common';

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const branchOptions = useMemo(() => {
    const base = [{ id: '', name: 'All branches' }];
    if (!Array.isArray(branches) || branches.length === 0) {
      return base;
    }
    return [
      ...base,
      ...branches.map((branch) => ({
        id: String(branch.branch_id),
        name: branch.branch_name || `Branch ${branch.branch_id}`,
      })),
    ];
  }, [branches]);

  useEffect(() => {
    loadBranches();
    loadPayments();
  }, [page]);

  useEffect(() => {
    if (branches.length > 0) {
      loadPayments();
    }
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      const branchList = Array.isArray(branchesData) ? branchesData : branchesData?.branches || [];
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      let url = `/api/payments?page=${page}&limit=${limit}`;
      if (selectedBranch) {
        url += `&branch_id=${selectedBranch}`;
      }
      const response = await api.request(url);

      if (response.data && response.pagination) {
        setPayments(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } else {
        setPayments(response);
        setTotal(response.length);
        setTotalPages(1);
      }
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

  const totalTransactions = total;
  const paymentsOnly = payments.filter(p => p.transaction_type === 'payment');
  const adjustmentsOnly = payments.filter(p => p.transaction_type === 'adjustment');
  const totalRevenue = paymentsOnly.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalAdjustments = adjustmentsOnly.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  if (loading && payments.length === 0) {
    return <LoadingSpinner size="xl" message="Loading payments..." />;
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Payments"
          description="Track all payment transactions"
          icon={CreditCard}
          stats={[
            { label: 'Total Transactions', value: totalTransactions },
            { label: 'Total Revenue', value: `Rs ${totalRevenue.toLocaleString()}` },
            { label: 'Net Adjustments', value: `Rs ${totalAdjustments.toLocaleString()}` },
          ]}
          actions={[{
            label: 'Record Payment',
            icon: CreditCard,
            onClick: () => setShowCreateModal(true),
          }]}
        />

        {/* Branch Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: '#6c757d' }} />
              <span className="font-medium" style={{ color: '#1a237e' }}>Filter by Branch:</span>
            </div>
            <SearchableDropdown
              value={selectedBranch}
              onChange={(value) => setSelectedBranch(value || '')}
              options={branchOptions}
              placeholder="All branches"
              className="min-w-[220px]"
            />
            {selectedBranch && (
              <button
                onClick={() => setSelectedBranch('')}
                className="text-sm underline transition-colors"
                style={{ color: '#0d47a1' }}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#0d47a1' }}></div>
              <p className="mt-4" style={{ color: '#6c757d' }}>Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-20 h-20 mx-auto mb-6" style={{ color: '#dee2e6' }} />
              <p className="text-lg" style={{ color: '#6c757d' }}>No transactions found</p>
              <p className="text-sm mt-2" style={{ color: '#adb5bd' }}>Payments and adjustments will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: '#e3f2fd' }}>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Transaction ID</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Type</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Booking ID</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Amount</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Method</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Reason</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Date</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold uppercase" style={{ color: '#1a237e' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#e9ecef' }}>
                  {payments.map((transaction) => (
                    <tr
                      key={`${transaction.transaction_type}-${transaction.payment_id}`}
                      className="hover:bg-gray-50 transition-colors"
                      style={transaction.transaction_type === 'adjustment' ? { backgroundColor: '#e3f2fd' } : {}}
                    >
                      <td className="py-4 px-4 font-medium" style={{ color: '#1a237e' }}>
                        <div className="flex items-center gap-2">
                          {transaction.transaction_type === 'payment' ? (
                            <ArrowUpCircle className="w-4 h-4" style={{ color: '#28a745' }} />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4" style={{ color: '#0d6efd' }} />
                          )}
                          {transaction.transaction_type === 'payment' ? 'P' : 'A'}{transaction.payment_id}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={transaction.transaction_type === 'payment'
                            ? { backgroundColor: '#d4edda', color: '#155724' }
                            : { backgroundColor: '#cfe2ff', color: '#084298' }
                          }
                        >
                          {transaction.transaction_type === 'payment' ? 'Payment' : 'Adjustment'}
                        </span>
                      </td>
                      <td className="py-4 px-4" style={{ color: '#6c757d' }}>{transaction.booking_id}</td>
                      <td className="py-4 px-4 font-bold" style={{
                        color: transaction.transaction_type === 'adjustment' && transaction.amount < 0
                          ? '#dc3545'
                          : '#1a237e'
                      }}>
                        {transaction.transaction_type === 'adjustment' && transaction.amount < 0 ? '-' : ''}Rs {Math.abs(transaction.amount).toLocaleString()}
                      </td>
                      <td className="py-4 px-4" style={{ color: '#6c757d' }}>
                        {transaction.transaction_type === 'payment'
                          ? transaction.method || 'N/A'
                          : transaction.adjustment_type || 'N/A'
                        }
                      </td>
                      <td className="py-4 px-4 text-sm" style={{ color: '#6c757d' }}>
                        {transaction.transaction_type === 'adjustment'
                          ? (transaction.reason || 'No reason provided')
                          : '-'
                        }
                      </td>
                      <td className="py-4 px-4" style={{ color: '#6c757d' }}>
                        {transaction.paid_at ? format(new Date(transaction.paid_at), 'dd/MM/yyyy') : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        {transaction.transaction_type === 'payment' ? (
                          <button
                            onClick={() => handleAdjustment(transaction)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}
                          >
                            Adjust
                          </button>
                        ) : (
                          <span style={{ color: '#adb5bd' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && payments.length > 0 && totalPages > 1 && (
            <div className="border-t px-6 py-4" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }}>
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ color: '#6c757d' }}>
                  Showing <span className="font-semibold">{payments.length}</span> of{' '}
                  <span className="font-semibold">{total}</span> payments
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'white', color: '#1a237e', border: '1px solid #dee2e6' }}
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className="w-10 h-10 rounded-lg text-sm font-medium transition-all"
                        style={page === pageNum ? {
                          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                          color: 'white'
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

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'white', color: '#1a237e', border: '1px solid #dee2e6' }}
                  >
                    Next
                  </button>
                </div>
              </div>
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
    </div>
  );
};
