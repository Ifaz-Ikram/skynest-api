// src/controllers/auth.controller.js
const { pool } = require("../db");
const bcrypt = require("bcryptjs");
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

    // Set httpOnly cookie for browser clients (still return token for APIs)
    const secure = String(process.env.NODE_ENV).toLowerCase() === "production";
    const maxAgeMs = 1000 * 60 * 60 * 24 * 2; // ~2 days
    try {
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        maxAge: maxAgeMs,
        path: "/",
      });
    } catch {
      // res.cookie available in Express; ignore if not
    }

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

function me(req, res) {
  // requireAuth fills req.user
  const u = req.user || null;
  if (!u) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: u });
}

function logout(_req, res) {
  try {
    res.clearCookie("token", { path: "/" });
  } catch {
    // Ignore cookie clear errors
  }
  res.json({ ok: true });
}

async function register(req, res) {
  try {
    console.log('📝 Registration request received:', req.body);
    
    const {
      username,
      password,
      full_name,
      email,
      phone,
      address,
    } = req.body;

    // Validation
    if (!username || !password || !full_name || !email || !phone) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    console.log('✅ Validation passed, checking username...');
    
    // Check if username already exists
    const existingUser = await pool.query(
      "SELECT user_id FROM user_account WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Username already exists');
      return res.status(400).json({ error: "Username already exists" });
    }

    console.log('✅ Username available, checking email...');
    
    // Check if email already exists
    const existingEmail = await pool.query(
      "SELECT guest_id FROM guest WHERE email = $1",
      [email]
    );

    if (existingEmail.rows.length > 0) {
      console.log('❌ Email already registered');
      return res.status(400).json({ error: "Email already registered" });
    }

    console.log('✅ Email available, hashing password...');
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    console.log('✅ Password hashed, starting transaction...');
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      console.log('✅ Transaction started, creating user account...');
      
      // 1. Create user_account with role 'Customer'
      const userResult = await client.query(
        `INSERT INTO user_account (username, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING user_id`,
        [username, password_hash, "Customer"]
      );
      const user_id = userResult.rows[0].user_id;

      console.log('✅ User account created, creating guest record...');
      
      // 2. Create guest record
      const guestResult = await client.query(
        `INSERT INTO guest (full_name, email, phone, address)
         VALUES ($1, $2, $3, $4)
         RETURNING guest_id`,
        [full_name, email, phone, address || null]
      );
      const guest_id = guestResult.rows[0].guest_id;

      console.log('✅ Guest record created, creating customer record...');
      
      // 3. Create customer record linking user and guest
      await client.query(
        `INSERT INTO customer (user_id, guest_id)
         VALUES ($1, $2)`,
        [user_id, guest_id]
      );

      await client.query("COMMIT");
      
      console.log('✅ Registration successful!');

      return res.status(201).json({
        message: "Account created successfully",
        username: username,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error('❌ Transaction error:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Registration error:", err);
    return res.status(500).json({ error: "Failed to create account" });
  }
}

module.exports = { login, me, logout, register };
