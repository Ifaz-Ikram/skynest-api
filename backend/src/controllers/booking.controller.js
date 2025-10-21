// src/controllers/booking.controller.js
const { pool } = require("../db");
const { logAudit } = require("../middleware/audit");
// bookingMetaStore removed - feature not in schema
// const bookingMetaStore = require("../data/bookingMetaStore");
// Utility functions imported but reserved for future use
const { calculateBookingTotals: _calculateBookingTotals } = require("../utils/totals");
const { formatDate: _formatDate } = require("../utils/dates");
// buildDepositSummary removed - deposit feature not in schema
// const { buildDepositSummary } = require("../utils/deposit");

// -------- helpers --------
function pickBookingBody(body = {}) {
  console.log('=== BOOKING BODY DEBUG ===');
  console.log('Received body:', JSON.stringify(body, null, 2));
  
  const {
    guest_id,
    room_id,
    check_in_date,
    check_out_date,
    status = "Booked",
    booked_rate,
    tax_rate_percent = 0,
    advance_payment = 0,
    is_group_booking = false,
    group_booking_id,
    group_name,
    room_type_id,
    room_quantity,
  } = body;

  // Different validation for group vs individual bookings
  console.log('is_group_booking:', is_group_booking, 'type:', typeof is_group_booking);
  if (is_group_booking === true) {
    console.log('Validating group booking...');
    // Group booking validation
    if (
      !guest_id ||
      !room_type_id ||
      !room_quantity ||
      !check_in_date ||
      !check_out_date ||
      !booked_rate
    ) {
      console.log('Group booking validation failed:', {
        guest_id: !!guest_id,
        room_type_id: !!room_type_id,
        room_quantity: !!room_quantity,
        check_in_date: !!check_in_date,
        check_out_date: !!check_out_date,
        booked_rate: !!booked_rate
      });
      return {
        error:
          "guest_id, room_type_id, room_quantity, check_in_date, check_out_date, booked_rate are required for group bookings",
      };
    }
  } else {
    console.log('Validating individual booking...');
    // Individual booking validation
    if (
      !guest_id ||
      !room_id ||
      !check_in_date ||
      !check_out_date ||
      !booked_rate
    ) {
      console.log('Individual booking validation failed:', {
        guest_id: !!guest_id,
        room_id: !!room_id,
        check_in_date: !!check_in_date,
        check_out_date: !!check_out_date,
        booked_rate: !!booked_rate
      });
      return {
        error:
          "guest_id, room_id, check_in_date, check_out_date, booked_rate are required",
      };
    }
  }

  // Enhanced validation using database constraints
  const validationErrors = [];
  
  if (Number(booked_rate) <= 0) {
    validationErrors.push("Booking rate must be positive");
  }
  
  if (new Date(check_out_date) <= new Date(check_in_date)) {
    validationErrors.push("Check-out date must be after check-in date");
  }
  
  if (Number(tax_rate_percent) < 0 || Number(tax_rate_percent) > 100) {
    validationErrors.push("Tax rate must be between 0 and 100%");
  }

  if (validationErrors.length > 0) {
    return { error: validationErrors.join(", ") };
  }

  const result = {
    guest_id: Number(guest_id),
    room_id: room_id ? Number(room_id) : null,
    check_in_date,
    check_out_date,
    status,
    booked_rate: Number(booked_rate),
    tax_rate_percent: Number(tax_rate_percent),
    advance_payment: Number(advance_payment),
    is_group_booking: Boolean(is_group_booking),
    group_booking_id: group_booking_id ? Number(group_booking_id) : null,
    group_name,
    room_type_id: room_type_id ? Number(room_type_id) : null,
    room_quantity: room_quantity ? Number(room_quantity) : null,
  };
  
  console.log('=== END BOOKING BODY DEBUG ===');
  console.log('Returning result:', JSON.stringify(result, null, 2));
  
  return result;
}

function validateDateRange(checkIn, checkOut) {
  const inDate = checkIn ? new Date(checkIn) : null;
  const outDate = checkOut ? new Date(checkOut) : null;
  if (!inDate || Number.isNaN(inDate.valueOf())) {
    return "Invalid check_in_date";
  }
  if (!outDate || Number.isNaN(outDate.valueOf())) {
    return "Invalid check_out_date";
  }
  if (outDate <= inDate) {
    return "check_out_date must be after check_in_date";
  }
  return null;
}

// New function to validate ID requirements for specific booking types
async function validateIdRequirements(guestId, bookingData, db = pool) {
  const { is_group_booking, group_name } = bookingData;
  
  // Check if ID validation is required
  const requiresIdValidation = 
    is_group_booking === true ||
    (group_name && group_name.trim() !== '');

  if (!requiresIdValidation) {
    return null; // No ID validation required
  }

  // Get guest details
  const guestResult = await db.query(
    `SELECT guest_id, full_name, id_proof_type, id_proof_number 
     FROM guest WHERE guest_id = $1`,
    [guestId]
  );

  if (guestResult.rows.length === 0) {
    return "Guest not found";
  }

  const guest = guestResult.rows[0];
  
  // Check if guest has valid ID proof
  if (!guest.id_proof_type || !guest.id_proof_number || guest.id_proof_number.trim() === '') {
    const bookingType = 'group booking';
    return `ID proof is required for ${bookingType}. Guest "${guest.full_name}" must provide valid ID proof (type and number) before booking can be confirmed.`;
  }

  return null; // ID validation passed
}

async function findRoomConflicts(
  roomId,
  checkIn,
  checkOut,
  options = {},
  db = pool,
) {
  const excludeBookingId =
    options.excludeBookingId && Number(options.excludeBookingId) > 0
      ? Number(options.excludeBookingId)
      : null;
  const params = [Number(roomId), checkIn, checkOut];
  let exclusionSql = "";
  if (excludeBookingId) {
    params.push(excludeBookingId);
    exclusionSql = `AND booking_id <> $${params.length}`;
  }
  const sql = `
    SELECT booking_id, guest_id, check_in_date, check_out_date, status
      FROM booking
     WHERE room_id = $1
       AND status IN ('Booked', 'Checked-In')
       AND daterange(check_in_date, check_out_date, '[)')
           && daterange($2::date, $3::date, '[)')
       ${exclusionSql}
     ORDER BY check_in_date
  `;
  const { rows } = await db.query(sql, params);
  return rows;
}

async function findFreeRoomsBetween(
  checkIn,
  checkOut,
  { capacity, roomTypeId, excludeRoomId, limit } = {},
  db = pool,
) {
  const params = [checkIn, checkOut];
  const filters = [];

  if (roomTypeId) {
    params.push(Number(roomTypeId));
    filters.push(`r.room_type_id = $${params.length}`);
  }
  if (capacity) {
    params.push(Number(capacity));
    filters.push(`rt.capacity >= $${params.length}`);
  }
  if (excludeRoomId) {
    params.push(Number(excludeRoomId));
    filters.push(`r.room_id <> $${params.length}`);
  }

  const whereFilters = filters.length ? `AND ${filters.join(" AND ")}` : "";
  let limitSql = "";
  if (limit && Number(limit) > 0) {
    limitSql = `LIMIT ${Math.min(Number(limit), 50)}`;
  }

  const sql = `
    SELECT r.room_id,
           r.room_number,
           r.room_type_id,
           rt.name AS room_type_name,
           rt.capacity,
           rt.daily_rate
      FROM room r
      JOIN room_type rt ON rt.room_type_id = r.room_type_id
     WHERE r.status = 'Available'
       AND NOT EXISTS (
        SELECT 1
          FROM booking b
         WHERE b.room_id = r.room_id
           AND b.status IN ('Booked', 'Checked-In')
           AND daterange(b.check_in_date, b.check_out_date, '[)')
               && daterange($1::date, $2::date, '[)')
     )
     ${whereFilters}
     ORDER BY r.room_number ASC, r.room_id ASC
     ${limitSql}
  `;
  const { rows } = await db.query(sql, params);
  return rows;
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
  return inStr && outStr ? `${inStr} -> ${outStr}` : null;
}

function normalizePaymentMethod(input) {
  if (!input) return null;
  const m = String(input).trim().toLowerCase();
  if (m === "cash") return "Cash";
  if (m === "card") return "Card";
  if (m === "online") return "Online";
  return null;
}

// -------- FULL BOOKING SNAPSHOT --------
// GET /bookings/:id/full
async function getBookingFull(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  try {
    // 1) Booking core
    const bq = await pool.query(
      `SELECT booking_id, guest_id, room_id,
              check_in_date, check_out_date, status,
              booked_rate, tax_rate_percent, advance_payment,
              COALESCE(discount_amount, 0) AS discount_amount,
              COALESCE(late_fee_amount, 0) AS late_fee_amount
         FROM booking
        WHERE booking_id = $1`,
      [id],
    );
    if (!bq.rowCount) return res.status(404).json({ error: "Not found" });
    const raw = bq.rows[0];
    if (req.user && req.user.role === 'Customer') {
      if (Number(req.user.guest_id) !== Number(raw.guest_id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const booking = {
      ...raw,
      check_in_pretty: prettyDateTime(raw.check_in_date),
      check_out_pretty: prettyDateTime(raw.check_out_date),
      date_range_pretty: prettyRangeDateTime(raw.check_in_date, raw.check_out_date),
    };
    // Meta and deposit features removed - not in schema
    // const meta = await bookingMetaStore.getMeta(id);
    // booking.deposit_summary = buildDepositSummary(raw, meta || {});

    // 2) Service usage list + total
    const su = await pool.query(
      `SELECT u.service_usage_id, u.booking_id, u.service_id, s.name AS service_name,
              u.used_on, u.qty, u.unit_price_at_use,
              (u.qty * u.unit_price_at_use)::numeric AS line_total
         FROM service_usage u
         JOIN service_catalog s ON s.service_id = u.service_id
        WHERE u.booking_id = $1
        ORDER BY u.used_on DESC, u.service_usage_id DESC`,
      [id],
    );
    const suTotal = await pool.query(
      `SELECT COALESCE(SUM(qty * unit_price_at_use), 0)::numeric AS services_total
         FROM service_usage
        WHERE booking_id = $1`,
      [id],
    );

    // 3) Payments + adjustments + totals
    const pay = await pool.query(
      `SELECT payment_id, booking_id, amount, method, paid_at, payment_reference
         FROM payment
        WHERE booking_id = $1
        ORDER BY paid_at DESC, payment_id DESC`,
      [id],
    );
    const adj = await pool.query(
      `SELECT adjustment_id, booking_id,
              CASE WHEN type IN ('refund','chargeback') THEN -amount ELSE amount END AS amount,
              type,
              COALESCE(created_at, adjusted_at, createdon, created, "timestamp", ts, NOW()) AS created_at
         FROM payment_adjustment
        WHERE booking_id = $1
        ORDER BY created_at DESC, adjustment_id DESC`,
      [id],
    );
    const totals = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(amount),0)::numeric FROM payment WHERE booking_id=$1) AS total_paid,
         (SELECT COALESCE(SUM(CASE WHEN type IN ('refund','chargeback') THEN -amount ELSE amount END),0)::numeric FROM payment_adjustment WHERE booking_id=$1) AS total_adjust`,
      [id],
    );

    return res.json({
      booking,
      services: { total: suTotal.rows[0].services_total, list: su.rows },
      payments: { totals: totals.rows[0], list: pay.rows, adjustments: adj.rows },
    });
  } catch (err) {
    console.error("getBookingFull error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// -------- CREATE --------
// POST /bookings
async function createGroupBooking(req, res, picked) {
  console.log('createGroupBooking called with:', { picked });
  try {
    const { room_type_id, room_quantity, check_in_date, check_out_date, guest_id, booked_rate, advance_payment, group_name } = picked;
    
    // Find available rooms of the specified type
    const availableRoomsQuery = `
      SELECT r.room_id, r.room_number, rt.name as room_type_name
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_type_id = $1 
        AND r.status IN ('Available')
        AND r.room_id NOT IN (
          SELECT DISTINCT room_id 
          FROM booking 
          WHERE status IN ('Booked', 'Checked-In')
            AND (
              (check_in_date <= $2 AND check_out_date > $2) OR
              (check_in_date < $3 AND check_out_date >= $3) OR
              (check_in_date >= $2 AND check_out_date <= $3)
            )
        )
      ORDER BY r.room_number
      LIMIT $4
    `;
    
    const { rows: availableRooms } = await pool.query(availableRoomsQuery, [
      room_type_id, 
      check_in_date, 
      check_out_date, 
      room_quantity
    ]);
    
    if (availableRooms.length < room_quantity) {
      return res.status(409).json({
        error: `Only ${availableRooms.length} rooms available of this type. Requested: ${room_quantity}`,
        available_rooms: availableRooms.length,
        requested_quantity: room_quantity
      });
    }
    
    // Create bookings for each available room
    const bookings = [];
    const advancePerRoom = advance_payment / room_quantity;
    
    for (const room of availableRooms) {
      const sql = `
        INSERT INTO booking
          (guest_id, room_id, check_in_date, check_out_date, status,
           booked_rate, tax_rate_percent, advance_payment, 
           is_group_booking, group_name)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING booking_id, guest_id, room_id, check_in_date, check_out_date, status;
      `;
      
      const vals = [
        guest_id,
        room.room_id,
        check_in_date,
        check_out_date,
        picked.status || 'Booked',
        booked_rate,
        picked.tax_rate_percent || 0,
        advancePerRoom,
        true,
        group_name,
      ];
      
      const { rows } = await pool.query(sql, vals);
      const raw = rows[0];
      
      const booking = {
        ...raw,
        room_number: room.room_number,
        room_type_name: room.room_type_name,
        check_in_pretty: prettyDateTime(raw.check_in_date),
        check_out_pretty: prettyDateTime(raw.check_out_date),
        date_range_pretty: prettyRangeDateTime(
          raw.check_in_date,
          raw.check_out_date,
        ),
      };
      
      bookings.push(booking);
      
      // Audit each booking
      logAudit(req, { 
        action: 'create_group_booking', 
        entity: 'booking', 
        entityId: booking.booking_id, 
        details: { ...booking, group_name } 
      });
    }
    
    return res.status(201).json({ 
      message: `Group booking created successfully with ${bookings.length} rooms`,
      group_name,
      bookings,
      total_advance_payment: advance_payment
    });
    
  } catch (err) {
    console.error("createGroupBooking error:", err);
    return res.status(500).json({ error: "Failed to create group booking" });
  }
}

async function createBooking(req, res) {
  console.log('createBooking received body:', req.body);
  const picked = pickBookingBody(req.body);
  console.log('picked data:', picked);
  if (picked.error) return res.status(400).json({ error: picked.error });

  const rangeError = validateDateRange(
    picked.check_in_date,
    picked.check_out_date,
  );
  if (rangeError) return res.status(400).json({ error: rangeError });

  // Validate ID requirements for tour bookings and group bookings
  const idValidationError = await validateIdRequirements(picked.guest_id, picked);
  if (idValidationError) {
    return res.status(400).json({ error: idValidationError });
  }

  try {
    // Handle group bookings differently
    if (picked.is_group_booking && picked.room_type_id && picked.room_quantity) {
      return await createGroupBooking(req, res, picked);
    }

    // Handle individual bookings (existing logic)
    const conflicts = await findRoomConflicts(
      picked.room_id,
      picked.check_in_date,
      picked.check_out_date,
    );
    if (conflicts.length) {
      const suggestions = await findFreeRoomsBetween(
        picked.check_in_date,
        picked.check_out_date,
        { excludeRoomId: picked.room_id, limit: 10 },
      );
      return res.status(409).json({
        error: "Room already booked for that date range",
        conflicts,
        suggestions,
      });
    }

    const sql = `
      INSERT INTO booking
        (guest_id, room_id, check_in_date, check_out_date, status,
         booked_rate, tax_rate_percent, advance_payment, 
         is_group_booking, group_booking_id, group_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
      picked.is_group_booking,
      picked.group_booking_id,
      picked.group_name,
    ];

    const { rows } = await pool.query(sql, vals);
    const raw = rows[0];
    if (req.user && req.user.role === 'Customer') {
      if (Number(req.user.guest_id) !== Number(raw.guest_id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const booking = {
      ...raw,
      check_in_pretty: prettyDateTime(raw.check_in_date),
      check_out_pretty: prettyDateTime(raw.check_out_date),
      date_range_pretty: prettyRangeDateTime(
        raw.check_in_date,
        raw.check_out_date,
      ),
    };
    // Deposit feature removed - not in schema
    // const summarySource = { ...raw, advance_payment: picked.advance_payment };
    // booking.deposit_summary = buildDepositSummary(summarySource, {});

    // audit
    logAudit(req, { action: 'create_booking', entity: 'booking', entityId: booking.booking_id, details: booking });
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
      `SELECT booking_id, guest_id, room_id,
              check_in_date, check_out_date, status,
              booked_rate, tax_rate_percent, advance_payment,
              COALESCE(discount_amount, 0) AS discount_amount,
              COALESCE(late_fee_amount, 0) AS late_fee_amount
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
    // Meta and deposit features removed - not in schema
    // const meta = await bookingMetaStore.getMeta(id);
    // booking.deposit_summary = buildDepositSummary(raw, meta || {});
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
    // audit
    logAudit(req, { action: 'update_booking_status', entity: 'booking', entityId: id, details: r.rows[0] });
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
// GET /bookings?from&to&room_id&guest_id&status&page&limit&sort&dir
async function listBookings(req, res) {
  const {
    from,
    to,
    room_id,
    guest_id,
    status,
    branch_id, // NEW: Add branch filtering
    page = 1,
    limit = 50,
    sort,
    dir,
  } = req.query;

  console.log('listBookings req.query:', req.query);
  console.log('branch_id parameter:', branch_id);

  const p = Math.max(Number(page) || 1, 1);
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 50);
  const offset = (p - 1) * lim;

  const where = [];
  const vals = [];

  if (from) {
    vals.push(from);
    where.push(`b.check_in_date >= $${vals.length}`);
  }
  if (to) {
    vals.push(to);
    where.push(`b.check_out_date <= $${vals.length}`);
  }
  if (room_id) {
    vals.push(Number(room_id));
    where.push(`b.room_id = $${vals.length}`);
  }
  // If the caller is a Customer, force-filter to their own guest_id
  const callerRole = req.user?.role;
  const callerGuestId = req.user?.guest_id;
  const isCustomer = callerRole === "Customer" && Number(callerGuestId) > 0;

  const effectiveGuestId = isCustomer ? Number(callerGuestId) : guest_id ? Number(guest_id) : null;
  if (effectiveGuestId) {
    vals.push(effectiveGuestId);
    where.push(`b.guest_id = $${vals.length}`);
  }
  if (status) {
    vals.push(status);
    where.push(`b.status = $${vals.length}`);
  }
  if (branch_id) { // NEW: Add branch filtering logic
    vals.push(Number(branch_id));
    where.push(`r.branch_id = $${vals.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Safe ORDER BY
  const SORT_MAP = new Map([
    ["booking_id", 'booking_id'],
    ["check_in_date", 'check_in_date'],
    ["check_out_date", 'check_out_date'],
    ["status", 'status'],
    ["guest_id", 'guest_id'],
    ["room_id", 'room_id'],
  ]);
  const sortCol = SORT_MAP.get(String(sort||'').toLowerCase()) || 'check_in_date';
  const sortDir = String(dir||'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Use INNER JOIN for room when branch filtering is used
  const roomJoin = branch_id ? 'INNER JOIN' : 'LEFT JOIN';
  
  const dataSql = `
    SELECT 
      b.booking_id, 
      b.guest_id, 
      b.room_id, 
      b.check_in_date, 
      b.check_out_date, 
      b.status,
      b.booked_rate,
      b.tax_rate_percent,
      b.advance_payment,
      COALESCE(b.discount_amount, 0) AS discount_amount,
      COALESCE(b.late_fee_amount, 0) AS late_fee_amount,
      0 AS payments_total,
      0 AS adjustments_total,
      g.full_name AS guest_name,
      r.room_number,
      rt.name AS room_type_name
    FROM booking b
    LEFT JOIN guest g ON g.guest_id = b.guest_id
    ${roomJoin} room r ON r.room_id = b.room_id
    LEFT JOIN room_type rt ON rt.room_type_id = r.room_type_id
    ${whereSql}
    ORDER BY ${sortCol} ${sortDir}, b.booking_id DESC
    LIMIT ${lim} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*)::int AS total FROM booking b ${roomJoin} room r ON r.room_id = b.room_id ${whereSql}`;

  try {
    console.log('Executing booking query:', dataSql);
    console.log('Query values:', vals);
    
    const [data, cnt] = await Promise.all([
      pool.query(dataSql, vals),
      pool.query(countSql, vals),
    ]);

    // Skip meta store for now to avoid errors
    // const metaMap = await bookingMetaStore.listMetas();

    const items = data.rows.map((raw) => {
      // Calculate total amount: booked_rate + tax - discount + late_fee
      const subtotal = Number(raw.booked_rate) || 0;
      const tax = subtotal * (Number(raw.tax_rate_percent) || 0) / 100;
      const discount = Number(raw.discount_amount) || 0;
      const lateFee = Number(raw.late_fee_amount) || 0;
      const total_amount = subtotal + tax - discount + lateFee;
      const payments_total = Number(raw.payments_total) || 0;
      const adjustments_total = Number(raw.adjustments_total) || 0;
      const paid_total = (Number(raw.advance_payment) || 0) + payments_total + adjustments_total;
      const balance_due = Number((total_amount - paid_total).toFixed(2));
      const payment_status = balance_due <= 0 ? 'Paid' : (paid_total > 0 ? 'Partial' : 'Unpaid');

      // const rowMeta = metaMap[String(raw.booking_id)];
      // Deposit feature removed - not in schema
      // const deposit_summary = buildDepositSummary(raw, { });

      return {
        ...raw,
        total_amount: Number(total_amount.toFixed(2)),
        payments_total: Number(payments_total.toFixed ? payments_total.toFixed(2) : payments_total),
        adjustments_total: Number(adjustments_total.toFixed ? adjustments_total.toFixed(2) : adjustments_total),
        balance_due,
        payment_status,
        check_in_pretty: prettyDateTime(raw.check_in_date),
        check_out_pretty: prettyDateTime(raw.check_out_date),
        date_range_pretty: prettyRangeDateTime(
          raw.check_in_date,
          raw.check_out_date,
        ),
        meta: null,
        // deposit_summary removed - deposit feature not in schema
      };
    });

    return res.json({
      page: p,
      limit: lim,
      total: cnt.rows[0].total,
      bookings: items,
    });
  } catch (err) {
    console.error("listBookings error:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ error: "Internal server error", details: err.message });
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
  const {
    from,
    to,
    capacity,
    room_type_id,
    exclude_room_id,
    limit,
  } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "from and to dates required" });
  }

  try {
    const rooms = await findFreeRoomsBetween(from, to, {
      capacity,
      roomTypeId: room_type_id,
      excludeRoomId: exclude_room_id,
      limit,
    });
    return res.json({
      from,
      to,
      capacity: capacity ? Number(capacity) : null,
      room_type_id: room_type_id ? Number(room_type_id) : null,
      free_rooms: rooms,
    });
  } catch (err) {
    console.error("listFreeRooms error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function checkAvailability(req, res) {
  const {
    room_id,
    check_in,
    check_out,
    capacity,
    room_type_id,
  } = req.body || {};
  const roomId = Number(room_id);
  if (!roomId || !check_in || !check_out) {
    return res
      .status(400)
      .json({ error: "room_id, check_in, check_out are required" });
  }

  const rangeError = validateDateRange(check_in, check_out);
  if (rangeError) return res.status(400).json({ error: rangeError });

  try {
    const conflicts = await findRoomConflicts(roomId, check_in, check_out);
    const available = conflicts.length === 0;
    const payload = {
      room_id: roomId,
      check_in,
      check_out,
      available,
      conflicts,
    };
    if (!available) {
      payload.suggestions = await findFreeRoomsBetween(check_in, check_out, {
        excludeRoomId: roomId,
        capacity,
        roomTypeId: room_type_id,
        limit: 10,
      });
    }
    return res.json(payload);
  } catch (err) {
    console.error("checkAvailability error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function availabilityTimeline(req, res) {
  const { from, to, room_type_id, branch_id } = req.query; // NEW: Add branch filter
  if (!from || !to) {
    return res.status(400).json({ error: "from and to are required" });
  }

  try {
    const roomTypeFilter =
      room_type_id === undefined || room_type_id === null || room_type_id === ""
        ? null
        : Number(room_type_id);
    
    const branchFilter = branch_id ? Number(branch_id) : null; // NEW: Branch filter
    
    const sql = `
      SELECT
        r.room_id,
        r.room_number,
        r.status AS room_status,
        r.room_type_id,
        rt.name AS room_type_name,
        rt.capacity,
        rt.daily_rate,
        b.booking_id,
        b.check_in_date,
        b.check_out_date,
        b.status AS booking_status,
        g.full_name AS guest_name
      FROM room r
      JOIN room_type rt ON rt.room_type_id = r.room_type_id
      LEFT JOIN booking b
        ON b.room_id = r.room_id
       AND b.status IN ('Booked', 'Checked-In')
       AND daterange(b.check_in_date, b.check_out_date, '[)')
           && daterange($1::date, $2::date, '[)')
      LEFT JOIN guest g ON g.guest_id = b.guest_id
      WHERE ($3::int IS NULL OR r.room_type_id = $3::int)
        AND ($4::int IS NULL OR r.branch_id = $4::int)
      ORDER BY r.room_number ASC, r.room_id ASC, b.check_in_date ASC NULLS LAST
    `;
    const params = [from, to, roomTypeFilter, branchFilter]; // NEW: Include branch filter
    const { rows } = await pool.query(sql, params);
    // TODO: Re-enable when bookingMetaStore is fully implemented
    // const metaMap = await bookingMetaStore.listMetas();
    const roomMap = new Map();

    for (const row of rows) {
      if (!roomMap.has(row.room_id)) {
        roomMap.set(row.room_id, {
          room_id: row.room_id,
          room_number: row.room_number,
          room_status: row.room_status,
          room_type_id: row.room_type_id,
          room_type_name: row.room_type_name,
          capacity: row.capacity,
          daily_rate:
            row.daily_rate === null || row.daily_rate === undefined
              ? null
              : Number(row.daily_rate),
          bookings: [],
        });
      }
      if (row.booking_id) {
        roomMap.get(row.room_id).bookings.push({
          booking_id: row.booking_id,
          check_in_date: row.check_in_date,
          check_out_date: row.check_out_date,
          status: row.booking_status,
          guest_name: row.guest_name,
          check_in_pretty: prettyDateTime(row.check_in_date),
          check_out_pretty: prettyDateTime(row.check_out_date),
          date_range_pretty: prettyRangeDateTime(
            row.check_in_date,
            row.check_out_date,
          ),
          meta: null, // TODO: Add meta support when implemented
        });
      }
    }

    return res.json({
      from,
      to,
      room_type_id: roomTypeFilter,
      rooms: Array.from(roomMap.values()),
    });
  } catch (err) {
    console.error("availabilityTimeline error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getBookingMetaController(req, res) {
  // Meta feature removed - not in schema
  return res.status(501).json({ error: "Booking metadata feature not implemented - no schema support" });
}

async function upsertBookingMeta(req, res) {
  // Meta feature removed - not in schema
  return res.status(501).json({ error: "Booking metadata feature not implemented - no schema support" });
}

async function deleteBookingMeta(req, res) {
  // Meta feature removed - not in schema
  return res.status(501).json({ error: "Booking metadata feature not implemented - no schema support" });
}

async function listBookingGroups(req, res) {
  try {
    // Derive groups from existing bookings only (no separate group table)
    const query = `
      SELECT 
        COALESCE(group_name, '(Unnamed Group)') AS group_name,
        COUNT(*) AS actual_bookings,
        ARRAY_AGG(booking_id) AS booking_ids,
        MIN(check_in_date) AS created_at
      FROM booking
      WHERE is_group_booking = TRUE
      GROUP BY COALESCE(group_name, '(Unnamed Group)')
      ORDER BY MIN(check_in_date) DESC
    `;

    const result = await pool.query(query);

    const groups = result.rows.map(row => ({
      groupId: row.group_name, // using group name as identifier
      name: row.group_name,
      contactPerson: null,
      contactPhone: null,
      contactEmail: null,
      notes: null,
      totalGuests: parseInt(row.actual_bookings) || 0,
      actualBookings: parseInt(row.actual_bookings) || 0,
      bookingIds: (row.booking_ids || []).filter(id => id !== null),
      createdAt: row.created_at,
      branchId: null,
      createdBy: null,
    }));

    return res.json({ groups });
  } catch (err) {
    console.error("listBookingGroups error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function saveBookingGroup(req, res) {
  try {
    const {
      group_name,
      booking_ids = [],
    } = req.body;

    if (!group_name) {
      return res.status(400).json({ 
        error: "group_name is required" 
      });
    }

    // Validate booking IDs if provided
    if (booking_ids && booking_ids.length > 0) {
      const { rows } = await pool.query(
        `SELECT booking_id FROM booking WHERE booking_id = ANY($1::int[])`,
        [booking_ids]
      );
      const found = new Set(rows.map(row => Number(row.booking_id)));
      const missing = booking_ids.filter(id => !found.has(Number(id)));
      if (missing.length) {
        return res.status(404).json({ 
          error: "Some bookings not found", 
          missing 
        });
      }
    }

    // Assign bookings to the named group (no separate group table)
    if (booking_ids && booking_ids.length > 0) {
      await pool.query(
        `UPDATE booking 
         SET is_group_booking = true, group_name = $1
         WHERE booking_id = ANY($2::int[])`,
        [group_name, booking_ids]
      );
    }

    // Log audit
    logAudit(req, {
      action: 'create_booking_group',
      entity: 'booking_group_virtual',
      entityId: group_name,
      details: { group_name, booking_ids },
    });

    return res.status(201).json({ 
      group: {
        groupId: group_name,
        name: group_name,
        totalGuests: booking_ids.length,
        bookingIds: booking_ids,
      }
    });
  } catch (err) {
    console.error("saveBookingGroup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function assignBookingGroupMembers(req, res) {
  const { groupId } = req.params; // here groupId is the group name
  const rawIds =
    req.body?.booking_ids ??
    req.body?.bookingIds ??
    req.body?.booking_id ??
    req.body?.bookingId;
  
  if (!groupId) {
    return res.status(400).json({ error: "groupId required" });
  }

  let bookingIds = [];
  if (Array.isArray(rawIds)) {
    bookingIds = Array.from(
      new Set(
        rawIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );
  } else if (rawIds !== undefined && rawIds !== null && rawIds !== "") {
    const single = Number(rawIds);
    if (Number.isInteger(single) && single > 0) {
      bookingIds = [single];
    }
  }

  if (!bookingIds.length) {
    return res.status(400).json({ error: "booking_ids required" });
  }

  try {
    const group = { group_name: String(groupId) };

    // Validate booking IDs
    const { rows } = await pool.query(
      `SELECT booking_id FROM booking WHERE booking_id = ANY($1::int[])`,
      [bookingIds],
    );
    const found = new Set(rows.map((row) => Number(row.booking_id)));
    const missing = bookingIds.filter((id) => !found.has(id));
    if (missing.length) {
      return res
        .status(404)
        .json({ error: "Some bookings not found", missing });
    }

    // Assign bookings to group name
    await pool.query(
      `UPDATE booking 
       SET is_group_booking = true, group_name = $1
       WHERE booking_id = ANY($2::int[])`,
      [group.group_name, bookingIds]
    );

    logAudit(req, {
      action: 'assign_booking_group_members',
      entity: 'group_booking',
      entityId: groupId,
      details: { group: group.group_name, bookingIds },
    });

    return res.json({ 
      message: "Bookings assigned to group successfully",
      groupId: group.group_name,
      assignedBookings: bookingIds
    });
  } catch (err) {
    console.error("assignBookingGroupMembers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function removeBookingFromGroup(req, res) {
  const { groupId, bookingId } = req.params; // groupId is the group name
  const numericBookingId = Number(bookingId);
  
  if (!groupId || !numericBookingId) {
    return res.status(400).json({ error: "groupId and bookingId required" });
  }

  try {
    // Check if booking exists and is part of this group name
    const bookingResult = await pool.query(
      `SELECT * FROM booking WHERE booking_id = $1 AND group_name = $2`,
      [numericBookingId, String(groupId)]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ 
        error: "Booking not found or not part of this group" 
      });
    }

    // Remove booking from group
    await pool.query(
      `UPDATE booking 
       SET is_group_booking = false, group_name = NULL
       WHERE booking_id = $1`,
      [numericBookingId]
    );

    logAudit(req, {
      action: 'remove_booking_group_member',
      entity: 'booking_group_virtual',
      entityId: String(groupId),
      details: { bookingId: numericBookingId },
    });

    return res.json({ 
      message: "Booking removed from group successfully",
      groupId: Number(groupId),
      bookingId: numericBookingId
    });
  } catch (err) {
    console.error("removeBookingFromGroup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createBookingWithPayment(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const core = pickBookingBody(req.body);
    if (core.error) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: core.error });
    }

    const rangeError = validateDateRange(
      core.check_in_date,
      core.check_out_date,
    );
    if (rangeError) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: rangeError });
    }

    // Validate ID requirements for tour bookings and group bookings
    const idValidationError = await validateIdRequirements(core.guest_id, core, client);
    if (idValidationError) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: idValidationError });
    }

    const conflicts = await findRoomConflicts(
      core.room_id,
      core.check_in_date,
      core.check_out_date,
      {},
      client,
    );
    if (conflicts.length) {
      await client.query("ROLLBACK");
      const suggestions = await findFreeRoomsBetween(
        core.check_in_date,
        core.check_out_date,
        { excludeRoomId: core.room_id, limit: 10 },
        client,
      );
      return res.status(409).json({
        error: "Room already booked for that date range",
        conflicts,
        suggestions,
      });
    }

    // 1) create booking
    const insertBookingSql = `
      INSERT INTO booking
        (guest_id, room_id, check_in_date, check_out_date, status,
         booked_rate, tax_rate_percent, advance_payment)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING booking_id, guest_id, room_id, check_in_date, check_out_date, status
    `;
    const bVals = [
      core.guest_id,
      core.room_id,
      core.check_in_date,
      core.check_out_date,
      core.status,
      core.booked_rate,
      core.tax_rate_percent,
      core.advance_payment,
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
    const { method, payment_reference, paid_at } = req.body;
    if (Number(core.advance_payment) > 0) {
      const dbMethod = normalizePaymentMethod(method);
      if (!dbMethod) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Invalid payment method. Use Cash/Card/Online." });
      }

      if (payment_reference) {
        const dupe = await client.query(
          `SELECT 1 FROM payment WHERE booking_id = $1 AND payment_reference = $2 LIMIT 1`,
          [booking.booking_id, payment_reference.trim()],
        );
        if (dupe.rowCount) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            error: "Duplicate payment_reference for this booking",
          });
        }
      }

      const insertPaySql = `
        INSERT INTO payment (booking_id, amount, method, paid_at, payment_reference)
        VALUES ($1, $2, $3, COALESCE($4::timestamp, NOW()), $5)
        RETURNING payment_id, booking_id, amount, method, paid_at, payment_reference
      `;
      const pVals = [
        booking.booking_id,
        Number(core.advance_payment),
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

    // Deposit feature removed - not in schema
    // booking.deposit_summary = buildDepositSummary({ ...rawBooking, advance_payment: core.advance_payment }, {});

    // include payment only if created
    try {
      // Fire-and-forget confirmation email if configured
      const email = require('../utils/email');
      email.sendBookingConfirmation(booking.booking_id).catch(() => {});
    } catch {
      /* Ignore email delivery issues to avoid blocking booking creation */
    }

    // audit
    logAudit(req, {
      action: 'create_booking_with_payment',
      entity: 'booking',
      entityId: booking.booking_id,
      details: { booking, payment },
    });

    if (payment) return res.status(201).json({ booking, payment });
    return res.status(201).json({ booking });
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

// -------- CANCEL BOOKING --------
// POST /bookings/:id/cancel { reference_note }
async function cancelBooking(req, res) {
  const id = Number(req.params.id);
  const { reference_note } = req.body || {};
  if (!id) return res.status(400).json({ error: "Invalid id" });

  try {
    // Use existing DB function to compute policy, refund and set status
    const { rows } = await pool.query(
      `SELECT * FROM sp_cancel_booking($1, $2)`,
      [id, reference_note || null],
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    // Best-effort audit
    logAudit(req, {
      action: 'cancel_booking',
      entity: 'booking',
      entityId: id,
      details: rows[0],
    });

    return res.json({ cancellation: rows[0] });
  } catch (err) {
    console.error("cancelBooking error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createBooking,
  getBookingById,
  getBookingFull,
  updateStatus,
  listBookings,
  roomAvailability,
  listFreeRooms,
  checkAvailability,
  availabilityTimeline,
  getBookingMeta: getBookingMetaController,
  upsertBookingMeta,
  deleteBookingMeta,
  listBookingGroups,
  saveBookingGroup,
  assignBookingGroupMembers,
  removeBookingFromGroup,
  createBookingWithPayment,
  cancelBooking,
};
