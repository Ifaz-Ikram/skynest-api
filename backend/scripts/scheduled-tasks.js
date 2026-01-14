#!/usr/bin/env node

/**
 * Scheduled Tasks Runner
 * 
 * This script runs various scheduled tasks including:
 * - Auto-conversion of pre-bookings (7 days before check-in)
 * - Auto-cancellation of expired pre-bookings
 * - Auto-checkout of past bookings
 * 
 * Usage: node scripts/scheduled-tasks.js
 */

const { autoConvertPreBookings } = require('./auto-convert-prebookings');
const { autoCancelExpiredPreBookings } = require('./auto-cancel-prebookings');
const { autoCheckoutPastBookings } = require('./auto-checkout-past-bookings');

async function runScheduledTasks() {
  console.log('🕐 Starting scheduled tasks...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  const tasks = [
    {
      name: 'Auto-convert Pre-bookings',
      fn: autoConvertPreBookings,
      description: 'Convert pre-bookings to bookings 7 days before check-in'
    },
    {
      name: 'Auto-cancel Expired Pre-bookings',
      fn: autoCancelExpiredPreBookings,
      description: 'Cancel pre-bookings that expired without conversion'
    },
    {
      name: 'Auto-checkout Past Bookings',
      fn: autoCheckoutPastBookings,
      description: 'Checkout bookings that are past their checkout date'
    }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const task of tasks) {
    try {
      console.log(`\n🔄 Running: ${task.name}`);
      console.log(`📝 ${task.description}`);
      
      await task.fn();
      
      console.log(`✅ ${task.name} completed successfully`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ ${task.name} failed:`, error.message);
      failureCount++;
    }
  }
  
  console.log(`\n📊 Scheduled tasks summary:`);
  console.log(`   ✅ Successful tasks: ${successCount}`);
  console.log(`   ❌ Failed tasks: ${failureCount}`);
  console.log(`   📅 Completed at: ${new Date().toISOString()}`);
  
  return { successCount, failureCount };
}

// Run the scheduled tasks
if (require.main === module) {
  runScheduledTasks()
    .then(({ failureCount }) => {
      if (failureCount === 0) {
        console.log('🎉 All scheduled tasks completed successfully');
        process.exit(0);
      } else {
        console.log('⚠️ Some scheduled tasks failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Scheduled tasks runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runScheduledTasks };