const { Pool, types } = require("pg");
require("dotenv").config();

types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v))); // NUMERIC
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10))); // BIGINT

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

if (process.env.NODE_ENV !== "test") {
  pool
    .query("SELECT 1")
    .then(() => console.log("🟢 DB reachable"))
    .catch((e) => console.error("🟡 DB not reachable yet:", e.message));
}

async function closePool() {
  try {
    await pool.end();
    if (process.env.NODE_ENV !== "test") console.log("🧹 DB pool closed");
  } catch {
    // swallow errors on shutdown
  }
}

module.exports = { pool, closePool };
