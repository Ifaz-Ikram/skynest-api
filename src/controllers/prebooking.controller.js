/**
 * Pre-Booking Controller
 */

const { pool } = require('../db');

/**
 * GET /pre-bookings
 * List pre-bookings (staff only)
 */
async function listPreBookings(req, res) {
  try {
    const { from, to } = req.query;
    
    let query = `
      SELECT pb.*, 
        g.full_name as guest_name, g.email as guest_email, g.phone as guest_phone,
        r.room_number, rt.name as room_type_name,
        e.name as created_by_name
      FROM pre_booking pb
      JOIN guest g ON g.guest_id = pb.guest_id
      LEFT JOIN room r ON r.room_id = pb.room_id
      LEFT JOIN room_type rt ON rt.room_type_id = r.room_type_id
      LEFT JOIN employee e ON e.employee_id = pb.created_by_employee_id
      WHERE 1=1
    `;
    const params = [];
    
    if (from) {
      params.push(from);
      query += ` AND pb.expected_check_in >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND pb.expected_check_out <= $${params.length}`;
    }
    
    query += ` ORDER BY pb.created_at DESC`;
    
    const { rows } = await pool.query(query, params);
    res.json({ pre_bookings: rows });
  } catch (err) {
    console.error('List pre-bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /pre-bookings/:id
 * Get single pre-booking
 */
async function getPreBookingById(req, res) {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT pb.*, 
        g.full_name as guest_name, g.email as guest_email, g.phone as guest_phone,
        r.room_number, rt.name as room_type_name, rt.capacity,
        e.name as created_by_name
       FROM pre_booking pb
       JOIN guest g ON g.guest_id = pb.guest_id
       LEFT JOIN room r ON r.room_id = pb.room_id
       LEFT JOIN room_type rt ON rt.room_type_id = r.room_type_id
       LEFT JOIN employee e ON e.employee_id = pb.created_by_employee_id
       WHERE pb.pre_booking_id = $1`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pre-booking not found' });
    }
    
    res.json({ pre_booking: rows[0] });
  } catch (err) {
    console.error('Get pre-booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /pre-bookings
 * Create a new pre-booking (Receptionist/Manager)
 */
async function createPreBooking(req, res) {
  try {
    const {
      guest_id,
      capacity,
      prebooking_method,
      expected_check_in,
      expected_check_out,
      room_id = null,
    } = req.body;
    
    // Validation
    if (!guest_id || !capacity || !prebooking_method || !expected_check_in || !expected_check_out) {
      return res.status(400).json({ 
        error: 'Missing required fields: guest_id, capacity, prebooking_method, expected_check_in, expected_check_out' 
      });
    }
    
    // Validate prebooking method
    const validMethods = ['Online', 'Phone', 'Walk-in'];
    if (!validMethods.includes(prebooking_method)) {
      return res.status(400).json({ 
        error: `Invalid prebooking_method. Must be one of: ${validMethods.join(', ')}` 
      });
    }
    
    // Get employee_id from authenticated user
    const created_by_employee_id = req.user?.employee_id || null;
    
    // Auto-generate prebooking code by finding the next available number
    const lastPreBooking = await pool.query(`
      SELECT prebooking_code FROM pre_booking 
      WHERE prebooking_code ~ '^PRE[0-9]+$'
      ORDER BY CAST(SUBSTRING(prebooking_code FROM 4) AS INTEGER) DESC 
      LIMIT 1
    `);
    
    let nextNumber = 1;
    if (lastPreBooking.rows.length > 0 && lastPreBooking.rows[0].prebooking_code) {
      const lastCode = lastPreBooking.rows[0].prebooking_code;
      const lastNumber = parseInt(lastCode.substring(3));
      nextNumber = lastNumber + 1;
    }
    
    const prebooking_code = 'PRE' + nextNumber.toString().padStart(4, '0');
    
    const { rows } = await pool.query(
      `INSERT INTO pre_booking (
        guest_id, capacity, prebooking_method, expected_check_in, expected_check_out,
        room_id, created_by_employee_id, prebooking_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [guest_id, capacity, prebooking_method, expected_check_in, expected_check_out, room_id, created_by_employee_id, prebooking_code]
    );
    
    res.status(201).json({ pre_booking: rows[0] });
  } catch (err) {
    console.error('Create pre-booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listPreBookings,
  getPreBookingById,
  createPreBooking,
};
