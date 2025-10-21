#!/usr/bin/env node

/**
 * Auto-Convert Pre-Bookings Script
 * 
 * This script automatically converts pre-bookings to bookings 7 days before check-in
 * if they haven't been manually converted yet.
 * 
 * Usage: node scripts/auto-convert-prebookings.js
 */

const { Pool } = require('pg');
const path = require('path');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skynest',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function autoConvertPreBookings() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting auto-conversion of pre-bookings...');
    
    // Find pre-bookings that need to be converted (7 days before check-in)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const targetDate = sevenDaysFromNow.toISOString().split('T')[0];
    
    console.log(`📅 Looking for pre-bookings with check-in date: ${targetDate}`);
    
    const preBookingsQuery = `
      SELECT pb.*, rt.name as room_type_name, rt.daily_rate,
             c.guest_id as customer_guest_id, g.full_name as customer_name
      FROM pre_booking pb
      LEFT JOIN room_type rt ON rt.room_type_id = pb.room_type_id
      LEFT JOIN customer c ON c.customer_id = pb.customer_id
      LEFT JOIN guest g ON g.guest_id = c.guest_id
      WHERE pb.expected_check_in = $1
      AND pb.status = 'Pending'
      AND pb.auto_cancel_date IS NOT NULL
      AND pb.auto_cancel_date <= CURRENT_DATE
    `;
    
    const preBookingsResult = await client.query(preBookingsQuery, [targetDate]);
    const preBookings = preBookingsResult.rows;
    
    console.log(`📋 Found ${preBookings.length} pre-bookings to process`);
    
    if (preBookings.length === 0) {
      console.log('✅ No pre-bookings need conversion today');
      return;
    }
    
    let convertedCount = 0;
    let failedCount = 0;
    
    for (const preBooking of preBookings) {
      try {
        console.log(`\n🔄 Processing pre-booking #${preBooking.pre_booking_id}...`);
        
        await client.query('BEGIN');
        
        // Determine if this is a group booking
        const isGroupBooking = preBooking.number_of_rooms > 1;
        
        if (isGroupBooking) {
          // Group booking conversion
          await convertGroupPreBooking(client, preBooking);
        } else {
          // Individual booking conversion
          await convertIndividualPreBooking(client, preBooking);
        }
        
        await client.query('COMMIT');
        convertedCount++;
        console.log(`✅ Successfully converted pre-booking #${preBooking.pre_booking_id}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        failedCount++;
        console.error(`❌ Failed to convert pre-booking #${preBooking.pre_booking_id}:`, error.message);
        
        // Mark as failed for manual review
        await client.query(
          `UPDATE pre_booking SET status = 'Cancelled' WHERE pre_booking_id = $1`,
          [preBooking.pre_booking_id]
        );
      }
    }
    
    console.log(`\n📊 Auto-conversion summary:`);
    console.log(`   ✅ Successfully converted: ${convertedCount}`);
    console.log(`   ❌ Failed conversions: ${failedCount}`);
    console.log(`   📅 Target check-in date: ${targetDate}`);
    
  } catch (error) {
    console.error('💥 Auto-conversion script failed:', error);
  } finally {
    client.release();
  }
}

async function convertGroupPreBooking(client, preBooking) {
  // Find available rooms of the specified type
  const availableRoomsQuery = `
    SELECT r.room_id, r.room_number
    FROM room r
    WHERE r.room_type_id = $1 
    AND r.status = 'Available'
    AND r.room_id NOT IN (
      SELECT DISTINCT b.room_id 
      FROM booking b 
      WHERE b.status IN ('Booked', 'Checked-In')
      AND (
        (b.check_in_date <= $2 AND b.check_out_date > $2) OR
        (b.check_in_date < $3 AND b.check_out_date >= $3) OR
        (b.check_in_date >= $2 AND b.check_out_date <= $3)
      )
    )
    ORDER BY r.room_number
    LIMIT $4
  `;
  
  const availableRoomsResult = await client.query(availableRoomsQuery, [
    preBooking.room_type_id,
    preBooking.expected_check_in,
    preBooking.expected_check_out,
    preBooking.number_of_rooms
  ]);
  
  if (availableRoomsResult.rows.length < preBooking.number_of_rooms) {
    throw new Error(`Insufficient rooms available. Need ${preBooking.number_of_rooms}, found ${availableRoomsResult.rows.length}`);
  }
  
  // Create multiple bookings
  const groupName = preBooking.group_name || `Auto-Group-${preBooking.pre_booking_id}`;
  const bookedRate = preBooking.daily_rate || 0;
  
  for (let i = 0; i < preBooking.number_of_rooms; i++) {
    const room = availableRoomsResult.rows[i];
    
    await client.query(
      `INSERT INTO booking (
        pre_booking_id, guest_id, room_id, check_in_date, check_out_date, 
        status, booked_rate, tax_rate_percent, advance_payment, group_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        preBooking.pre_booking_id,
        preBooking.customer_guest_id, // Use customer as guest for auto-conversion
        room.room_id,
        preBooking.expected_check_in,
        preBooking.expected_check_out,
        'Booked',
        bookedRate,
        0, // No tax for auto-conversion
        0, // No advance payment for auto-conversion
        groupName
      ]
    );
  }
  
  // Update pre-booking status
  await client.query(
    `UPDATE pre_booking SET status = 'Converted' WHERE pre_booking_id = $1`,
    [preBooking.pre_booking_id]
  );
}

async function convertIndividualPreBooking(client, preBooking) {
  // Find an available room of the specified type
  const availableRoomQuery = `
    SELECT r.room_id, r.room_number
    FROM room r
    WHERE r.room_type_id = $1 
    AND r.status = 'Available'
    AND r.room_id NOT IN (
      SELECT DISTINCT b.room_id 
      FROM booking b 
      WHERE b.status IN ('Booked', 'Checked-In')
      AND (
        (b.check_in_date <= $2 AND b.check_out_date > $2) OR
        (b.check_in_date < $3 AND b.check_out_date >= $3) OR
        (b.check_in_date >= $2 AND b.check_out_date <= $3)
      )
    )
    ORDER BY r.room_number
    LIMIT 1
  `;
  
  const availableRoomResult = await client.query(availableRoomQuery, [
    preBooking.room_type_id,
    preBooking.expected_check_in,
    preBooking.expected_check_out
  ]);
  
  if (availableRoomResult.rows.length === 0) {
    throw new Error('No available rooms of the requested type');
  }
  
  const room = availableRoomResult.rows[0];
  const bookedRate = preBooking.daily_rate || 0;
  
  // Create single booking
  await client.query(
    `INSERT INTO booking (
      pre_booking_id, guest_id, room_id, check_in_date, check_out_date, 
      status, booked_rate, tax_rate_percent, advance_payment
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      preBooking.pre_booking_id,
      preBooking.customer_guest_id, // Use customer as guest for auto-conversion
      room.room_id,
      preBooking.expected_check_in,
      preBooking.expected_check_out,
      'Booked',
      bookedRate,
      0, // No tax for auto-conversion
      0  // No advance payment for auto-conversion
    ]
  );
  
  // Update pre-booking status
  await client.query(
    `UPDATE pre_booking SET status = 'Converted' WHERE pre_booking_id = $1`,
    [preBooking.pre_booking_id]
  );
}

// Run the script
if (require.main === module) {
  autoConvertPreBookings()
    .then(() => {
      console.log('🎉 Auto-conversion script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Auto-conversion script failed:', error);
      process.exit(1);
    });
}

module.exports = { autoConvertPreBookings };
