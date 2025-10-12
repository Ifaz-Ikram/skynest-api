// src/controllers/booking.controller.js
const { pool } = require("../db");

// -------- helpers --------
function pickBookingBody(body = {}) {
  const {
    guest_id,
    room_id,
    check_in_date,
    check_out_date,
    status = "Booked",
    booked_rate,
    tax_rate_percent = 0,
    advance_payment = 0,
  } = body;

  if (
    !guest_id ||
    !room_id ||
    !check_in_date ||
    !check_out_date ||
    !booked_rate
  ) {
    return {
      error:
        "guest_id, room_id, check_in_date, check_out_date, booked_rate are required",
    };
  }

  return {
    guest_id: Number(guest_id),
    room_id: Number(room_id),
    check_in_date,
    check_out_date,
    status,
    booked_rate: Number(booked_rate),
    tax_rate_percent: Number(tax_rate_percent),
    advance_payment: Number(advance_payment),
  };
}

// Pretty DATE+TIME in Asia/Colombo
function prettyDateTime(ts, tz = "Asia/Colombo", locale = "en-GB") {
  if (!ts) return null;
  return new Date(ts).toLocaleString(locale, {
    dateStyle: "medium", // e.g., 10 Nov 2025
    timeStyle: "short", // e.g., 7:00 pm
    hour12: true,
    timeZone: tz,
  });
}

function prettyRangeDateTime(
  inTs,
  outTs,
  tz = "Asia/Colombo",
  locale = "en-GB",
) {
  const inStr = prettyDateTime(inTs, tz, locale);
  const outStr = prettyDateTime(outTs, tz, locale);
  return inStr && outStr ? `${inStr} → ${outStr}` : null;
}

function normalizePaymentMethod(input) {
  if (!input) return null;
  const m = String(input).trim().toLowerCase();
  if (m === "cash") return "Cash";
  if (m === "card") return "Card";
  if (m === "online") return "Online";
  return null;
}

// -------- CREATE --------
// POST /bookings
async function createBooking(req, res) {
  const picked = pickBookingBody(req.body);
  if (picked.error) return res.status(400).json({ error: picked.error });

  try {
    const sql = `
      INSERT INTO booking
        (guest_id, room_id, check_in_date, check_out_date, status,
         booked_rate, tax_rate_percent, advance_payment)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING booking_id, guest_id, room_id, check_in_date, check_out_date, status;
    `;
    const vals = [
      picked.guest_id,
      picked.room_id,
      picked.check_in_date,
      picked.check_out_date,
      picked.status,
      picked.booked_rate,
      picked.tax_rate_percent,
      picked.advance_payment,
    ];

    const { rows } = await pool.query(sql, vals);
    const raw = rows[0];
    const booking = {
      ...raw,
      check_in_pretty: prettyDateTime(raw.check_in_date),
      check_out_pretty: prettyDateTime(raw.check_out_date),
      date_range_pretty: prettyRangeDateTime(
        raw.check_in_date,
        raw.check_out_date,
      ),
    };
    return res.status(201).json({ booking });
  } catch (err) {
    console.error("createBooking error:", err);
    if (err.code === "23P01")
      return res
        .status(400)
        .json({
          error: "Room already booked for that date range",
          detail: err.detail,
        });
    if (err.code === "23503")
      return res
        .status(400)
        .json({ error: "Foreign key violation", detail: err.detail });
    if (err.code === "23514")
      return res
        .status(400)
        .json({
          error: "Advance payment below minimum 10%",
          detail: err.detail,
        });
    if (err.code === "23505")
      return res.status(409).json({ error: "Duplicate", detail: err.detail });
    if (err.code === "23502")
      return res
        .status(400)
        .json({
          error: "Missing required field",
          column: err.column,
          detail: err.detail,
        });
    if (err.code === "22P02")
      return res
        .status(400)
        .json({ error: "Invalid input syntax", detail: err.detail });
    if (err.code === "42703")
      return res
        .status(400)
        .json({ error: "Unknown column in INSERT", detail: err.detail });
    if (err.code === "42P01")
      return res
        .status(400)
        .json({ error: "Table not found", detail: err.detail });
    return res.status(500).json({ error: "Internal server error" });
  }
}

// -------- READ ONE --------
// GET /bookings/:id
async function getBookingById(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  try {
    const { rows } = await pool.query(
      `SELECT booking_id, guest_id, room_id, check_in_date, check_out_date, status
         FROM booking
        WHERE booking_id = $1`,
      [id],
    );

    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const raw = rows[0];
    const booking = {
      ...raw,
      check_in_pretty: prettyDateTime(raw.check_in_date),
      check_out_pretty: prettyDateTime(raw.check_out_date),
      date_range_pretty: prettyRangeDateTime(
        raw.check_in_date,
        raw.check_out_date,
      ),
    };
    return res.json({ booking });
  } catch (err) {
    console.error("getBookingById error:", err);
    if (err.code === "22P02")
      return res
        .status(400)
        .json({ error: "Invalid parameter format", detail: err.detail });
    return res.status(500).json({ error: "Internal server error" });
  }
}

// -------- UPDATE STATUS --------
// PATCH /bookings/:id/status
async function updateStatus(req, res) {
  const id = Number(req.params.id);
  const raw = (req.body?.status || "").toString();

  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (!raw) return res.status(400).json({ error: "status required" });

  // Normalize inputs like "checked in", "Checked_In", "checked-in" → "checkedin"
  const norm = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  // Map normalized → exact enum string your DB expects
  const STATUS_MAP = new Map([
    ["booked", "Booked"],
    ["checkedin", "Checked-In"], // change to "CheckedIn" if that's your enum
    ["checkedout", "Checked-Out"], // change to "CheckedOut" if that's your enum
    ["cancelled", "Cancelled"],
  ]);

  const dbStatus = STATUS_MAP.get(norm);
  if (!dbStatus) {
    return res.status(400).json({
      error: "Invalid status value",
      received: raw,
      allowed_examples: Array.from(STATUS_MAP.values()),
    });
  }

  try {
    const r = await pool.query(
      `UPDATE booking SET status = $1 WHERE booking_id = $2
       RETURNING booking_id, status`,
      [dbStatus, id],
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true, booking: r.rows[0] });
  } catch (err) {
    console.error("updateStatus error:", err);
    if (err.code === "23514")
      return res
        .status(400)
        .json({ error: "Check constraint failed", detail: err.detail });
    if (err.code === "22P02")
      return res.status(400).json({ error: "Invalid enum value for status" });
    return res.status(500).json({ error: "Internal server error" });
  }
}

// -------- LIST (with filters & pagination) --------
// GET /bookings?from&to&room_id&guest_id&status&page&limit
async function listBookings(req, res) {
  const {
    from,
    to,
    room_id,
    guest_id,
    status,
    page = 1,
    limit = 20,
  } = req.query;

  const p = Math.max(Number(page) || 1, 1);
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (p - 1) * lim;

  const where = [];
  const vals = [];

  if (from) {
    vals.push(from);
    where.push(`check_in_date >= $${vals.length}`);
  }
  if (to) {
    vals.push(to);
    where.push(`check_out_date <= $${vals.length}`);
  }
  if (room_id) {
    vals.push(Number(room_id));
    where.push(`room_id = $${vals.length}`);
  }
  if (guest_id) {
    vals.push(Number(guest_id));
    where.push(`guest_id = $${vals.length}`);
  }
  if (status) {
    vals.push(status);
    where.push(`status = $${vals.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const dataSql = `
    SELECT booking_id, guest_id, room_id, check_in_date, check_out_date, status
    FROM booking
    ${whereSql}
    ORDER BY check_in_date DESC, booking_id DESC
    LIMIT ${lim} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*)::int AS total FROM booking ${whereSql}`;

  try {
    const [data, cnt] = await Promise.all([
      pool.query(dataSql, vals),
      pool.query(countSql, vals),
    ]);

    const items = data.rows.map((raw) => ({
      ...raw,
      check_in_pretty: prettyDateTime(raw.check_in_date),
      check_out_pretty: prettyDateTime(raw.check_out_date),
      date_range_pretty: prettyRangeDateTime(
        raw.check_in_date,
        raw.check_out_date,
      ),
    }));

    return res.json({
      page: p,
      limit: lim,
      total: cnt.rows[0].total,
      bookings: items,
    });
  } catch (err) {
    console.error("listBookings error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// -------- ROOM AVAILABILITY (specific room) --------
// GET /bookings/rooms/:roomId/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
async function roomAvailability(req, res) {
  const roomId = Number(req.params.roomId);
  const { from, to } = req.query;
  if (!roomId || !from || !to) {
    return res.status(400).json({ error: "roomId, from, to are required" });
  }
  try {
    const sql = `
      SELECT booking_id, check_in_date, check_out_date, status
      FROM booking
      WHERE room_id = $1
        AND daterange(check_in_date, check_out_date, '[)')
            && daterange($2::date, $3::date, '[)')
      ORDER BY check_in_date
    `;
    const { rows } = await pool.query(sql, [roomId, from, to]);
    const available = rows.length === 0;
    return res.json({ room_id: roomId, from, to, available, conflicts: rows });
  } catch (err) {
    console.error("roomAvailability error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// -------- LIST FREE ROOMS (any room with no overlap) --------
// GET /bookings/rooms/free?from=YYYY-MM-DD&to=YYYY-MM-DD
async function listFreeRooms(req, res) {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "from and to dates required" });
  }

  try {
    const sql = `
      SELECT r.room_id, r.room_number, r.room_type_id,
             rt.name AS type_name, rt.capacity, rt.daily_rate
      FROM room r
      JOIN room_type rt ON rt.room_type_id = r.room_type_id
      WHERE NOT EXISTS (
        SELECT 1
          FROM booking b
         WHERE b.room_id = r.room_id
           AND daterange(b.check_in_date, b.check_out_date, '[)')
               && daterange($1::date, $2::date, '[)')
      )
      ORDER BY r.room_id
    `;
    const { rows } = await pool.query(sql, [from, to]);
    return res.json({ from, to, free_rooms: rows });
  } catch (err) {
    console.error("listFreeRooms error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createBookingWithPayment(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      booked_rate,
      tax_rate_percent = 0,
      advance_payment = 0,
      status = "Booked",
      // optional payment bits
      method,
      payment_reference,
      paid_at,
    } = req.body;

    // 1) create booking
    const insertBookingSql = `
      INSERT INTO booking
        (guest_id, room_id, check_in_date, check_out_date, status,
         booked_rate, tax_rate_percent, advance_payment)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING booking_id, guest_id, room_id, check_in_date, check_out_date, status
    `;
    const bVals = [
      Number(guest_id),
      Number(room_id),
      check_in_date,
      check_out_date,
      status,
      Number(booked_rate),
      Number(tax_rate_percent ?? 0),
      Number(advance_payment ?? 0),
    ];
    const b = await client.query(insertBookingSql, bVals);
    const rawBooking = b.rows[0];

    // decorate booking with pretty fields
    const booking = {
      ...rawBooking,
      check_in_pretty: prettyDateTime(rawBooking.check_in_date),
      check_out_pretty: prettyDateTime(rawBooking.check_out_date),
      date_range_pretty: prettyRangeDateTime(
        rawBooking.check_in_date,
        rawBooking.check_out_date,
      ),
    };

    // 2) optional advance payment
    let payment = null;
    if (Number(advance_payment) > 0) {
      const dbMethod = normalizePaymentMethod(method);
      if (!dbMethod) {
        throw Object.assign(new Error("method invalid for advance payment"), {
          code: "BAD_METHOD",
        });
      }

      if (payment_reference) {
        const dupe = await client.query(
          `SELECT 1 FROM payment WHERE booking_id = $1 AND payment_reference = $2 LIMIT 1`,
          [booking.booking_id, payment_reference.trim()],
        );
        if (dupe.rowCount) {
          throw Object.assign(
            new Error("Duplicate payment_reference for this booking"),
            { code: "DUP_REF" },
          );
        }
      }

      const insertPaySql = `
        INSERT INTO payment (booking_id, amount, method, paid_at, payment_reference)
        VALUES ($1, $2, $3, COALESCE($4::timestamp, NOW()), $5)
        RETURNING payment_id, booking_id, amount, method, paid_at, payment_reference
      `;
      const pVals = [
        booking.booking_id,
        Number(advance_payment),
        dbMethod,
        paid_at || null,
        payment_reference ? payment_reference.trim() : null,
      ];
      const p = await client.query(insertPaySql, pVals);
      const rawPay = p.rows[0];

      // decorate payment with pretty fields
      payment = {
        ...rawPay,
        paid_at_pretty: prettyDateTime(rawPay.paid_at),
        paid_at_unix: rawPay.paid_at
          ? Math.floor(new Date(rawPay.paid_at).getTime() / 1000)
          : null,
      };
    }

    await client.query("COMMIT");

    // include payment only if created
    return res.status(201).json(payment ? { booking, payment } : { booking });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createBookingWithPayment tx error:", err);

    if (err.code === "23P01")
      return res
        .status(400)
        .json({ error: "Room already booked for that date range" });
    if (err.code === "23503")
      return res.status(400).json({ error: "Foreign key violation" });
    if (err.code === "23514")
      return res
        .status(400)
        .json({ error: "Check constraint failed", detail: err.detail });
    if (err.code === "23505")
      return res
        .status(409)
        .json({ error: "Duplicate key", detail: err.detail });
    if (err.code === "22P02")
      return res
        .status(400)
        .json({ error: "Invalid input syntax", detail: err.detail });
    if (err.code === "BAD_METHOD")
      return res
        .status(400)
        .json({ error: "Invalid payment method. Use Cash/Card/Online." });
    if (err.code === "DUP_REF")
      return res
        .status(409)
        .json({ error: "Duplicate payment_reference for this booking" });

    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

module.exports = {
  createBooking,
  getBookingById,
  updateStatus,
  listBookings,
  roomAvailability,
  listFreeRooms,
  createBookingWithPayment,
};
