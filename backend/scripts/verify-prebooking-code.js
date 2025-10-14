require('dotenv').config();
const { pool } = require('../src/db');

async function verify() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'pre_booking' 
      AND column_name = 'prebooking_code'
    `);
    
    console.log('✅ Column exists:', result.rows);
    
    // Test query
    const test = await pool.query('SELECT pre_booking_id, prebooking_code FROM pre_booking LIMIT 5');
    console.log('\n📋 Sample data:');
    console.log(test.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
