/**
 * Migration: Add prebooking_code column to pre_booking table
 */

require('dotenv').config();
const { pool } = require('../src/db');

async function addPreBookingCode() {
  try {
    console.log('🔧 Adding prebooking_code column to pre_booking table...');
    
    // Add the column
    await pool.query(`
      ALTER TABLE pre_booking 
      ADD COLUMN IF NOT EXISTS prebooking_code VARCHAR(20) UNIQUE
    `);
    
    console.log('✅ Column added successfully');
    
    // Generate codes for existing pre-bookings
    console.log('🔧 Generating codes for existing pre-bookings...');
    
    const { rows: existingPreBookings } = await pool.query(`
      SELECT pre_booking_id 
      FROM pre_booking 
      WHERE prebooking_code IS NULL
      ORDER BY pre_booking_id ASC
    `);
    
    let counter = 1;
    for (const pb of existingPreBookings) {
      const code = 'PRE' + counter.toString().padStart(4, '0');
      await pool.query(
        `UPDATE pre_booking SET prebooking_code = $1 WHERE pre_booking_id = $2`,
        [code, pb.pre_booking_id]
      );
      console.log(`  ✅ Pre-booking ${pb.pre_booking_id} -> ${code}`);
      counter++;
    }
    
    console.log(`✅ Successfully generated ${existingPreBookings.length} prebooking codes`);
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
addPreBookingCode().catch(err => {
  console.error(err);
  process.exit(1);
});
