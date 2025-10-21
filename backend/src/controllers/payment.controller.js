// src/controllers/payment.controller.js
const { pool } = require("../db");
// bookingMetaStore removed - feature not in schema
// const bookingMetaStore = require("../data/bookingMetaStore");
// buildDepositSummary removed - deposit feature not in schema
// const { buildDepositSummary } = require("../utils/deposit");

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
    payment_reference = null,
  } = body;

  if (!booking_id || !amount || !method) {
    return { error: "booking_id, amount, and method are required" };
  }
  return {
    booking_id: Number(booking_id),
    amount: Number(amount),
    method,
    paid_at: new Date().toISOString(), // Always use current timestamp
    payment_reference,
  };
}

function prettyDateTime(ts, tz = "Asia/Colombo", locale = "en-GB") {
  if (!ts) return null;
  return new Date(ts).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
    timeZone: tz,
  });
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

// GET /payments - List all payments
async function listPayments(req, res) {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;
    const { branch_id } = req.query; // NEW: Get branch filter
    
    console.log(`Payments pagination: page=${page}, limit=${limit}, offset=${offset}`);
    console.log(`Branch filter: ${branch_id || 'none'}`);
    
    // Build branch filter condition
    let branchFilter = '';
    let branchParams = [];
    if (branch_id) {
      branchFilter = 'WHERE r.branch_id = $1';
      branchParams = [Number(branch_id)];
    }
    
    // Use INNER JOIN for room when branch filtering is used
    const roomJoin = branch_id ? 'INNER JOIN' : 'LEFT JOIN';
    
    // Get total count - include both payments and adjustments
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT p.payment_id
        FROM payment p
        JOIN booking b ON p.booking_id = b.booking_id
        LEFT JOIN guest g ON b.guest_id = g.guest_id
        ${roomJoin} room r ON b.room_id = r.room_id
        ${branchFilter}
        
        UNION ALL
        
        SELECT pa.adjustment_id as payment_id
        FROM payment_adjustment pa
        JOIN booking b ON pa.booking_id = b.booking_id
        LEFT JOIN guest g ON b.guest_id = g.guest_id
        ${roomJoin} room r ON b.room_id = r.room_id
        ${branchFilter}
      ) combined_transactions
    `;
    
    const countResult = await pool.query(countQuery, branchParams);
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get paginated data - include both payments and adjustments
    const { rows: payments } = await pool.query(
      `(SELECT p.payment_id,
              p.booking_id,
              p.amount,
              p.method::text,
              p.paid_at,
              p.payment_reference,
              'payment' as transaction_type,
              NULL as adjustment_type,
              NULL as reason,
              COALESCE(g.full_name, 'Unknown Guest') as guest_name,
              COALESCE(r.room_number, 'Unknown Room') as room_number,
              b.check_in_date,
              b.check_out_date,
              b.status as booking_status
         FROM payment p
         JOIN booking b ON p.booking_id = b.booking_id
         LEFT JOIN guest g ON b.guest_id = g.guest_id
         ${roomJoin} room r ON b.room_id = r.room_id
        ${branchFilter})
        
        UNION ALL
        
        (SELECT pa.adjustment_id as payment_id,
               pa.booking_id,
               CASE WHEN pa.type IN ('refund','chargeback') THEN -pa.amount ELSE pa.amount END as amount,
               pa.type::text as method,
               pa.created_at as paid_at,
               pa.reference_note as payment_reference,
               'adjustment' as transaction_type,
               pa.type::text as adjustment_type,
               pa.reference_note as reason,
               COALESCE(g.full_name, 'Unknown Guest') as guest_name,
               COALESCE(r.room_number, 'Unknown Room') as room_number,
               b.check_in_date,
               b.check_out_date,
               b.status as booking_status
         FROM payment_adjustment pa
         JOIN booking b ON pa.booking_id = b.booking_id
         LEFT JOIN guest g ON b.guest_id = g.guest_id
         ${roomJoin} room r ON b.room_id = r.room_id
        ${branchFilter})
        
        ORDER BY paid_at DESC
        LIMIT $${branchParams.length + 1} OFFSET $${branchParams.length + 2}`,
      [...branchParams, limit, offset]
    );

    console.log(`Returning ${payments.length} payments (page ${page} of ${Math.ceil(total / limit)})`);
    
    // Return paginated response with metadata
    res.json({
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("listPayments error:", err);
    res.status(500).json({ error: "Internal server error" });
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
          reference_note AS reason,
          created_at,
          type
       FROM payment_adjustment
       WHERE booking_id = $1
       ORDER BY created_at DESC, adjustment_id DESC`,
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

async function getDepositReceipt(req, res) {
  const bookingId = Number(req.params.id);
  if (!bookingId) return res.status(400).json({ error: "Invalid id" });

  try {
    const bookingResult = await pool.query(
      `SELECT 
         b.booking_id,
         b.guest_id,
         COALESCE(g.full_name, 'Unknown Guest') AS guest_name,
         b.room_id,
         COALESCE(r.room_number, 'Unknown Room') AS room_number,
         b.status,
         b.check_in_date,
         b.check_out_date,
         b.advance_payment
       FROM booking b
       LEFT JOIN guest g ON g.guest_id = b.guest_id
       LEFT JOIN room r ON r.room_id = b.room_id
       WHERE b.booking_id = $1`,
      [bookingId],
    );
    if (!bookingResult.rowCount) {
      return res.status(404).json({ error: "Not found" });
    }
    const booking = bookingResult.rows[0];

    const payments = await pool.query(
      `SELECT payment_id, amount, method, paid_at, payment_reference
         FROM payment
        WHERE booking_id = $1
        ORDER BY paid_at ASC, payment_id ASC`,
      [bookingId],
    );
    const payment = payments.rows.find(
      (row) => Number(row.amount || 0) > 0,
    );

    // Meta and deposit features removed - not in schema
    // const meta = await bookingMetaStore.getMeta(bookingId);
    // const deposit = buildDepositSummary(booking, meta || {});
    const deposit = null; // Deposit feature removed

    return res.json({
      receipt: {
        booking: {
          booking_id: booking.booking_id,
          guest_id: booking.guest_id,
          guest_name: booking.guest_name || null,
          room_id: booking.room_id,
          room_number: booking.room_number || null,
          status: booking.status,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
        },
        deposit,
        payment: payment
          ? {
              payment_id: payment.payment_id,
              amount: Number(payment.amount),
              method: payment.method,
              paid_at: payment.paid_at,
              paid_at_pretty: prettyDateTime(payment.paid_at),
              payment_reference: payment.payment_reference,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("getDepositReceipt error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createPayment,
  createPaymentAdjustment,
  listPayments,
  listPaymentsForBooking,
  getDepositReceipt,
};
