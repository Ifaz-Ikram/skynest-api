// src/controllers/service.controller.js
const { pool } = require("../db");

// Normalize request body â†’ your DB names are used_on / qty / unit_price_at_use
function pickUsage(body = {}) {
  const {
    booking_id,
    service_id,
    quantity, // API name; maps to qty
    unit_price, // API name; maps to unit_price_at_use (optional)
    used_on = null, // date (YYYY-MM-DD). If null, we'll use CURRENT_DATE
  } = body;

  if (!booking_id || !service_id || !quantity) {
    return { error: "booking_id, service_id, quantity are required" };
  }
  if (Number(quantity) <= 0) return { error: "quantity must be > 0" };

  return {
    booking_id: Number(booking_id),
    service_id: Number(service_id),
    qty: Number(quantity),
    unit_price_at_use: unit_price != null ? Number(unit_price) : null,
    used_on,
  };
}

function prettyDateTime(ts, tz = "Asia/Colombo", locale = "en-GB") {
  if (!ts) return null;
  return new Date(ts).toLocaleString(locale, {
    dateStyle: "medium", // e.g., 11 Nov 2025
    timeStyle: "short", // e.g., 7:00 pm
    hour12: true,
    timeZone: tz,
  });
}

// GET /services  â†’ list catalog
async function listServices(req, res) {
  try {
    const { active } = req.query || {};
    const where = String(active).toLowerCase() === "true" ? "WHERE active = TRUE" : "";
    const sql = `SELECT service_id, code, name, category, unit_price, tax_rate_percent, active
                 FROM service_catalog ${where}
                 ORDER BY service_id`;
    const { rows } = await pool.query(sql);
    res.json({ services: rows });
  } catch (err) {
    console.error("listServices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}