import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard, AlertCircle, Calendar } from 'lucide-react';
import api from '../../../utils/api';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export const FinancialOverviewSection = ({ user, filterByBranch = false }) => {
  const [financialData, setFinancialData] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    pendingPayments: 0,
    totalPaid: 0,
    recentPayments: [],
    revenueByBranch: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [user, filterByBranch]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings and payments
      const [bookingsData, paymentsData] = await Promise.all([
        api.getBookings(),
        api.getPayments(),
      ]);

      const allBookings = bookingsData?.bookings || bookingsData || [];
      const allPayments = paymentsData?.payments || paymentsData || [];

      // Filter by branch if needed
      const filteredBookings = filterByBranch && user.branch_id
        ? allBookings.filter(b => b.branch_id === user.branch_id)
        : allBookings;

      const filteredPayments = filterByBranch && user.branch_id
        ? allPayments.filter(p => {
            const booking = allBookings.find(b => b.booking_id === p.booking_id);
            return booking && booking.branch_id === user.branch_id;
          })
        : allPayments;

      // Calculate today's revenue
      const today = new Date();
      const todayRevenue = filteredPayments
        .filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= startOfDay(today) && paymentDate <= endOfDay(today);
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Calculate month's revenue
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const monthRevenue = filteredPayments
        .filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Calculate pending payments
      const pendingPayments = filteredBookings
        .filter(b => b.status !== 'Cancelled')
        .reduce((sum, b) => {
          const total = parseFloat(b.total_amount || 0);
          const paid = parseFloat(b.total_paid || 0);
          return sum + Math.max(0, total - paid);
        }, 0);

      // Total paid (all time)
      const totalPaid = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Recent payments (last 10)
      const recentPayments = filteredPayments
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 10);

      // Revenue by branch (for accountants seeing all branches)
      const revenueByBranch = !filterByBranch
        ? calculateRevenueByBranch(allBookings, allPayments)
        : [];

      setFinancialData({
        todayRevenue,
        monthRevenue,
        pendingPayments,
        totalPaid,
        recentPayments,
        revenueByBranch,
      });
    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueByBranch = (bookings, payments) => {
    const branchMap = {};
    
    payments.forEach(payment => {
      const booking = bookings.find(b => b.booking_id === payment.booking_id);
      if (booking && booking.branch_name) {
        if (!branchMap[booking.branch_name]) {
          branchMap[booking.branch_name] = 0;
        }
        branchMap[booking.branch_name] += parseFloat(payment.amount || 0);
      }
    });

    return Object.entries(branchMap)
      .map(([branch, revenue]) => ({ branch, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div style={{ color: '#1a237e' }} className="font-semibold">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialStatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={`Rs ${financialData.todayRevenue.toFixed(2)}`}
          trend="up"
          color="green"
        />
        <FinancialStatCard
          icon={TrendingUp}
          label="Month's Revenue"
          value={`Rs ${financialData.monthRevenue.toFixed(2)}`}
          color="blue"
        />
        <FinancialStatCard
          icon={AlertCircle}
          label="Pending Payments"
          value={`Rs ${financialData.pendingPayments.toFixed(2)}`}
          color="orange"
        />
        <FinancialStatCard
          icon={Receipt}
          label="Total Collected"
          value={`Rs ${financialData.totalPaid.toFixed(2)}`}
          color="purple"
        />
      </div>

      {/* Revenue by Branch (for Accountants) */}
      {financialData.revenueByBranch.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#1a237e' }}>Revenue by Branch</h3>
          <div className="space-y-3">
            {financialData.revenueByBranch.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border-2 transition-all hover:shadow-md" style={{ backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}>
                <span className="font-semibold" style={{ color: '#495057' }}>{item.branch}</span>
                <span className="font-bold" style={{ color: '#0d47a1' }}>Rs {item.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '2px solid #e0e0e0' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: '#1a237e' }}>Recent Payments</h3>
        
        {financialData.recentPayments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 mx-auto mb-3" style={{ color: '#adb5bd' }} />
            <p style={{ color: '#6c757d' }}>No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th className="text-left text-sm font-bold pb-3" style={{ color: '#1a237e' }}>Payment ID</th>
                  <th className="text-left text-sm font-bold pb-3" style={{ color: '#1a237e' }}>Booking</th>
                  <th className="text-left text-sm font-bold pb-3" style={{ color: '#1a237e' }}>Date</th>
                  <th className="text-left text-sm font-bold pb-3" style={{ color: '#1a237e' }}>Method</th>
                  <th className="text-right text-sm font-bold pb-3" style={{ color: '#1a237e' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {financialData.recentPayments.map((payment) => (
                  <tr key={payment.payment_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td className="py-3 font-medium" style={{ color: '#495057' }}>#{payment.payment_id}</td>
                    <td className="py-3 font-medium" style={{ color: '#495057' }}>Booking #{payment.booking_id}</td>
                    <td className="py-3 text-sm" style={{ color: '#6c757d' }}>
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1', border: '1px solid #90caf9' }}>
                        {payment.payment_method}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold" style={{ color: '#198754' }}>
                      Rs {parseFloat(payment.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const FinancialStatCard = ({ icon: Icon, label, value, trend, color }) => {
  const colorStyles = {
    green: { bg: 'linear-gradient(135deg, #d1e7dd 0%, #badbcc 100%)', border: '#198754', icon: '#198754', text: '#0a5029' },
    blue: { bg: 'linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%)', border: '#0d6efd', icon: '#0d6efd', text: '#084298' },
    orange: { bg: 'linear-gradient(135deg, #ffe5d0 0%, #fed9bb 100%)', border: '#fd7e14', icon: '#fd7e14', text: '#8b4513' },
    purple: { bg: 'linear-gradient(135deg, #e0cffc 0%, #d4bbfc 100%)', border: '#6f42c1', icon: '#6f42c1', text: '#4a1d8f' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="rounded-xl p-4 border-2 shadow-md" style={{ background: style.bg, borderColor: style.border }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" style={{ color: style.icon }} />
          <span className="text-sm font-semibold" style={{ color: style.text }}>{label}</span>
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" style={{ color: '#198754' }} />
            ) : (
              <TrendingDown className="w-4 h-4" style={{ color: '#dc3545' }} />
            )}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold" style={{ color: style.text }}>{value}</div>
    </div>
  );
};
