/**
 * Migration: Add id_proof_type and id_proof_number to guest table
 * Date: 2025-10-14
 * Reason: Support both NIC (for locals) and passport/other ID types (for foreigners)
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: Add id_proof_type and id_proof_number columns...');
    
    // Add the columns if they don't exist
    await client.query(`
      ALTER TABLE guest 
      ADD COLUMN IF NOT EXISTS id_proof_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS id_proof_number VARCHAR(50)
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added: id_proof_type VARCHAR(50)');
    console.log('   - Added: id_proof_number VARCHAR(50)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
