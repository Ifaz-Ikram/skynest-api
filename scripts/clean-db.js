/**
 * Clean database script - removes all data and resets sequences
 * Run this before seeding: npm run db:clean
 */

require('dotenv').config();
const { pool } = require('../src/db');

async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning database...\n');

    // Delete in correct order (respecting foreign keys)
    console.log('🗑️  Deleting data...');
    await pool.query('DELETE FROM invoice');
    await pool.query('DELETE FROM payment_adjustment');
    await pool.query('DELETE FROM payment');
    await pool.query('DELETE FROM service_usage');
    await pool.query('DELETE FROM booking');
    await pool.query('DELETE FROM pre_booking');
    await pool.query('DELETE FROM service_catalog');
    await pool.query('DELETE FROM room');
    await pool.query('DELETE FROM customer');
    await pool.query('DELETE FROM employee');
    await pool.query('DELETE FROM user_account'); // Must delete before guest (has FK to guest)
    await pool.query('DELETE FROM guest');
    await pool.query('DELETE FROM room_type');
    await pool.query('DELETE FROM branch');
    console.log('  ✅ All data deleted\n');

    // Reset sequences
    console.log('🔄 Resetting sequences...');
    await pool.query('ALTER SEQUENCE IF EXISTS branch_branch_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS room_type_room_type_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS room_room_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS user_account_user_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS guest_guest_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS employee_employee_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS customer_customer_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS booking_booking_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS pre_booking_prebooking_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS service_catalog_service_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS service_usage_usage_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS payment_payment_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS payment_adjustment_adjustment_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE IF EXISTS invoice_invoice_id_seq RESTART WITH 1');
    console.log('  ✅ Sequences reset\n');

    console.log('✅ Database cleaned successfully!');
  } catch (error) {
    console.error('❌ Clean failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  cleanDatabase();
}

module.exports = { cleanDatabase };
