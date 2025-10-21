const { pool } = require('../src/db');
require('dotenv').config();

async function cleanDatabase() {
  const client = await pool.connect();
  try {
    console.log('🧹 Cleaning database...');
    await client.query('BEGIN');
    const tables = [
      'invoice', 'payment_adjustment', 'payment', 'service_usage', 'booking',
      'pre_booking', 'service_catalog', 'room', 'customer', 'employee',
      'user_account', 'guest', 'room_type', 'branch', 'audit_log'
    ];
    for (const table of tables) {
      console.log(`Dropping table ${table}...`);
      await client.query(`DROP TABLE IF EXISTS public.${table} CASCADE`);
    }
    console.log('✅ All tables dropped.');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Clean failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  cleanDatabase();
}

module.exports = { cleanDatabase };