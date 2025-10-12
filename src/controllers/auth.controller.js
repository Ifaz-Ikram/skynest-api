// src/controllers/auth.controller.js
const { pool } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// If you already validate body with Zod in the route, this is just a safety net.
function ensureBody(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: "username & password required" });
    return null;
  }
  return { username, password };
}

function signJWT(payload) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES || "2d";
  if (!secret) throw new Error("JWT_SECRET missing in .env");
  return jwt.sign(payload, secret, { expiresIn });
}

async function login(req, res) {
  try {
    const parsed = ensureBody(req, res);
    if (!parsed) return;
    const { username, password } = parsed;

    // 1) Find user (keep is_active for soft lockouts without user enumeration)
    const { rows } = await pool.query(
      `SELECT user_id, username, password_hash, role
        FROM user_account
        WHERE username = $1`,
      [username],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 2) Verify password
    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // 3) Join persona data
    // We’ll assemble both “customer-side” and “employee-side” ids if present.
    const persona = {
      customer_id: null,
      guest_id: null,
      full_name: null,
      employee_id: null,
      branch_id: null,
      branch_name: null,
    };

    // Try to fetch customer + guest mapping (if any)
    const customerQ = await pool.query(
      `SELECT c.customer_id, g.guest_id, g.full_name
         FROM customer c
         JOIN guest g ON g.guest_id = c.guest_id
        WHERE c.user_id = $1
        LIMIT 1`,
      [user.user_id],
    );
    if (customerQ.rows.length) {
      const c = customerQ.rows[0];
      persona.customer_id = c.customer_id;
      persona.guest_id = c.guest_id;
      persona.full_name = c.full_name;
    }

    // Try to fetch employee + branch mapping (if any)
    const employeeQ = await pool.query(
      `SELECT e.employee_id, e.branch_id, b.branch_name
         FROM employee e
         JOIN branch b ON b.branch_id = e.branch_id
        WHERE e.user_id = $1
        LIMIT 1`,
      [user.user_id],
    );
    if (employeeQ.rows.length) {
      const e = employeeQ.rows[0];
      persona.employee_id = e.employee_id;
      persona.branch_id = e.branch_id;
      persona.branch_name = e.branch_name;
    }

    // 4) Build JWT payload similar to your ORM version
    const payload = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      customer_id: persona.customer_id,
      employee_id: persona.employee_id,
      guest_id: persona.guest_id,
      branch_id: persona.branch_id,
    };

    const token = signJWT(payload);

    // 5) Respond with token + some user profile data
    return res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        is_active: user.is_active,
        ...persona,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { login };
