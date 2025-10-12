// src/controllers/service.controller.js
const { pool } = require("../db");

// Normalize request body → your DB names are used_on / qty / unit_price_at_use
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

// GET /services  → list catalog
async function listServices(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT service_id, name, unit_price
         FROM service_catalog
        ORDER BY service_id`,
    );
    res.json({ services: rows });
  } catch (err) {
    console.error("listServices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /services/usage  → add usage line
async function addServiceUsage(req, res) {
  const u = pickUsage(req.body);
  if (u.error) return res.status(400).json({ error: u.error });

  try {
    // resolve price: client-provided or default from service.unit_price
    let price = u.unit_price_at_use;
    if (price == null) {
      const p = await pool.query(
        `SELECT unit_price FROM service_catalog WHERE service_id = $1`,
        [u.service_id],
      );
      if (p.rowCount === 0)
        return res.status(400).json({ error: "Unknown service_id" });
      price = Number(p.rows[0].unit_price);
    }

    const sql = `
      INSERT INTO service_usage
        (booking_id, service_id, used_on, qty, unit_price_at_use)
      VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5)
      RETURNING service_usage_id, booking_id, service_id, used_on, qty, unit_price_at_use
    `;
    const vals = [u.booking_id, u.service_id, u.used_on, u.qty, price];

    const { rows } = await pool.query(sql, vals);

    // compute services total for this booking
    const t = await pool.query(
      `SELECT COALESCE(SUM(qty * unit_price_at_use), 0)::numeric AS services_total
         FROM service_usage
        WHERE booking_id = $1`,
      [u.booking_id],
    );

    // Shape response with friendly names
    const usage = {
      usage_id: rows[0].service_usage_id,
      booking_id: rows[0].booking_id,
      service_id: rows[0].service_id,
      used_on: rows[0].used_on,
      quantity: rows[0].qty,
      unit_price: rows[0].unit_price_at_use,
    };

    const payload = {
      ...usage,
      used_on_pretty: prettyDateTime(usage.used_on),
      used_on_unix: usage.used_on
        ? Math.floor(new Date(usage.used_on).getTime() / 1000)
        : null,
    };

    res.status(201).json({
      usage: payload,
      totals: {
        booking_id: u.booking_id,
        services_total: t.rows[0].services_total,
      },
    });
  } catch (err) {
    console.error("addServiceUsage error:", err);
    if (err.code === "23503")
      return res
        .status(400)
        .json({ error: "Foreign key violation (booking_id/service_id)" });
    if (err.code === "23502")
      return res.status(400).json({ error: "Missing required field" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /services/usage/:bookingId → list usages for a booking
async function listServiceUsage(req, res) {
  const bookingId = Number(req.params.bookingId);
  if (!bookingId) return res.status(400).json({ error: "Invalid bookingId" });

  try {
    const { rows } = await pool.query(
      `SELECT u.service_usage_id,
              u.booking_id,
              u.service_id,
              s.name AS service_name,
              u.used_on,
              u.qty,
              u.unit_price_at_use,
              (u.qty * u.unit_price_at_use)::numeric AS line_total
         FROM service_usage u
         JOIN service_catalog s ON s.service_id = u.service_id
        WHERE u.booking_id = $1
        ORDER BY u.used_on DESC, u.service_usage_id DESC`,
      [bookingId],
    );

    const t = await pool.query(
      `SELECT COALESCE(SUM(qty * unit_price_at_use), 0)::numeric AS services_total
         FROM service_usage
        WHERE booking_id = $1`,
      [bookingId],
    );

    // map DB names → API names
    const usages = rows.map((r) => ({
      usage_id: r.service_usage_id,
      booking_id: r.booking_id,
      service_id: r.service_id,
      service_name: r.service_name,
      used_on: r.used_on,
      quantity: r.qty,
      unit_price: r.unit_price_at_use,
      line_total: r.line_total,
    }));

    const usagesPretty = usages.map((u) => ({
      ...u,
      used_on_pretty: prettyDateTime(u.used_on),
      used_on_unix: u.used_on
        ? Math.floor(new Date(u.used_on).getTime() / 1000)
        : null,
    }));

    res.json({
      booking_id: bookingId,
      services_total: t.rows[0].services_total,
      usages: usagesPretty,
    });
  } catch (err) {
    console.error("listServiceUsage error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /services/usage/:usageId
async function deleteServiceUsage(req, res) {
  const usageId = Number(req.params.usageId);
  if (!usageId) return res.status(400).json({ error: "Invalid usageId" });

  try {
    const del = await pool.query(
      `DELETE FROM service_usage
        WHERE service_usage_id = $1
        RETURNING service_usage_id, booking_id`,
      [usageId],
    );
    if (del.rowCount === 0) return res.status(404).json({ error: "Not found" });

    const bookingId = del.rows[0].booking_id;
    const t = await pool.query(
      `SELECT COALESCE(SUM(qty * unit_price_at_use), 0)::numeric AS services_total
         FROM service_usage
        WHERE booking_id = $1`,
      [bookingId],
    );

    return res.json({
      ok: true,
      deleted_usage_id: del.rows[0].service_usage_id,
      totals: {
        booking_id: bookingId,
        services_total: t.rows[0].services_total,
      },
    });
  } catch (err) {
    console.error("deleteServiceUsage error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  listServices,
  addServiceUsage,
  listServiceUsage,
  deleteServiceUsage,
};
