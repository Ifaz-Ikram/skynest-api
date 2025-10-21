const { pool } = require("../db");

/**
 * Write an audit log entry without changing the DB schema.
 * Uses existing table public.audit_log(actor, action, entity, entity_id, details, created_at).
 * This is best-effort and should never crash the main request.
 */
async function logAudit(req, { action, entity, entityId = null, details = null }) {
  try {
    const actor = req?.user
      ? `${req.user.username || req.user.user_id || "unknown"} (${req.user.role || ""})`
      : "anonymous";
    const det = details ? JSON.stringify(details) : null;
    await pool.query(
      `INSERT INTO audit_log (actor, action, entity, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
      [actor, String(action), String(entity), entityId != null ? Number(entityId) : null, det],
    );
  } catch (err) {
    // Never throw; only log server-side for diagnostics
    console.error("audit log error:", err?.message || err);
  }
}

module.exports = { logAudit };

