// src/controllers/payment.controller.js
const { pool } = require("../db");

// ---------- helpers ----------
function normalizePaymentMethod(input) {
  if (!input) return null;
  const norm = String(input).trim().toLowerCase();
  const MAP = new Map([
    ["cash", "Cash"],
    ["card", "Card"],
    ["online", "Online"],
  ]);
  return MAP.get(norm) || null;
}

function pickPayment(body = {}) {
  const {
    booking_id,
    amount,
    method,
    paid_at = null,
    payment_reference = null,
  } = body;

  if (!booking_id || !amount || !method) {
    return { error: "booking_id, amount, and method are required" };
  }
  return {
    booking_id: Number(booking_id),
    amount: Number(amount),
    method,
    paid_at,
    payment_reference,
  };
}

function pickAdjustment(body = {}) {
  const { booking_id, amount, reason } = body;
  if (!booking_id || amount === undefined || amount === null) {
    return { error: "booking_id and amount are required" };
  }
  return {
    booking_id: Number(booking_id),
    rawAmount: Number(amount), // may be + or -
    reason: reason != null ? String(reason) : null,
  };
}

function normalizeEnumLabels(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];
  if (typeof raw === "string") {
    const inner = raw.replace(/^{|}$/g, "");
    if (!inner) return [];
    return inner
      .split(",")
      .map((s) => s.trim())
      .map((s) => s.replace(/^"(.*)"$/, "$1"));
  }
  return [];
}

function _pickTypeLabel(amount, labelsRaw) {
  const labels = normalizeEnumLabels(labelsRaw);
  const negativePrefs = ["Credit", "Discount", "Decrease", "Negative"];
  const positivePrefs = ["Debit", "Surcharge", "Increase", "Positive"];

  if (labels.length === 0) {
    return amount < 0 ? "Credit" : "Debit";
  }
  const pool = amount < 0 ? negativePrefs : positivePrefs;
  const map = new Map(labels.map((l) => [String(l).toLowerCase(), l]));
  for (const p of pool) {
    const hit = map.get(p.toLowerCase());
    if (hit) return hit;
  }
  return labels[0];
}

function prettyTimestamp(ts, tz = "Asia/Colombo", locale = "en-GB") {
  if (!ts) return null;
  return new Date(ts).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
    timeZone: tz,
  });
}

async function getTotals(bookingId) {
  const pay = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total_paid
       FROM payment
      WHERE booking_id = $1`,
    [bookingId],
  );

  // amount is stored positive; sign is implied by type
  const adj = await pool.query(
    `SELECT COALESCE(
       SUM(
         CASE WHEN type IN ('refund','chargeback') THEN -amount
              ELSE amount
         END
       ), 0
     )::numeric AS total_adjust
     FROM payment_adjustment
     WHERE booking_id = $1`,
    [bookingId],
  );

  const total_paid = pay.rows[0]?.total_paid ?? 0;
  const total_adjust = adj.rows[0]?.total_adjust ?? 0;
  const net_total = Number(total_paid) + Number(total_adjust);

  return { booking_id: bookingId, total_paid, total_adjust, net_total };
}

// ---------- controllers ----------

// POST /payments (idempotent by booking_id + payment_reference)
async function createPayment(req, res) {
  const p = pickPayment(req.body);
  if (p.error) return res.status(400).json({ error: p.error });

  const dbMethod = normalizePaymentMethod(p.method);
  if (!dbMethod) {
    return res.status(400).json({
      error: "Invalid payment method",
      received: p.method,
      allowed_examples: ["Cash", "Card", "Online"],
    });
  }

  // Idempotency pre-check
  const ref = (p.payment_reference || "").trim() || null;
  if (ref) {
    const existing = await pool.query(
      `SELECT payment_id, booking_id, amount, method, paid_at, payment_reference
         FROM payment
        WHERE booking_id = $1 AND payment_reference = $2
        LIMIT 1`,
      [p.booking_id, ref],
    );
    if (existing.rowCount) {
      const totals = await getTotals(p.booking_id);
      return res.status(200).json({
        payment: existing.rows[0],
        totals,
        idempotent: true,
      });
    }
  }

  try {
    const sql = `
      INSERT INTO payment (booking_id, amount, method, paid_at, payment_reference)
      VALUES ($1, $2, $3, COALESCE($4::timestamp, NOW()), $5)
      RETURNING payment_id, booking_id, amount, method, paid_at, payment_reference
    `;
    const vals = [p.booking_id, p.amount, dbMethod, p.paid_at, ref];
    const { rows } = await pool.query(sql, vals);

    const totals = await getTotals(p.booking_id);
    return res.status(201).json({ payment: rows[0], totals });
  } catch (err) {
    console.error("createPayment error:", err);
    if (err.code === "23503")
      return res.status(400).json({ error: "Unknown booking_id (FK fails)" });
    if (err.code === "23502")
      return res
        .status(400)
        .json({ error: "Missing field", detail: err.detail });
    if (err.code === "23505" && err.constraint === "uq_booking_payment_ref") {
      const existing = await pool.query(
        `SELECT payment_id, booking_id, amount, method, paid_at, payment_reference
           FROM payment
          WHERE booking_id = $1 AND payment_reference = $2
          LIMIT 1`,
        [p.booking_id, ref],
      );
      if (existing.rowCount) {
        const totals = await getTotals(p.booking_id);
        return res.status(200).json({
          payment: existing.rows[0],
          totals,
          idempotent: true,
        });
      }
      return res.status(409).json({
        error: "Duplicate payment_reference for this booking",
        hint: "Use a new payment_reference or omit it if you don't need idempotency.",
      });
    }
    if (err.code === "22P02")
      return res
        .status(400)
        .json({ error: "Invalid input syntax", detail: err.detail });
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /payments/:bookingId
async function listPaymentsForBooking(req, res) {
  const bookingId = Number(req.params.bookingId);
  if (!bookingId) return res.status(400).json({ error: "Invalid bookingId" });

  try {
    const { rows: payments } = await pool.query(
      `SELECT payment_id,
              booking_id,
              amount,
              method,
              paid_at,
              payment_reference
         FROM payment
        WHERE booking_id = $1
        ORDER BY paid_at DESC, payment_id DESC`,
      [bookingId],
    );

    // Adjustments with API aliases: amount (signed) & created_at
    const { rows: adjustments } = await pool.query(
      `SELECT
          adjustment_id,
          booking_id,
          CASE WHEN type IN ('refund','chargeback') THEN -amount ELSE amount END AS amount,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='reason'
            ) THEN reason
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='remarks'
            ) THEN remarks
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='note'
            ) THEN note
            ELSE NULL
          END AS reason,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='created_at'
            ) THEN created_at
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='adjusted_at'
            ) THEN adjusted_at
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='createdon'
            ) THEN createdon
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='created'
            ) THEN created
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='timestamp'
            ) THEN "timestamp"
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='payment_adjustment' AND column_name='ts'
            ) THEN ts
            ELSE NULL
          END AS created_at,
          type
       FROM payment_adjustment
       WHERE booking_id = $1
       ORDER BY COALESCE(created_at, NOW()) DESC, adjustment_id DESC`,
      [bookingId],
    );

    // Add pretty fields
    const adjustmentsPretty = adjustments.map((a) => ({
      ...a,
      created_at_pretty: prettyTimestamp(a.created_at),
      created_at_unix: a.created_at
        ? Math.floor(new Date(a.created_at).getTime() / 1000)
        : null,
    }));

    const totals = await getTotals(bookingId);

    return res.json({
      booking_id: bookingId,
      totals,
      payments,
      adjustments: adjustmentsPretty,
    });
  } catch (err) {
    console.error("listPaymentsForBooking error:", err);
    if (err.code === "42703") {
      return res.status(500).json({
        error:
          "Adjustment 'reason' column not found. Tried: reason, remarks, note.",
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /payments/adjustment — schema-aware insert (no DB changes)
async function createPaymentAdjustment(req, res) {
  const parsed = pickAdjustment(req.body); // { booking_id, rawAmount, reason }
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const { booking_id, rawAmount, reason } = parsed;

  if (!Number.isFinite(rawAmount) || rawAmount === 0) {
    return res.status(400).json({ error: "amount must be a non-zero number" });
  }

  // DB column must be positive; sign is encoded by 'type'
  const amount = Math.abs(rawAmount);

  // If client didn't provide type, infer from sign
  let finalType = req.body.type;
  if (!finalType) finalType = rawAmount < 0 ? "refund" : "manual_adjustment";

  try {
    // Inspect table columns to decide where to write reason/timestamp/actor
    const { rows: cols } = await pool.query(
      `SELECT column_name, is_nullable, data_type, udt_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'payment_adjustment'`,
    );
    const has = (name) => cols.some((c) => c.column_name === name);
    const required = (name) =>
      cols.some((c) => c.column_name === name && c.is_nullable === "NO");

    const reasonCol = has("reason")
      ? "reason"
      : has("remarks")
        ? "remarks"
        : has("note")
          ? "note"
          : null;

    const timeCol =
      [
        "created_at",
        "adjusted_at",
        "createdon",
        "created",
        "timestamp",
        "ts",
      ].find(has) || null;

    // Build insert
    const colsToInsert = ["booking_id", "amount"];
    const vals = [booking_id, amount];
    const ph = ["$1", "$2"];

    if (has("type")) {
      colsToInsert.push("type");
      vals.push(finalType);
      ph.push(`$${vals.length}`);
    }

    if (reasonCol) {
      colsToInsert.push(reasonCol);
      if (reason != null) {
        vals.push(String(reason));
      } else if (required(reasonCol)) {
        vals.push("Adjustment");
      } else {
        vals.push(null);
      }
      ph.push(`$${vals.length}`);
    }

    if (timeCol) {
      colsToInsert.push(timeCol === "timestamp" ? '"timestamp"' : timeCol);
      ph.push("NOW()");
    }

    const sql = `
      INSERT INTO payment_adjustment (${colsToInsert.join(", ")})
      VALUES (${ph.join(", ")})
      RETURNING
        adjustment_id,
        booking_id,
        CASE WHEN type IN ('refund','chargeback') THEN -amount ELSE amount END AS amount,
        ${reasonCol ? reasonCol : "NULL::text AS reason"},
        ${
          timeCol
            ? timeCol === "timestamp"
              ? '"timestamp" AS created_at'
              : `${timeCol} AS created_at`
            : "NOW() AS created_at"
        },
        ${has("type") ? "type" : "NULL::text AS type"}
    `;
    const r = await pool.query(sql, vals);

    const totals = await getTotals(booking_id);

    // Add pretty fields to the single returned adjustment
    const adj = r.rows[0];
    const payload = {
      ...adj,
      created_at_pretty: prettyTimestamp(adj.created_at),
      created_at_unix: adj.created_at
        ? Math.floor(new Date(adj.created_at).getTime() / 1000)
        : null,
    };

    return res.status(201).json({ adjustment: payload, totals });
  } catch (err) {
    console.error("createPaymentAdjustment error:", err);
    if (err.code === "23503")
      return res.status(400).json({ error: "Unknown booking_id (FK fails)" });
    if (err.code === "23514")
      return res
        .status(400)
        .json({ error: "Check constraint failed", detail: err.detail });
    if (err.code === "23502") {
      return res
        .status(400)
        .json({ error: "Missing field", detail: err.detail });
    }
    if (err.code === "22P02")
      return res
        .status(400)
        .json({ error: "Invalid input syntax", detail: err.detail });
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createPayment,
  createPaymentAdjustment,
  listPaymentsForBooking,
};
