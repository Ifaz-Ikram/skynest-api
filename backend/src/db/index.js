const { Pool } = require('pg');

// Normalize env across DB_* and PG* variable styles
const dbHost = process.env.DB_HOST || process.env.PGHOST || '127.0.0.1';
const dbPort = Number(process.env.DB_PORT || process.env.PGPORT || 5432);
const dbName = process.env.DB_DATABASE || process.env.PGDATABASE || process.env.DB_NAME || 'skynest';
const dbUser = process.env.DB_USER || process.env.PGUSER || 'postgres';
const dbPass = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres';
const wantSSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const poolConfig = {
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPass, // Always set password, even if empty
  ssl: wantSSL ? { require: true, rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

async function closePool() {
  await pool.end();
}

module.exports = { pool, closePool };
