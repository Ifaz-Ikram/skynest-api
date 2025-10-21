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
  
  // Branch filtering state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Fixed at 50 items per page
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
    // Reload payments when branch filter changes
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
      
      // Handle paginated response
      if (response.data && response.pagination) {
        setPayments(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } else {
        // Fallback for non-paginated response (backward compatibility)
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

  // Calculate stats
  const totalTransactions = total;
  const paymentsOnly = payments.filter(p => p.transaction_type === 'payment');
  const adjustmentsOnly = payments.filter(p => p.transaction_type === 'adjustment');
  const totalRevenue = paymentsOnly.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalAdjustments = adjustmentsOnly.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const avgPayment = paymentsOnly.length > 0 ? totalRevenue / paymentsOnly.length : 0;

  if (loading && payments.length === 0) {
    return <LoadingSpinner size="xl" message="Loading payments..." />;
  }

  return (
    <div className="min-h-screen bg-surface-primary dark:bg-slate-950 p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Payments"
          description="Track all payment transactions"
          icon={CreditCard}
          stats={[
            { label: 'Total Transactions', value: totalTransactions, trend: `Across ${totalPages} pages` },
            { label: 'Total Revenue', value: `Rs ${totalRevenue.toLocaleString()}`, trend: 'Payments only' },
            { label: 'Net Adjustments', value: `Rs ${totalAdjustments.toLocaleString()}`, trend: 'Refunds & charges' },
          ]}
          actions={[{
            label: 'Record Payment',
            icon: CreditCard,
            onClick: () => setShowCreateModal(true),
            variant: 'secondary'
          }]}
        />

        {/* Branch Filter */}
        <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-300" />
            <span className="font-medium text-slate-300">Filter by Branch:</span>
          </div>
          <SearchableDropdown
            value={selectedBranch}
            onChange={(value) => setSelectedBranch(value || '')}
            options={branchOptions}
            placeholder="All branches"
            searchPlaceholder="Search branches..."
            className="min-w-[220px]"
            buttonClassName="!px-4 !py-2.5 !rounded-xl !border border-border dark:border-slate-600 !bg-surface-secondary dark:!bg-slate-800 !text-slate-300 dark:!text-slate-200 font-medium hover:!border-luxury-gold focus-visible:!ring-luxury-gold focus-visible:!ring-offset-0"
            dropdownClassName="!border-border"
          />
          {selectedBranch && (
            <button
              onClick={() => setSelectedBranch('')}
              className="text-sm text-slate-400 hover:text-slate-300 underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="card bg-surface-secondary dark:bg-slate-800">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300">No transactions found</p>
            <p className="text-slate-400 text-sm mt-2">Payments and adjustments will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border dark:border-slate-700 rounded-xl">
            <table className="min-w-full">
              <thead className="bg-surface-tertiary dark:bg-slate-800/60">
                <tr className="border-b border-border dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Booking ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface-secondary dark:bg-slate-800">
                {payments.map((transaction) => (
                  <tr 
                    key={`${transaction.transaction_type}-${transaction.payment_id}`} 
                    className={`border-b border-border dark:border-slate-700 transition-colors bg-surface-secondary dark:bg-slate-800 hover:bg-surface-tertiary dark:hover:bg-slate-700/40 ${
                      transaction.transaction_type === 'adjustment' ? 'bg-blue-900/20 dark:bg-blue-900/200/15' : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        {transaction.transaction_type === 'payment' ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-600 dark:text-green-300" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        )}
                        {transaction.transaction_type === 'payment' ? 'P' : 'A'}{transaction.payment_id}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.transaction_type === 'payment' 
                          ? 'bg-green-800/30 text-green-200 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-blue-800/30 text-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {transaction.transaction_type === 'payment' ? 'Payment' : 'Adjustment'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{transaction.booking_id}</td>
                    <td className={`py-4 px-4 font-bold ${
                      transaction.transaction_type === 'adjustment' && transaction.amount < 0
                        ? 'text-red-600' 
                        : 'text-luxury-gold'
                    }`}>
                      {transaction.transaction_type === 'adjustment' && transaction.amount < 0 ? '-' : ''}Rs {Math.abs(transaction.amount)}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {transaction.transaction_type === 'payment' 
                        ? transaction.method || 'N/A'
                        : transaction.adjustment_type || 'N/A'
                      }
                    </td>
                    <td className="py-4 px-4 text-slate-300 text-sm">
                      {transaction.transaction_type === 'adjustment' 
                        ? (transaction.reason || 'No reason provided')
                        : '-'
                      }
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {transaction.paid_at ? format(new Date(transaction.paid_at), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      {transaction.transaction_type === 'payment' ? (
                        <button 
                          onClick={() => handleAdjustment(transaction)}
                          className="text-blue-500 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 font-medium text-sm transition-colors"
                        >
                          Adjust
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Load More Button */}
        {!loading && payments.length > 0 && page < totalPages && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-3 bg-yellow-900/200 hover:bg-yellow-600 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              Load More Payments ({payments.length} loaded)
            </button>
          </div>
        )}
        
        {!loading && payments.length > 0 && (
          <div className="mt-4 text-center text-sm text-slate-300">
            Load more payments for better search results
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && payments.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="text-sm text-slate-300">
              Showing <span className="font-medium">{payments.length}</span> filtered results from{' '}
              <span className="font-medium">{total}</span> loaded payments
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 border border-border dark:border-slate-600 rounded text-sm font-medium text-slate-300 hover:bg-surface-tertiary dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[40px] px-3 py-2 border rounded text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-yellow-900/200 text-white border-yellow-500'
                        : 'border-border dark:border-slate-600 text-white dark:text-slate-200 hover:bg-surface-tertiary dark:hover:bg-slate-700/40'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border border-border dark:border-slate-600 rounded text-sm font-medium text-slate-300 hover:bg-surface-tertiary dark:hover:bg-slate-700/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                Next
              </button>
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
