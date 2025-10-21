#!/usr/bin/env node

/**
 * Auto-Checkout Past Bookings Script
 * 
 * This script automatically checks out bookings that are past their checkout date.
 * It reuses the existing auto-checkout functionality.
 * 
 * Usage: node scripts/auto-checkout-past-bookings.js
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skynest',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function autoCheckoutPastBookings() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting auto-checkout of past bookings...');
    
    // Find bookings that should be checked out (past their checkout date)
    const pastBookingsQuery = `
      SELECT b.*, g.full_name as guest_name, r.room_number
      FROM booking b
      JOIN guest g ON g.guest_id = b.guest_id
      JOIN room r ON r.room_id = b.room_id
      WHERE b.status = 'Checked-In'
      AND b.check_out_date < CURRENT_DATE
    `;
    
    const pastBookingsResult = await client.query(pastBookingsQuery);
    const pastBookings = pastBookingsResult.rows;
    
    console.log(`📋 Found ${pastBookings.length} past bookings to checkout`);
    
    if (pastBookings.length === 0) {
      console.log('✅ No past bookings found');
      return;
    }
    
    let checkedOutCount = 0;
    
    for (const booking of pastBookings) {
      try {
        console.log(`\n🔄 Checking out booking #${booking.booking_id}...`);
        console.log(`   Guest: ${booking.guest_name}`);
        console.log(`   Room: ${booking.room_number}`);
        console.log(`   Check-out date: ${booking.check_out_date}`);
        
        // Update booking status to 'Checked-Out'
        await client.query(
          `UPDATE booking SET status = 'Checked-Out' WHERE booking_id = $1`,
          [booking.booking_id]
        );
        
        // Update room status to 'Available'
        await client.query(
          `UPDATE room SET status = 'Available' WHERE room_id = $1`,
          [booking.room_id]
        );
        
        checkedOutCount++;
        console.log(`✅ Successfully checked out booking #${booking.booking_id}`);
        
      } catch (error) {
        console.error(`❌ Failed to checkout booking #${booking.booking_id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Auto-checkout summary:`);
    console.log(`   ✅ Successfully checked out: ${checkedOutCount}`);
    console.log(`   📅 Processed on: ${new Date().toISOString().split('T')[0]}`);
    
  } catch (error) {
    console.error('💥 Auto-checkout script failed:', error);
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  autoCheckoutPastBookings()
    .then(() => {
      console.log('🎉 Auto-checkout script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Auto-checkout script failed:', error);
      process.exit(1);
    });
}

module.exports = { autoCheckoutPastBookings };