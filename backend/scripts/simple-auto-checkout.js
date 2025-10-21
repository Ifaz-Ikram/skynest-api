#!/usr/bin/env node
/**
 * Simple Auto Checkout - Just updates booking and room status
 * No complex database operations, just the essentials
 */

require('dotenv').config();
const { pool } = require('../src/db');

async function simpleAutoCheckout() {
  console.log('🚀 Starting simple auto checkout...');
  
  try {
    // Find all past bookings that need checkout
    const pastBookingsQuery = `
      SELECT 
        b.booking_id,
        b.room_id,
        b.guest_id,
        b.check_out_date,
        g.full_name AS guest_name,
        r.room_number
      FROM booking b
      JOIN guest g ON b.guest_id = g.guest_id
      JOIN room r ON b.room_id = r.room_id
      WHERE b.status = 'Checked-In'
        AND b.check_out_date < CURRENT_DATE
      ORDER BY b.check_out_date ASC
      LIMIT 50
    `;
    
    const pastBookingsRes = await pool.query(pastBookingsQuery);
    const pastBookings = pastBookingsRes.rows;
    
    if (pastBookings.length === 0) {
      console.log('✅ No past bookings found that need checkout');
      return;
    }
    
    console.log(`📋 Found ${pastBookings.length} past bookings to checkout (showing first 50)`);
    
    // Process each booking
    let successCount = 0;
    let errorCount = 0;
    
    for (const booking of pastBookings) {
      try {
        console.log(`🔄 Processing Booking #${booking.booking_id} (${booking.guest_name})...`);
        
        // Update booking status to Checked-Out
        await pool.query(
          'UPDATE booking SET status = $1 WHERE booking_id = $2',
          ['Checked-Out', booking.booking_id]
        );
        
        // Update room status to Maintenance
        await pool.query(
          'UPDATE room SET status = $1 WHERE room_id = $2',
          ['Maintenance', booking.room_id]
        );
        
        console.log(`  ✅ Booking #${booking.booking_id} checked out successfully`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Error processing booking #${booking.booking_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Simple auto checkout completed:`);
    console.log(`  ✅ Successfully processed: ${successCount} bookings`);
    console.log(`  ❌ Errors: ${errorCount} bookings`);
    console.log(`  📋 Total processed: ${pastBookings.length} bookings`);
    
    if (successCount > 0) {
      console.log('\n🎉 Past bookings have been successfully checked out!');
      console.log('💡 You can now try checking out current bookings normally.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  simpleAutoCheckout()
    .then(() => {
      console.log('\n✅ Simple auto checkout completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { simpleAutoCheckout };
