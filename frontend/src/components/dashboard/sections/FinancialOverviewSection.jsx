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
        <div className="text-white">Loading financial data...</div>
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
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">Revenue by Branch</h3>
          <div className="space-y-3">
            {financialData.revenueByBranch.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-700/50">
                <span className="text-slate-300">{item.branch}</span>
                <span className="text-white font-semibold">Rs {item.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-slate-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Recent Payments</h3>
        
        {financialData.recentPayments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Payment ID</th>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Booking</th>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Date</th>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Method</th>
                  <th className="text-right text-sm font-medium text-slate-400 pb-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {financialData.recentPayments.map((payment) => (
                  <tr key={payment.payment_id} className="border-b border-slate-700/30">
                    <td className="py-3 text-slate-300">#{payment.payment_id}</td>
                    <td className="py-3 text-slate-300">Booking #{payment.booking_id}</td>
                    <td className="py-3 text-slate-400 text-sm">
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                        {payment.payment_method}
                      </span>
                    </td>
                    <td className="py-3 text-right text-green-400 font-semibold">
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
  const colorClasses = {
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-xl p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="text-sm text-slate-300">{label}</span>
        </div>
        {trend && (
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
};
