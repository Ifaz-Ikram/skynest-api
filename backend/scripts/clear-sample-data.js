/**
 * Clear Sample Data Script
 * Removes all sample data from the database while keeping the schema intact
 */

require('dotenv').config();
const { pool } = require('../src/db');

async function clearSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Clearing sample data from database...');
    await client.query('BEGIN');
    
    // Clear in reverse dependency order to avoid foreign key violations
    console.log('Clearing invoices...');
    await client.query('DELETE FROM invoice');
    
    console.log('Clearing service usage...');
    await client.query('DELETE FROM service_usage');
    
    console.log('Clearing payments...');
    await client.query('DELETE FROM payment');
    
    console.log('Clearing payment adjustments...');
    await client.query('DELETE FROM payment_adjustment');
    
    console.log('Clearing check-ins...');
    await client.query('DELETE FROM checkin');
    
    console.log('Clearing check-outs...');
    await client.query('DELETE FROM checkout');
    
    console.log('Clearing bookings...');
    await client.query('DELETE FROM booking');
    
    console.log('Clearing pre-bookings...');
    await client.query('DELETE FROM pre_booking');
    
    console.log('Clearing customers...');
    await client.query('DELETE FROM customer');
    
    console.log('Clearing employees...');
    await client.query('DELETE FROM employee');
    
    console.log('Clearing user accounts...');
    await client.query('DELETE FROM user_account');
    
    console.log('Clearing guests...');
    await client.query('DELETE FROM guest');
    
    console.log('Clearing rooms...');
    await client.query('DELETE FROM room');
    
    console.log('Clearing room types...');
    await client.query('DELETE FROM room_type');
    
    console.log('Clearing service catalog...');
    await client.query('DELETE FROM service_catalog');
    
    console.log('Clearing branches...');
    await client.query('DELETE FROM branch');
    
    console.log('Clearing group bookings...');
    await client.query('DELETE FROM group_booking');
    
    await client.query('COMMIT');
    console.log('✅ Sample data cleared successfully!');
    console.log('📝 Your database is now clean and ready for real data.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing sample data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  clearSampleData()
    .then(() => {
      console.log('🎉 Sample data clearing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Sample data clearing failed:', error);
      process.exit(1);
    });
}

module.exports = { clearSampleData };
