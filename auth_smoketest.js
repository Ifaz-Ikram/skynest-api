require("dotenv").config();
const { Pool } = require("pg");
const bjs = require("bcryptjs");
(async () => {
  const pool = new Pool();                         // uses your .env (PGHOST=127.0.0.1 etc.)
  const { rows } = await pool.query(
    "SELECT user_id, username, password_hash FROM user_account WHERE username=$1",
    ["customer1"]
  );
  console.log("rows:", rows);
  if (!rows[0]) { console.log("NO USER ROW"); process.exit(1); }
  console.log("compare(bcryptjs):", bjs.compareSync("cust123", rows[0].password_hash));
  try {
    const b = require("bcrypt");
    console.log("compare(bcrypt):", b.compareSync("cust123", rows[0].password_hash));
  } catch (e) {
    console.log("native bcrypt not installed (ok)");
  }
  await pool.end();
})();
