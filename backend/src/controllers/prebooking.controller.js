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
    const { from, to, branch_id } = req.query; // NEW: Add branch filter
    
    // First check if the new columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pre_booking' 
      AND column_name IN ('customer_id', 'room_type_id')
    `);
    
    const hasCustomerId = columnCheck.rows.some(row => row.column_name === 'customer_id');
    const hasRoomTypeId = columnCheck.rows.some(row => row.column_name === 'room_type_id');
    
    // Build the SELECT clause dynamically
    const selectFields = [
      'pb.pre_booking_id',
      'pb.guest_id',
      hasCustomerId ? 'pb.customer_id' : 'NULL as customer_id',
      hasRoomTypeId ? 'pb.room_type_id' : 'NULL as room_type_id',
      'g.full_name as customer_name',
      'g.email as guest_email',
      'g.phone as guest_phone',
      'pb.expected_check_in as check_in_date',
      'pb.expected_check_out as check_out_date',
      'pb.capacity as number_of_guests',
      'pb.prebooking_method',
      'r.room_number',
      'rt_assigned.name as assigned_room_type',
      hasRoomTypeId ? 'rt_requested.name as room_type_name' : 'NULL as room_type_name',
      'e.name as created_by_name',
      'pb.created_at',
      'COALESCE(pb.number_of_rooms, 1) as number_of_rooms',
      'COALESCE(pb.status, \'Pending\') as status',
      'pb.auto_cancel_date',
      'COALESCE(br_room.branch_id, (SELECT b.branch_id FROM branch b JOIN room r ON r.branch_id = b.branch_id WHERE r.room_type_id = pb.room_type_id LIMIT 1)) as branch_id',
      'COALESCE(br_room.branch_name, (SELECT b.branch_name FROM branch b JOIN room r ON r.branch_id = b.branch_id WHERE r.room_type_id = pb.room_type_id LIMIT 1)) as branch_name'
    ];
    
    // Build the JOIN clauses dynamically
    const joins = [
      'FROM pre_booking pb',
      'JOIN guest g ON g.guest_id = pb.guest_id'
    ];
    
    if (hasCustomerId) {
      joins.push('LEFT JOIN customer c ON c.customer_id = pb.customer_id');
    }
    
    joins.push('LEFT JOIN room r ON r.room_id = pb.room_id');
    joins.push('LEFT JOIN room_type rt_assigned ON rt_assigned.room_type_id = r.room_type_id');
    joins.push('LEFT JOIN branch br_room ON br_room.branch_id = r.branch_id');
    
    if (hasRoomTypeId) {
      joins.push('LEFT JOIN room_type rt_requested ON rt_requested.room_type_id = pb.room_type_id');
    }
    
    joins.push('LEFT JOIN employee e ON e.employee_id = pb.created_by_employee_id');
    
    let query = `
      SELECT ${selectFields.join(', ')}
      ${joins.join('\n      ')}
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
    if (branch_id) { // NEW: Add branch filtering
      params.push(Number(branch_id));
      query += ` AND r.branch_id = $${params.length}`;
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
 * Create a new pre-booking (Receptionist/Manager or Customer)
 */
async function createPreBooking(req, res) {
  let reservedRooms = [];
  try {
    const {
      customer_id,        // Who is making the booking (can be different from guest)
      room_type_id,       // Required: What type of room is needed
      capacity,
      number_of_rooms = 1, // NEW: Number of rooms needed
      prebooking_method,
      expected_check_in,
      expected_check_out,
      room_id = null,
      branch_id,          // NEW: Branch where pre-booking is made
      special_requests = '', // NEW: Special requests
      is_group_booking = false, // NEW: Whether it's a group booking
    } = req.body;
    
    // Check if new columns exist in database
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pre_booking' 
      AND column_name IN ('customer_id', 'room_type_id')
    `);
    
    const hasCustomerId = columnCheck.rows.some(row => row.column_name === 'customer_id');
    const hasRoomTypeId = columnCheck.rows.some(row => row.column_name === 'room_type_id');
    
    // Validation - adjust based on available columns
    const requiredFields = ['capacity', 'prebooking_method', 'expected_check_in', 'expected_check_out'];
    if (hasCustomerId) requiredFields.push('customer_id');
    if (hasRoomTypeId) requiredFields.push('room_type_id');
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Validate prebooking method
    const validMethods = ['Online', 'Phone', 'Walk-in'];
    if (!validMethods.includes(prebooking_method)) {
      return res.status(400).json({ 
        error: `Invalid prebooking_method. Must be one of: ${validMethods.join(', ')}` 
      });
    }
    
    let guest_id = null;
    
    // If customer_id column exists, verify customer and get guest_id
    if (hasCustomerId && customer_id) {
      const customerCheck = await pool.query(
        `SELECT c.customer_id, c.guest_id, g.full_name 
         FROM customer c 
         JOIN guest g ON g.guest_id = c.guest_id 
         WHERE c.customer_id = $1`,
        [customer_id]
      );
      
      if (customerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      guest_id = customerCheck.rows[0].guest_id;
    } else {
      // Fallback: use customer_id as guest_id for backward compatibility
      guest_id = customer_id;
    }
    
    // If room_type_id column exists, verify room type and check availability
    if (hasRoomTypeId && room_type_id) {
      const roomTypeCheck = await pool.query(
        `SELECT room_type_id FROM room_type WHERE room_type_id = $1`,
        [room_type_id]
      );
      
      if (roomTypeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Room type not found' });
      }
      
      // Check room availability for the requested dates and room type
      const availabilityCheck = await pool.query(`
        SELECT COUNT(*) as available_count
        FROM room r
        WHERE r.room_type_id = $1
        AND r.status = 'Available'
        AND NOT EXISTS (
          SELECT 1 FROM booking b 
          WHERE b.room_id = r.room_id 
          AND b.status IN ('Booked', 'Checked-In')
          AND (
            (b.check_in_date <= $2 AND b.check_out_date > $2) OR
            (b.check_in_date < $3 AND b.check_out_date >= $3) OR
            (b.check_in_date >= $2 AND b.check_out_date <= $3)
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM pre_booking pb
          WHERE pb.room_type_id = r.room_type_id
          AND pb.status IN ('Pending', 'Confirmed')
          AND pb.auto_cancel_date > CURRENT_DATE
          AND (
            (pb.expected_check_in <= $2 AND pb.expected_check_out > $2) OR
            (pb.expected_check_in < $3 AND pb.expected_check_out >= $3) OR
            (pb.expected_check_in >= $2 AND pb.expected_check_out <= $3)
          )
        )
      `, [room_type_id, expected_check_in, expected_check_out]);
      
      const availableCount = parseInt(availabilityCheck.rows[0].available_count);
      
      if (availableCount < number_of_rooms) {
        return res.status(400).json({ 
          error: `Not enough rooms available. Requested: ${number_of_rooms}, Available: ${availableCount}` 
        });
      }
    }
    
    // Reserve rooms for pre-booking (if room_type_id is specified)
    if (hasRoomTypeId && room_type_id && number_of_rooms > 0) {
      try {
        // Find available rooms to reserve
        const roomsToReserve = await pool.query(`
          SELECT r.room_id, r.room_number
          FROM room r
          WHERE r.room_type_id = $1
          AND r.status = 'Available'
          AND NOT EXISTS (
            SELECT 1 FROM booking b 
            WHERE b.room_id = r.room_id 
            AND b.status IN ('Booked', 'Checked-In')
            AND (
              (b.check_in_date <= $2 AND b.check_out_date > $2) OR
              (b.check_in_date < $3 AND b.check_out_date >= $3) OR
              (b.check_in_date >= $2 AND b.check_out_date <= $3)
            )
          )
          AND NOT EXISTS (
            SELECT 1 FROM pre_booking pb
            WHERE pb.room_type_id = r.room_type_id
            AND pb.status IN ('Pending', 'Confirmed')
            AND pb.auto_cancel_date > CURRENT_DATE
            AND (
              (pb.expected_check_in <= $2 AND pb.expected_check_out > $2) OR
              (pb.expected_check_in < $3 AND pb.expected_check_out >= $3) OR
              (pb.expected_check_in >= $2 AND pb.expected_check_out <= $3)
            )
          )
          LIMIT $4
        `, [room_type_id, expected_check_in, expected_check_out, number_of_rooms]);
        
        if (roomsToReserve.rows.length < number_of_rooms) {
          return res.status(400).json({ 
            error: `Only ${roomsToReserve.rows.length} room(s) available for reservation. Requested: ${number_of_rooms}` 
          });
        }
        
        // Reserve the rooms by updating their status to 'Reserved'
        const roomIds = roomsToReserve.rows.map(room => room.room_id);
        await pool.query(`
          UPDATE room 
          SET status = 'Reserved' 
          WHERE room_id = ANY($1)
        `, [roomIds]);
        
        reservedRooms = roomsToReserve.rows;
        console.log(`✅ Reserved ${reservedRooms.length} rooms for pre-booking:`, reservedRooms.map(r => r.room_number));
        
      } catch (error) {
        console.error('Failed to reserve rooms:', error);
        return res.status(500).json({ 
          error: 'Failed to reserve rooms for pre-booking' 
        });
      }
    }
    
    // Get employee_id from authenticated user
    const created_by_employee_id = req.user?.employee_id || null;
    
    // Build INSERT query based on available columns
    let insertQuery, insertParams;
    
    if (hasCustomerId && hasRoomTypeId) {
      // Full new schema with all new fields
      insertQuery = `
        INSERT INTO pre_booking (
          guest_id, customer_id, room_type_id, capacity, number_of_rooms, 
          prebooking_method, expected_check_in, expected_check_out, room_id, 
          branch_id, created_by_employee_id, special_requests, is_group_booking, 
          auto_cancel_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      insertParams = [
        guest_id, customer_id, room_type_id, capacity, number_of_rooms,
        prebooking_method, expected_check_in, expected_check_out, room_id, 
        branch_id, created_by_employee_id, special_requests, is_group_booking,
        new Date(new Date(expected_check_in).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days before check-in
      ];
    } else {
      // Legacy schema
      insertQuery = `
        INSERT INTO pre_booking (
          guest_id, capacity, prebooking_method, 
          expected_check_in, expected_check_out, room_id, created_by_employee_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      insertParams = [guest_id, capacity, prebooking_method, 
                     expected_check_in, expected_check_out, room_id, created_by_employee_id];
    }
    
    const { rows } = await pool.query(insertQuery, insertParams);
    
    // audit
    const { logAudit } = require('../middleware/audit');
    logAudit(req, { action: 'create_prebooking', entity: 'pre_booking', entityId: rows[0]?.pre_booking_id, details: rows[0] });
    
    res.status(201).json({ 
      pre_booking: rows[0],
      reserved_rooms: reservedRooms.map(r => ({ room_id: r.room_id, room_number: r.room_number }))
    });
  } catch (err) {
    console.error('Create pre-booking error:', err);
    
    // Release reserved rooms if pre-booking creation failed
    if (reservedRooms.length > 0) {
      try {
        const roomIds = reservedRooms.map(room => room.room_id);
        await pool.query(`
          UPDATE room 
          SET status = 'Available' 
          WHERE room_id = ANY($1)
        `, [roomIds]);
        console.log(`🔄 Released ${reservedRooms.length} reserved rooms due to pre-booking creation failure`);
      } catch (releaseError) {
        console.error('Failed to release reserved rooms:', releaseError);
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /pre-bookings/:id/convert
 * Convert pre-booking to full booking (Receptionist/Manager)
 */
async function convertPreBookingToBooking(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      guest_id, 
      room_id,           // For individual bookings
      room_type_id,      // For group bookings
      room_quantity,     // For group bookings
      group_name,        // For group bookings
      booked_rate, 
      tax_rate_percent = 10, 
      advance_payment = 0,
      is_group_booking = false
    } = req.body;
    
    // Debug logging
    console.log('=== CONVERT PRE-BOOKING BACKEND DEBUG ===');
    console.log('req.params.id:', id);
    console.log('req.body:', req.body);
    console.log('guest_id:', guest_id, 'type:', typeof guest_id);
    console.log('booked_rate:', booked_rate, 'type:', typeof booked_rate);
    console.log('is_group_booking:', is_group_booking);
    console.log('room_type_id:', room_type_id);
    console.log('room_quantity:', room_quantity);
    console.log('=== END BACKEND DEBUG ===');
    
    // Validation based on booking type
    if (!guest_id || !booked_rate) {
      console.log('Validation failed - guest_id:', guest_id, 'booked_rate:', booked_rate);
      return res.status(400).json({ 
        error: 'guest_id and booked_rate are required to convert pre-booking' 
      });
    }
    
    if (is_group_booking) {
      if (!room_type_id || !room_quantity) {
        return res.status(400).json({ 
          error: 'room_type_id and room_quantity are required for group bookings' 
        });
      }
    } else {
      if (!room_id) {
        return res.status(400).json({ 
          error: 'room_id is required for individual bookings' 
        });
      }
    }
    
    // 1. Get pre-booking details
    const preBookingResult = await client.query(
      `SELECT pb.*, rt.name as room_type_name, c.guest_id as customer_guest_id, g.full_name as customer_name
       FROM pre_booking pb
       LEFT JOIN room_type rt ON rt.room_type_id = pb.room_type_id
       LEFT JOIN customer c ON c.customer_id = pb.customer_id
       LEFT JOIN guest g ON g.guest_id = c.guest_id
       WHERE pb.pre_booking_id = $1`,
      [id]
    );
    
    if (preBookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pre-booking not found' });
    }
    
    const preBooking = preBookingResult.rows[0];
    
    // 2. Verify guest exists
    const guestCheck = await client.query(
      `SELECT guest_id, full_name FROM guest WHERE guest_id = $1`,
      [guest_id]
    );
    
    if (guestCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    // 3. Handle room availability check based on booking type
    if (is_group_booking) {
      // Group booking: Check if enough rooms of the specified type are available
      const availableRoomsQuery = `
        SELECT r.room_id, r.room_number, r.room_type_id, rt.name as room_type_name
        FROM room r
        JOIN room_type rt ON rt.room_type_id = r.room_type_id
        WHERE r.room_type_id = $1 
        AND r.status = 'Available'
        AND r.room_id NOT IN (
          SELECT DISTINCT b.room_id 
          FROM booking b 
          WHERE b.status IN ('Booked', 'Checked-In')
          AND (
            (b.check_in_date <= $2 AND b.check_out_date > $2) OR
            (b.check_in_date < $3 AND b.check_out_date >= $3) OR
            (b.check_in_date >= $2 AND b.check_out_date <= $3)
          )
        )
        ORDER BY r.room_number
        LIMIT $4
      `;
      
      const availableRoomsResult = await client.query(availableRoomsQuery, [
        room_type_id,
        preBooking.expected_check_in,
        preBooking.expected_check_out,
        room_quantity
      ]);
      
      if (availableRoomsResult.rows.length < room_quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Only ${availableRoomsResult.rows.length} room(s) of this type available. Need ${room_quantity} rooms.` 
        });
      }
      
      // Create multiple bookings for group
      const createdBookings = [];
      for (let i = 0; i < room_quantity; i++) {
        const room = availableRoomsResult.rows[i];
        const bookingResult = await client.query(
          `INSERT INTO booking (
            pre_booking_id, guest_id, room_id, check_in_date, check_out_date, 
            status, booked_rate, tax_rate_percent, advance_payment, group_name, is_group_booking
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            id,
            guest_id,
            room.room_id,
            preBooking.expected_check_in,
            preBooking.expected_check_out,
            'Booked',
            booked_rate,
            tax_rate_percent,
            advance_payment,
            group_name || `Group ${id}`,
            true  // is_group_booking = true for group bookings
          ]
        );
        createdBookings.push(bookingResult.rows[0]);
      }
      
      // Update pre-booking status to 'Converted'
      await client.query(
        `UPDATE pre_booking SET status = 'Converted' WHERE pre_booking_id = $1`,
        [id]
      );
      
      await client.query('COMMIT');
      
      return res.status(201).json({
        message: `Successfully converted pre-booking to group booking with ${room_quantity} rooms`,
        bookings: createdBookings,
        group_name: group_name || `Group ${id}`,
        total_rooms: room_quantity
      });
      
    } else {
      // Individual booking: Check single room availability
      const roomCheck = await client.query(
        `SELECT r.room_id, r.room_type_id, rt.name as room_type_name 
         FROM room r
         JOIN room_type rt ON rt.room_type_id = r.room_type_id
         WHERE r.room_id = $1 AND r.status = 'Available'`,
        [room_id]
      );
      
      if (roomCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Room is not available' });
      }
      
      // Verify room type matches pre-booking room type (if specified)
      if (preBooking.room_type_id && roomCheck.rows[0].room_type_id !== preBooking.room_type_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Room type mismatch. Pre-booking requested ${preBooking.room_type_name}, but selected room is ${roomCheck.rows[0].room_type_name}` 
        });
      }
      
      // Create single booking
      const bookingResult = await client.query(
        `INSERT INTO booking (
          pre_booking_id, guest_id, room_id, check_in_date, check_out_date, 
          status, booked_rate, tax_rate_percent, advance_payment, is_group_booking
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          id,
          guest_id,
          room_id,
          preBooking.expected_check_in,
          preBooking.expected_check_out,
          'Booked',
          booked_rate,
          tax_rate_percent,
          advance_payment,
          false  // is_group_booking = false for individual bookings
        ]
      );
      
      // Update pre-booking status to 'Converted'
      await client.query(
        `UPDATE pre_booking SET status = 'Converted' WHERE pre_booking_id = $1`,
        [id]
      );
      
      await client.query('COMMIT');
      
      return res.status(201).json({
        message: 'Successfully converted pre-booking to booking',
        booking: bookingResult.rows[0]
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Convert pre-booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

/**
 * PUT /pre-bookings/:id
 * Update an existing pre-booking (Admin/Receptionist/Manager)
 */
async function updatePreBooking(req, res) {
  try {
    const { id } = req.params;
    const {
      customer_id,
      room_type_id,
      capacity,
      number_of_rooms = 1,
      prebooking_method,
      expected_check_in,
      expected_check_out,
      room_id = null,
      branch_id,
      special_requests = '',
      is_group_booking = false,
    } = req.body;
    
    // Validation
    if (!customer_id || !room_type_id || !capacity || !expected_check_in || !expected_check_out) {
      return res.status(400).json({ 
        error: 'customer_id, room_type_id, capacity, expected_check_in, and expected_check_out are required' 
      });
    }
    
    // Check if pre-booking exists
    const existingPreBooking = await pool.query(
      `SELECT * FROM pre_booking WHERE pre_booking_id = $1`,
      [id]
    );
    
    if (existingPreBooking.rows.length === 0) {
      return res.status(404).json({ error: 'Pre-booking not found' });
    }
    
    // Update pre-booking
    const updateQuery = `
      UPDATE pre_booking SET
        customer_id = $1,
        room_type_id = $2,
        capacity = $3,
        number_of_rooms = $4,
        prebooking_method = $5,
        expected_check_in = $6,
        expected_check_out = $7,
        room_id = $8,
        branch_id = $9,
        special_requests = $10,
        is_group_booking = $11,
        auto_cancel_date = $12
      WHERE pre_booking_id = $13
      RETURNING *
    `;
    
    const autoCancelDate = new Date(new Date(expected_check_in).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const result = await pool.query(updateQuery, [
      customer_id,
      room_type_id,
      capacity,
      number_of_rooms,
      prebooking_method || 'Walk-in',
      expected_check_in,
      expected_check_out,
      room_id,
      branch_id,
      special_requests,
      is_group_booking,
      autoCancelDate,
      id
    ]);
    
    res.json({
      message: 'Pre-booking updated successfully',
      preBooking: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update pre-booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /pre-bookings/:id
 * Delete a pre-booking (Admin/Receptionist/Manager)
 */
async function deletePreBooking(req, res) {
  try {
    const { id } = req.params;
    
    // Check if pre-booking exists
    const existingPreBooking = await pool.query(
      `SELECT * FROM pre_booking WHERE pre_booking_id = $1`,
      [id]
    );
    
    if (existingPreBooking.rows.length === 0) {
      return res.status(404).json({ error: 'Pre-booking not found' });
    }
    
    // Check if pre-booking has been converted to a booking
    const convertedBooking = await pool.query(
      `SELECT booking_id FROM booking WHERE pre_booking_id = $1`,
      [id]
    );
    
    if (convertedBooking.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete pre-booking that has been converted to a booking' 
      });
    }
    
    const preBooking = existingPreBooking.rows[0];
    
    // Release reserved rooms before deleting pre-booking
    if (preBooking.room_type_id && preBooking.number_of_rooms > 0) {
      try {
        console.log(`🔄 Releasing ${preBooking.number_of_rooms} reserved room(s) for pre-booking #${id}...`);
        
        // Find and release reserved rooms for this pre-booking
        const reservedRooms = await pool.query(`
          SELECT r.room_id, r.room_number
          FROM room r
          WHERE r.room_type_id = $1
          AND r.status = 'Reserved'
          LIMIT $2
        `, [preBooking.room_type_id, preBooking.number_of_rooms]);
        
        if (reservedRooms.rows.length > 0) {
          const roomIds = reservedRooms.rows.map(room => room.room_id);
          await pool.query(`
            UPDATE room 
            SET status = 'Available' 
            WHERE room_id = ANY($1)
          `, [roomIds]);
          
          console.log(`✅ Released ${reservedRooms.rows.length} room(s): ${reservedRooms.rows.map(r => r.room_number).join(', ')}`);
        }
      } catch (error) {
        console.error('Failed to release reserved rooms:', error);
        // Continue with deletion even if room release fails
      }
    }
    
    // Delete pre-booking
    await pool.query(
      `DELETE FROM pre_booking WHERE pre_booking_id = $1`,
      [id]
    );
    
    res.json({
      message: 'Pre-booking deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete pre-booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listPreBookings,
  getPreBookingById,
  createPreBooking,
  updatePreBooking,
  deletePreBooking,
  convertPreBookingToBooking,
};
