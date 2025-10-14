/**
 * Billing calculation utilities
 * Implements the exact billing math from the prompt
 */

const { parseMoney, formatMoney } = require('./money');
const { calculateNights } = require('./dates');

/**
 * Calculate billing totals for a booking
 * @param {Object} booking - booking object with check_in_date, check_out_date, booked_rate, etc.
 * @param {Array} services - array of service_usage records
 * @param {Array} payments - array of payment records
 * @param {Array} adjustments - array of payment_adjustment records
 * @returns {Object} calculated totals
 */
function calculateBookingTotals(booking, services = [], payments = [], adjustments = []) {
  // 1. Calculate nights
  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  
  // 2. Room subtotal = nights × booked_rate
  const roomSubtotal = nights * parseMoney(booking.booked_rate);
  
  // 3. Services subtotal = SUM(qty × unit_price_at_use)
  const servicesSubtotal = services.reduce((sum, s) => {
    return sum + (parseMoney(s.qty) * parseMoney(s.unit_price_at_use));
  }, 0);
  
  // 4. Pre-tax subtotal = room + services - discount + late_fee
  const preTaxSubtotal = roomSubtotal 
    + servicesSubtotal 
    - parseMoney(booking.discount_amount || 0) 
    + parseMoney(booking.late_fee_amount || 0);
  
  // 5. Tax = pre-tax × (tax_rate_percent / 100)
  const taxRate = parseMoney(booking.tax_rate_percent || 0);
  const tax = preTaxSubtotal * (taxRate / 100);
  
  // 6. Gross total = pre-tax + tax
  const grossTotal = preTaxSubtotal + tax;
  
  // 7. Payments total = SUM(payment.amount)
  const paymentsTotal = payments.reduce((sum, p) => {
    return sum + parseMoney(p.amount);
  }, 0);
  
  // 8. Adjustments total (refunds/chargebacks are negative in net calc)
  const adjustmentsTotal = adjustments.reduce((sum, a) => {
    // Refunds and chargebacks reduce what hotel keeps
    if (a.type === 'refund' || a.type === 'chargeback') {
      return sum + parseMoney(a.amount);
    }
    // Manual adjustments might add or subtract
    return sum - parseMoney(a.amount);
  }, 0);
  
  // 9. Advance payment (if not already in payments, add it)
  const advance = parseMoney(booking.advance_payment || 0);
  
  // 10. Balance = gross total - (payments + advance) + adjustments
  // Note: adjustments that are refunds will increase balance (less paid effectively)
  const balance = grossTotal - (paymentsTotal + advance) + adjustmentsTotal;
  
  return {
    nights,
    roomSubtotal: formatMoney(roomSubtotal),
    servicesSubtotal: formatMoney(servicesSubtotal),
    preTaxSubtotal: formatMoney(preTaxSubtotal),
    tax: formatMoney(tax),
    taxRate: formatMoney(taxRate),
    grossTotal: formatMoney(grossTotal),
    paymentsTotal: formatMoney(paymentsTotal),
    adjustmentsTotal: formatMoney(adjustmentsTotal),
    advance: formatMoney(advance),
    balance: formatMoney(balance),
  };
}

/**
 * Quick balance calculation for a booking
 * @param {Object} booking
 * @param {number} servicesTotal
 * @param {number} paymentsTotal
 * @param {number} adjustmentsTotal
 * @returns {string} formatted balance
 */
function quickBalance(booking, servicesTotal = 0, paymentsTotal = 0, adjustmentsTotal = 0) {
  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  const roomSubtotal = nights * parseMoney(booking.booked_rate);
  const preTax = roomSubtotal 
    + parseMoney(servicesTotal) 
    - parseMoney(booking.discount_amount || 0) 
    + parseMoney(booking.late_fee_amount || 0);
  const tax = preTax * (parseMoney(booking.tax_rate_percent || 0) / 100);
  const gross = preTax + tax;
  const advance = parseMoney(booking.advance_payment || 0);
  const balance = gross - (parseMoney(paymentsTotal) + advance) + parseMoney(adjustmentsTotal);
  return formatMoney(balance);
}

module.exports = {
  calculateBookingTotals,
  quickBalance,
};
