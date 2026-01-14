#!/usr/bin/env node
/**
 * Quick script to run auto checkout for past bookings
 * Usage: node run-auto-checkout.js
 */

const { autoCheckoutPastBookings } = require('./scripts/auto-checkout-past-bookings');

console.log('🚀 Starting manual auto checkout...');
autoCheckoutPastBookings()
  .then(() => {
    console.log('✅ Auto checkout completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Auto checkout failed:', error);
    process.exit(1);
  });
