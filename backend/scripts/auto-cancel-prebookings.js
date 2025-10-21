#!/usr/bin/env node

/**
 * Auto-Cancel Expired Pre-Bookings Script
 * 
 * This script automatically cancels pre-bookings that have passed their
 * auto_cancel_date without being converted to bookings.
 * 
 * Usage: node scripts/auto-cancel-prebookings.js
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

async function autoCancelExpiredPreBookings() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting auto-cancellation of expired pre-bookings...');
    
    // Find pre-bookings that should be cancelled (past their auto_cancel_date)
    const expiredPreBookingsQuery = `
      SELECT pb.*, rt.name as room_type_name,
             c.guest_id as customer_guest_id, g.full_name as customer_name
      FROM pre_booking pb
      LEFT JOIN room_type rt ON rt.room_type_id = pb.room_type_id
      LEFT JOIN customer c ON c.customer_id = pb.customer_id
      LEFT JOIN guest g ON g.guest_id = c.guest_id
      WHERE pb.status = 'Pending'
      AND pb.auto_cancel_date IS NOT NULL
      AND pb.auto_cancel_date < CURRENT_DATE
    `;
    
    const expiredPreBookingsResult = await client.query(expiredPreBookingsQuery);
    const expiredPreBookings = expiredPreBookingsResult.rows;
    
    console.log(`📋 Found ${expiredPreBookings.length} expired pre-bookings to cancel`);
    
    if (expiredPreBookings.length === 0) {
      console.log('✅ No expired pre-bookings found');
      return;
    }
    
    let cancelledCount = 0;
    
    for (const preBooking of expiredPreBookings) {
      try {
        console.log(`\n🔄 Cancelling pre-booking #${preBooking.pre_booking_id}...`);
        console.log(`   Customer: ${preBooking.customer_name || 'Unknown'}`);
        console.log(`   Room Type: ${preBooking.room_type_name || 'Unknown'}`);
        console.log(`   Check-in: ${preBooking.expected_check_in}`);
        console.log(`   Auto-cancel date: ${preBooking.auto_cancel_date}`);
        
        // Release reserved rooms first
        if (preBooking.room_type_id && preBooking.number_of_rooms > 0) {
          console.log(`   🏠 Releasing ${preBooking.number_of_rooms} reserved room(s)...`);
          
          // Find and release reserved rooms for this pre-booking
          const reservedRooms = await client.query(`
            SELECT r.room_id, r.room_number
            FROM room r
            WHERE r.room_type_id = $1
            AND r.status = 'Reserved'
            AND EXISTS (
              SELECT 1 FROM pre_booking pb
              WHERE pb.room_type_id = r.room_type_id
              AND pb.pre_booking_id = $2
              AND pb.status IN ('Pending', 'Confirmed')
            )
            LIMIT $3
          `, [preBooking.room_type_id, preBooking.pre_booking_id, preBooking.number_of_rooms]);
          
          if (reservedRooms.rows.length > 0) {
            const roomIds = reservedRooms.rows.map(room => room.room_id);
            await client.query(`
              UPDATE room 
              SET status = 'Available' 
              WHERE room_id = ANY($1)
            `, [roomIds]);
            
            console.log(`   ✅ Released ${reservedRooms.rows.length} room(s): ${reservedRooms.rows.map(r => r.room_number).join(', ')}`);
          } else {
            console.log(`   ⚠️  No reserved rooms found to release`);
          }
        }
        
        // Update pre-booking status to 'Cancelled'
        await client.query(
          `UPDATE pre_booking SET status = 'Cancelled' WHERE pre_booking_id = $1`,
          [preBooking.pre_booking_id]
        );
        
        cancelledCount++;
        console.log(`✅ Successfully cancelled pre-booking #${preBooking.pre_booking_id}`);
        
      } catch (error) {
        console.error(`❌ Failed to cancel pre-booking #${preBooking.pre_booking_id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Auto-cancellation summary:`);
    console.log(`   ✅ Successfully cancelled: ${cancelledCount}`);
    console.log(`   📅 Processed on: ${new Date().toISOString().split('T')[0]}`);
    
  } catch (error) {
    console.error('💥 Auto-cancellation script failed:', error);
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  autoCancelExpiredPreBookings()
    .then(() => {
      console.log('🎉 Auto-cancellation script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Auto-cancellation script failed:', error);
      process.exit(1);
    });
}

module.exports = { autoCancelExpiredPreBookings };
