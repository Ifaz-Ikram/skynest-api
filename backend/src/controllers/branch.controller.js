// backend/src/controllers/branch.controller.js
const { pool } = require('../db');

// Get all branches
async function getBranches(req, res) {
  try {
    // Query real branches from database
    const result = await pool.query(`
      SELECT 
        branch_id,
        branch_name,
        address,
        branch_code,
        manager_name,
        contact_number
      FROM branch
      ORDER BY branch_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
}

module.exports = {
  getBranches
};