// src/controllers/branch.controller.js
const { pool } = require("../db");

// GET /branches — list branches (read-only)
async function listBranches(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT branch_id, branch_name, address, contact_number, manager_name, branch_code
         FROM branch
         ORDER BY branch_id`,
    );
    res.json(rows);
  } catch (err) {
    console.error("listBranches error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

module.exports = { listBranches };

