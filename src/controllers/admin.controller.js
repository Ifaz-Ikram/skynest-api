const bcrypt = require("bcrypt");
const { pool } = require("../db");

// -------- Users --------
async function listUsers(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT 
        ua.user_id, 
        ua.username, 
        ua.role, 
        ua.guest_id,
        e.email,
        e.name as full_name
      FROM user_account ua
      LEFT JOIN employee e ON e.user_id = ua.user_id
      ORDER BY ua.user_id`,
    );
    res.json(rows);
  } catch (e) {
    console.error("listUsers error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Role-based permission matrix for creating users:
 * - Admin: Can create Admin, Manager, Receptionist, Accountant, Customer
 * - Manager: Can create Receptionist, Accountant, Customer (NOT Admin, NOT Manager)
 * - Receptionist: Can create Customer only (NOT Admin, Manager, Accountant)
 * - Accountant: Can be created only by Admin and Manager
 */
function canCreateRole(currentUserRole, targetRole) {
  const permissions = {
    'Admin': ['Admin', 'Manager', 'Receptionist', 'Accountant', 'Customer'],
    'Manager': ['Receptionist', 'Accountant', 'Customer'],
    'Receptionist': ['Customer'],
    'Accountant': [],
    'Customer': []
  };
  
  return permissions[currentUserRole]?.includes(targetRole) || false;
}

async function createUser(req, res) {
  try {
    const { username, password, role = "Customer", guest_id = null } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });
    
    // Check if current user has permission to create the target role
    const currentUserRole = req.user?.role;
    if (!currentUserRole) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!canCreateRole(currentUserRole, role)) {
      return res.status(403).json({ 
        error: `You don't have permission to create ${role} accounts`,
        currentRole: currentUserRole,
        attemptedRole: role
      });
    }
    
    const hash = await bcrypt.hash(String(password), 10);
    const { rows } = await pool.query(
      `INSERT INTO user_account (username, password_hash, role, guest_id)
       VALUES ($1,$2,$3,$4)
       RETURNING user_id, username, role, guest_id`,
      [String(username), hash, String(role), guest_id != null ? Number(guest_id) : null],
    );
    res.status(201).json({ user: rows[0] });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Username already exists" });
    console.error("createUser error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateUserRole(req, res) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body || {};
    if (!id || !role) return res.status(400).json({ error: "id and role required" });
    const r = await pool.query(
      `UPDATE user_account SET role=$1 WHERE user_id=$2 RETURNING user_id, username, role, guest_id`,
      [String(role), id],
    );
    if (!r.rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ user: r.rows[0] });
  } catch (e) {
    console.error("updateUserRole error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const r = await pool.query(`DELETE FROM user_account WHERE user_id=$1`, [id]);
    if (!r.rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("deleteUser error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

// -------- Service Catalog --------
async function createService(req, res) {
  try {
    const { code, name, category = "Misc", unit_price = 0, tax_rate_percent = 0, active = true } = req.body || {};
    if (!code || !name) return res.status(400).json({ error: "code and name required" });
    const { rows } = await pool.query(
      `INSERT INTO service_catalog (code, name, category, unit_price, tax_rate_percent, active)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING service_id, code, name, category, unit_price, tax_rate_percent, active`,
      [String(code), String(name), String(category), Number(unit_price), Number(tax_rate_percent), !!active],
    );
    res.status(201).json({ service: rows[0] });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Duplicate service code" });
    console.error("createService error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateService(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const patch = req.body || {};
    const fields = [];
    const vals = [];
    const push = (col, val) => { fields.push(col+`=$${vals.length+1}`); vals.push(val); };
    if (patch.code != null) push("code", String(patch.code));
    if (patch.name != null) push("name", String(patch.name));
    if (patch.category != null) push("category", String(patch.category));
    if (patch.unit_price != null) push("unit_price", Number(patch.unit_price));
    if (patch.tax_rate_percent != null) push("tax_rate_percent", Number(patch.tax_rate_percent));
    if (patch.active != null) push("active", !!patch.active);
    if (!fields.length) return res.status(400).json({ error: "No fields to update" });
    vals.push(id);
    const r = await pool.query(
      `UPDATE service_catalog SET ${fields.join(",")} WHERE service_id=$${vals.length} RETURNING service_id, code, name, category, unit_price, tax_rate_percent, active`,
      vals,
    );
    if (!r.rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ service: r.rows[0] });
  } catch (e) {
    console.error("updateService error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteService(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const r = await pool.query(`DELETE FROM service_catalog WHERE service_id=$1`, [id]);
    if (!r.rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("deleteService error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function adminListServices(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT service_id, code, name, category, unit_price, tax_rate_percent, active 
       FROM service_catalog 
       ORDER BY category, name`
    );
    res.json({ services: rows });
  } catch (e) {
    console.error("adminListServices error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function listBranches(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT branch_id, branch_name, address, contact_number, manager_name, branch_code 
       FROM branch 
       ORDER BY branch_name`
    );
    res.json(rows);
  } catch (e) {
    console.error("listBranches error:", e);
    res.status(500).json({ error: e.message || "Internal server error" });
  }
}

async function listBranchRooms(req, res) {
  try {
    const branchId = Number(req.params.id);
    if (!branchId) return res.status(400).json({ error: "Invalid branch ID" });
    
    const { rows } = await pool.query(
      `SELECT r.room_id, r.room_number, r.status, rt.name as room_type_name, rt.capacity, rt.daily_rate
       FROM room r
       JOIN room_type rt ON rt.room_type_id = r.room_type_id
       WHERE r.branch_id = $1
       ORDER BY r.room_number`,
      [branchId]
    );
    res.json(rows);
  } catch (e) {
    console.error("listBranchRooms error:", e);
    res.status(500).json({ error: e.message || "Internal server error" });
  }
}

async function updateUserPassword(req, res) {
  try {
    const id = Number(req.params.id);
    const { password } = req.body || {};
    if (!id || !password) return res.status(400).json({ error: 'id and password required' });
    const hash = await bcrypt.hash(String(password), 10);
    const r = await pool.query(
      `UPDATE user_account SET password_hash=$1 WHERE user_id=$2 RETURNING user_id, username, role, guest_id`,
      [hash, id],
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ user: r.rows[0] });
  } catch (e) {
    console.error('updateUserPassword error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
/**
 * Create an employee account (Admin, Manager, Receptionist, Accountant)
 * This is different from customer registration - it creates employee records
 */
async function createEmployee(req, res) {
  console.log('📝 Creating employee account:', req.body);
  
  const client = await pool.connect();
  try {
    const { username, password, role, full_name, email, phone, address, branch_id = 1 } = req.body;
    
    // Validation
    if (!username || !password || !role || !full_name) {
      return res.status(400).json({ 
        error: 'username, password, role, and full_name are required' 
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check role creation permission
    const currentUserRole = req.user?.role;
    if (!canCreateRole(currentUserRole, role)) {
      return res.status(403).json({ 
        error: `You don't have permission to create ${role} accounts`,
        currentRole: currentUserRole,
        attemptedRole: role
      });
    }
    
    // Validate role is not Customer (use register endpoint for customers)
    if (role === 'Customer') {
      return res.status(400).json({ 
        error: 'Use the public registration endpoint for customer accounts' 
      });
    }
    
    const validRoles = ['Admin', 'Manager', 'Receptionist', 'Accountant'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }
    
    await client.query('BEGIN');
    console.log('✅ Transaction started');
    
    // Check username uniqueness
    const usernameCheck = await client.query(
      'SELECT user_id FROM user_account WHERE username = $1',
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.log('✅ Username is unique');
    
    // Check email uniqueness if provided
    if (email) {
      const emailCheck = await client.query(
        'SELECT employee_id FROM employee WHERE email = $1',
        [email]
      );
      if (emailCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Email already exists' });
      }
      console.log('✅ Email is unique');
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');
    
    // Step 1: Create user_account with employee role
    const userResult = await client.query(
      `INSERT INTO user_account (username, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING user_id, username, role`,
      [username, password_hash, role]
    );
    const user = userResult.rows[0];
    console.log('✅ User account created:', user.user_id);
    
    // Step 2: Create employee record
    // employee table has: user_id, branch_id, name, email, contact_no
    const employeeResult = await client.query(
      `INSERT INTO employee (user_id, branch_id, name, email, contact_no)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING employee_id`,
      [user.user_id, branch_id, full_name, email || null, phone || null]
    );
    console.log('✅ Employee record created:', employeeResult.rows[0].employee_id);
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');
    
    res.status(201).json({ 
      success: true,
      message: `${role} account created successfully`,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        employee_id: employeeResult.rows[0].employee_id,
        full_name
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating employee:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create employee account' });
  } finally {
    client.release();
  }
}

/**
 * Get list of roles that current user can create
 */
async function getAllowedRoles(req, res) {
  const currentUserRole = req.user?.role;
  
  const permissions = {
    'Admin': ['Admin', 'Manager', 'Receptionist', 'Accountant'],
    'Manager': ['Receptionist', 'Accountant'],
    'Receptionist': [], // Receptionist cannot create employees
    'Accountant': [],
    'Customer': []
  };
  
  res.json({ 
    currentRole: currentUserRole,
    allowedRoles: permissions[currentUserRole] || []
  });
}

module.exports = {
  listUsers,
  createUser,
  createEmployee,
  getAllowedRoles,
  canCreateRole,
  updateUserRole,
  updateUserPassword,
  deleteUser,
  createService,
  updateService,
  deleteService,
  adminListServices,
  listBranches,
  listBranchRooms,
};
