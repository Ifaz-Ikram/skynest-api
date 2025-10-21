const { pool } = require("../db");

// Enhanced status transition rules based on booking-first business logic
// Room statuses: Available, Occupied, Maintenance, Reserved
//
// PHILOSOPHY:
// - Housekeeping can ONLY change between Available ↔ Maintenance
// - Reserved/Occupied statuses are ONLY set by booking system (pre-booking/check-in/checkout processes)
// - If room has active booking, it CANNOT be changed to Available/Maintenance
const STATUS_TRANSITION_RULES = {
  'Available': {
    canChangeTo: ['Maintenance'],
    cannotChangeTo: ['Reserved', 'Occupied'],
    reason: 'Housekeeping can only change Available rooms to Maintenance. Reserved/Occupied status must be set through booking/check-in process.'
  },
  'Reserved': {
    canChangeTo: [],
    cannotChangeTo: ['Available', 'Maintenance', 'Occupied'],
    reason: 'Reserved rooms cannot be manually changed by housekeeping. Status is controlled by booking system. Cancel the booking to make Available.'
  },
  'Occupied': {
    canChangeTo: ['Maintenance'], // Allow emergency maintenance (e.g., pipe burst)
    cannotChangeTo: ['Available', 'Reserved'],
    reason: 'Occupied rooms cannot become Available/Reserved while guest is staying. Maintenance allowed for emergencies (guest will be relocated).'
  },
  'Maintenance': {
    canChangeTo: ['Available'],
    cannotChangeTo: ['Reserved', 'Occupied'],
    reason: 'Maintenance rooms can only become Available. Cannot be Reserved/Occupied - booking system prevents booking Maintenance rooms.'
  }
};

// Enhanced status transition validation with booking date checks
function validateStatusTransition(currentStatus, newStatus, roomData) {
  const rules = STATUS_TRANSITION_RULES[currentStatus];
  if (!rules) {
    return { valid: false, reason: 'Unknown current status' };
  }

  // CRITICAL: If room has ANY active booking (Reserved or Occupied), prevent changing to Available
  // EXCEPTION: Allow Occupied → Maintenance for emergency repairs (guest will be relocated)
  if (roomData.booking) {
    if (newStatus === 'Available') {
      const checkIn = new Date(roomData.booking.check_in_date).toLocaleDateString();
      const checkOut = new Date(roomData.booking.check_out_date).toLocaleDateString();
      return {
        valid: false,
        reason: `Room has active booking from ${checkIn} to ${checkOut}. Cannot change to Available. Cancel booking first or wait for checkout.`
      };
    }

    // Prevent Reserved rooms from going to Maintenance (should cancel booking first)
    if (currentStatus === 'Reserved' && newStatus === 'Maintenance') {
      const checkIn = new Date(roomData.booking.check_in_date).toLocaleDateString();
      const checkOut = new Date(roomData.booking.check_out_date).toLocaleDateString();
      return {
        valid: false,
        reason: `Room is reserved from ${checkIn} to ${checkOut}. Cancel the booking before maintenance, or wait for guest to check in.`
      };
    }
  }

  // Check if transition is explicitly forbidden by business rules
  if (rules.cannotChangeTo.includes(newStatus)) {
    return { valid: false, reason: rules.reason };
  }

  // Check if the transition is in the allowed list
  if (!rules.canChangeTo.includes(newStatus)) {
    return { valid: false, reason: rules.reason };
  }

  // All checks passed
  return { valid: true };
}

// Export the validation function for use in routes
module.exports.validateStatusTransition = validateStatusTransition;

// Compute a derived housekeeping board without schema changes.
// Categories: Clean (no past stays overlapping yesterday/today),
// Dirty (recent checkout and no next checkin yet),
// Stayover (currently occupied with more nights),
// Due Out (last night of stay),
// OOO (Maintenance status), Available.
exports.board = async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.toISOString().slice(0, 10);
    const { branch_id, page = 1, limit = 25 } = req.query;

    // Pagination parameters
    const p = Math.max(Number(page) || 1, 1);
    const lim = Math.min(Math.max(Number(limit) || 25, 1), 100); // Max 100
    const offset = (p - 1) * lim;

    // Build branch filter condition
    let branchFilter = '';
    let branchParams = [];
    if (branch_id) {
      branchFilter = 'WHERE r.branch_id = $1';
      branchParams = [Number(branch_id)];
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM room r
      ${branchFilter}
    `;
    const countResult = await pool.query(countQuery, branchParams);
    const total = Number(countResult.rows[0].total);
    const _totalPages = Math.ceil(total / lim);

    // Get rooms with type and branch (with pagination)
    const rooms = await pool.query(
      `SELECT r.room_id, r.room_number, r.status AS room_status,
              rt.name AS room_type, rt.capacity,
              b.branch_name
         FROM room r
         JOIN room_type rt ON rt.room_type_id = r.room_type_id
         JOIN branch b ON b.branch_id = r.branch_id
        ${branchFilter}
        ORDER BY b.branch_name, r.room_number
        LIMIT $${branchParams.length + 1} OFFSET $${branchParams.length + 2}`,
      [...branchParams, lim, offset]
    );

    // Active bookings overlapping today with guest information
    const bookings = await pool.query(
      `SELECT b.booking_id, b.room_id, b.guest_id, b.status,
              b.check_in_date, b.check_out_date,
              (b.check_out_date - b.check_in_date) AS nights,
              g.full_name AS guest_name, g.email AS guest_email,
              g.phone AS guest_phone
         FROM booking b
         LEFT JOIN guest g ON g.guest_id = b.guest_id
        WHERE daterange(b.check_in_date, b.check_out_date, '[)') && daterange($1::date, $1::date, '[)')
          AND b.status IN ('Booked','Checked-In')`,
      [yyyy]
    );

    // Recent checkouts (yesterday or today)
    const recentCo = await pool.query(
      `SELECT room_id, booking_id, check_out_date
         FROM booking
        WHERE check_out_date >= ($1::date - INTERVAL '1 day')
          AND check_out_date <= $1::date
          AND status IN ('Checked-Out','Cancelled')`,
      [yyyy]
    );

    const byRoom = new Map();
    for (const r of rooms.rows) byRoom.set(r.room_id, { ...r, derived: 'Available', booking: null });

    const todayDate = new Date(yyyy + 'T00:00:00Z');
    for (const b of bookings.rows) {
      const room = byRoom.get(b.room_id);
      if (!room) continue;
      const _inD = new Date(b.check_in_date);
      const outD = new Date(b.check_out_date);
      const isLastNight = outD.getTime() - todayDate.getTime() === 24 * 3600 * 1000;
      const derived = b.status === 'Checked-In' ? (isLastNight ? 'Due Out' : 'Stayover') : 'Arrival';
      room.derived = derived;
      room.booking = b;
    }

    // Mark Dirty if recently checked-out and no current booking occupying
    for (const co of recentCo.rows) {
      const room = byRoom.get(co.room_id);
      if (!room) continue;
      if (!room.booking) {
        if (room.room_status === 'Maintenance') room.derived = 'OOO';
        else room.derived = 'Dirty';
      }
    }

    // Map maintenance explicitly
    for (const r of byRoom.values()) {
      if (r.room_status === 'Maintenance') r.derived = 'OOO';
    }

    const list = Array.from(byRoom.values());
    
    // Return paginated response
    res.json({ 
      date: yyyy, 
      rooms: list,
      pagination: {
        page: p,
        limit: lim,
        total,
        totalPages: Math.ceil(total / lim)
      }
    });
  } catch (e) {
    console.error('housekeeping.board error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get valid status transitions for a room
exports.getValidStatusTransitions = async (req, res) => {
  try {
    const { room_id } = req.params;
    
    // Get room data with booking information
    const roomQuery = await pool.query(
      `SELECT r.room_id, r.room_number, r.status AS room_status,
              rt.name AS room_type, rt.capacity,
              b.branch_name
         FROM room r
         JOIN room_type rt ON rt.room_type_id = r.room_type_id
         JOIN branch b ON b.branch_id = r.branch_id
        WHERE r.room_id = $1`,
      [room_id]
    );

    if (roomQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomQuery.rows[0];
    
    // Get active booking for this room
    const today = new Date().toISOString().slice(0, 10);
    const bookingQuery = await pool.query(
      `SELECT b.booking_id, b.guest_id, b.status,
              b.check_in_date, b.check_out_date,
              g.full_name AS guest_name, g.email AS guest_email,
              g.phone AS guest_phone
         FROM booking b
         LEFT JOIN guest g ON g.guest_id = b.guest_id
        WHERE b.room_id = $1
          AND daterange(b.check_in_date, b.check_out_date, '[)') && daterange($2::date, $2::date, '[)')
          AND b.status IN ('Booked','Checked-In')`,
      [room_id, today]
    );

    const booking = bookingQuery.rows[0] || null;
    
    // Calculate derived status
    let derived = 'Available';
    if (booking) {
      const todayDate = new Date(today + 'T00:00:00Z');
      const outD = new Date(booking.check_out_date);
      const isLastNight = outD.getTime() - todayDate.getTime() === 24 * 3600 * 1000;
      derived = booking.status === 'Checked-In' ? (isLastNight ? 'Due Out' : 'Stayover') : 'Arrival';
    }

    const roomData = { ...room, derived, booking };

    // Get all possible ROOM statuses (not booking statuses)
    const allStatuses = ['Available', 'Reserved', 'Occupied', 'Maintenance'];

    // Validate each possible transition
    const validTransitions = [];
    const invalidTransitions = [];

    for (const status of allStatuses) {
      if (status === room.room_status) continue; // Skip current status

      const validation = validateStatusTransition(room.room_status, status, roomData);

      if (validation.valid) {
        validTransitions.push({
          status,
          type: 'valid',
          reason: 'Allowed transition'
        });
      } else {
        invalidTransitions.push({
          status,
          type: 'invalid',
          reason: validation.reason
        });
      }
    }

    res.json({
      room: roomData,
      validTransitions,
      invalidTransitions,
      currentStatus: room.room_status,
      derivedStatus: derived
    });

  } catch (error) {
    console.error('getValidStatusTransitions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Automatic status update function
async function updateRoomStatusAutomatically(roomId, newStatus, reason = 'Automatic update') {
  try {
    await pool.query(
      'UPDATE room SET status = $1 WHERE room_id = $2',
      [newStatus, roomId]
    );
    console.log(`Room ${roomId} status updated to ${newStatus}: ${reason}`);
    return true;
  } catch (error) {
    console.error(`Failed to update room ${roomId} status:`, error);
    return false;
  }
}

// Check and update room statuses based on booking events
exports.updateRoomStatusesAutomatically = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let updatesCount = 0;

    // 1. Update rooms with completed checkouts to Available (if not in maintenance)
    const checkoutQuery = await pool.query(
      `SELECT DISTINCT r.room_id, r.room_number, r.status
       FROM room r
       JOIN booking b ON b.room_id = r.room_id
       WHERE b.check_out_date = $1::date
         AND b.status = 'Checked-Out'
         AND r.status != 'Maintenance'`,
      [today]
    );

    for (const room of checkoutQuery.rows) {
      if (room.status !== 'Available') {
        await updateRoomStatusAutomatically(room.room_id, 'Available', 'Guest checked out today');
        updatesCount++;
      }
    }

    // 2. Update rooms with new check-ins to Occupied
    const checkinQuery = await pool.query(
      `SELECT DISTINCT r.room_id, r.room_number, r.status
       FROM room r
       JOIN booking b ON b.room_id = r.room_id
       WHERE b.check_in_date = $1::date
         AND b.status = 'Checked-In'
         AND r.status != 'Occupied'`,
      [today]
    );

    for (const room of checkinQuery.rows) {
      if (room.status !== 'Occupied') {
        await updateRoomStatusAutomatically(room.room_id, 'Occupied', 'Guest checked in today');
        updatesCount++;
      }
    }

    // 3. Update rooms with cancelled bookings to Available (if no other active bookings)
    const cancelledQuery = await pool.query(
      `SELECT DISTINCT r.room_id, r.room_number, r.status
       FROM room r
       JOIN booking b ON b.room_id = r.room_id
       WHERE b.status = 'Cancelled'
         AND b.check_out_date >= $1::date
         AND r.status != 'Available'
         AND NOT EXISTS (
           SELECT 1 FROM booking b2 
           WHERE b2.room_id = r.room_id 
             AND b2.status IN ('Booked', 'Checked-In')
             AND daterange(b2.check_in_date, b2.check_out_date, '[)') && daterange($1::date, $1::date, '[)')
         )`,
      [today]
    );

    for (const room of cancelledQuery.rows) {
      if (room.status !== 'Available') {
        await updateRoomStatusAutomatically(room.room_id, 'Available', 'Booking cancelled, no active bookings');
        updatesCount++;
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatesCount} room statuses automatically`,
      updatesCount,
      date: today
    });

  } catch (error) {
    console.error('Automatic status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

