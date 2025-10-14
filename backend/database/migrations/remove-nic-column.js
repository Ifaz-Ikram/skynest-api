/**
 * Migration: Remove NIC column from guest table
 * Date: 2025-10-14
 * Reason: Consolidate all ID types into id_proof_type and id_proof_number
 * ID Types: NIC, Passport, Driving License
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
    console.log('🔄 Starting migration: Remove NIC column and consolidate to id_proof_type...');
    
    // First, migrate any existing NIC data to id_proof_type/id_proof_number
    await client.query(`
      UPDATE guest 
      SET id_proof_type = 'NIC', 
          id_proof_number = nic
      WHERE nic IS NOT NULL 
        AND (id_proof_type IS NULL OR id_proof_type = '')
    `);
    
    console.log('✅ Migrated existing NIC data to id_proof_type/id_proof_number');
    
    // Now drop the NIC column
    await client.query(`
      ALTER TABLE guest 
      DROP COLUMN IF EXISTS nic
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Migrated NIC data to id_proof_type/id_proof_number');
    console.log('   - Removed NIC column');
    console.log('   - ID Types available: NIC, Passport, Driving License');
    
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
