/**
 * Audit logging middleware
 * Logs system actions for security and compliance
 */

const { pool } = require('../db');

/**
 * Log an audit entry
 * @param {Object} req - Express request object
 * @param {Object} options - Audit options
 * @param {string} options.action - Action performed (create, update, delete, etc.)
 * @param {string} options.entity - Entity type (booking, guest, payment, etc.)
 * @param {number|string} options.entityId - ID of the entity
 * @param {Object} options.details - Additional details as JSON
 */
async function logAudit(req, options) {
  try {
    const { action, entity, entityId, details } = options;

    // Get actor from authenticated user
    const actor = req.user ? `${req.user.username} (${req.user.role})` : 'System';

    // Insert audit log entry
    await pool.query(
      `INSERT INTO audit_log (actor, action, entity, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [actor, action, entity, entityId, JSON.stringify(details)]
    );

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUDIT] ${actor} - ${action} ${entity} #${entityId}`);
    }
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break the request
    console.error('Audit logging error:', error.message);
  }
}

module.exports = {
  logAudit
};
