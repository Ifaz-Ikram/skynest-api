#!/usr/bin/env node
/**
 * Scheduled Auto Checkout Task
 * 
 * This script runs the auto checkout process and can be scheduled
 * to run daily via cron job or task scheduler.
 */

const { autoCheckoutPastBookings } = require('./auto-checkout-past-bookings');

async function runScheduledAutoCheckout() {
  console.log(`🕐 Scheduled auto checkout started at ${new Date().toISOString()}`);
  
  try {
    await autoCheckoutPastBookings();
    console.log(`✅ Scheduled auto checkout completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`❌ Scheduled auto checkout failed at ${new Date().toISOString()}:`, error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runScheduledAutoCheckout();
}

module.exports = { runScheduledAutoCheckout };
