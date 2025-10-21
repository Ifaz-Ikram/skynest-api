const { pool } = require('../db');
const { z } = require('zod');

// Zod schemas for validation
const availabilityQuerySchema = z.object({
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  room_type_id: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional(),
  room_id: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional(),
  capacity: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional(),
  quantity: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional(),
  branch_id: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional(),
  exclude_booking_id: z.string().transform((val) => val ? parseInt(val, 10) : undefined).optional()
});

const roomAssignmentSchema = z.object({
  booking_id: z.number().int().positive(),
  room_id: z.number().int().positive(),
  reason: z.string().optional(),
  notes: z.string().optional()
});

// Get room availability for a date range
async function getRoomAvailability(req, res) {
  try {
    console.log('🔍 Availability request query:', req.query);
    const validatedData = availabilityQuerySchema.parse(req.query);
    console.log('✅ Validated data:', validatedData);
    const { check_in_date, check_out_date, room_type_id, room_id, quantity, branch_id, exclude_booking_id } = validatedData;
    
    // Convert dates
    const checkInDate = new Date(check_in_date);
    const checkOutDate = new Date(check_out_date);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: "Check-out date must be after check-in date" });
    }
    
    // Build the availability query
    let availabilityQuery = `
      SELECT 
        r.room_id,
        r.room_number,
        r.status as current_status,
        rt.room_type_id,
        rt.name as room_type_name,
        rt.daily_rate as base_rate,
        rt.capacity as max_occupancy,
        rt.amenities as description,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM booking b 
            WHERE b.room_id = r.room_id 
            AND b.status IN ('Booked', 'Checked-In')
            AND (
              (b.check_in_date <= $1 AND b.check_out_date > $1) OR
              (b.check_in_date < $2 AND b.check_out_date >= $2) OR
              (b.check_in_date >= $1 AND b.check_out_date <= $2)
            )
            ${exclude_booking_id ? `AND b.booking_id != $${excludeBookingParamIndex}` : ''}
          ) THEN 'Unavailable'
          WHEN EXISTS (
            SELECT 1 FROM pre_booking pb 
            WHERE pb.room_type_id = r.room_type_id 
            AND pb.status = 'Pending'
            AND pb.auto_cancel_date > CURRENT_DATE
            AND (
              (pb.expected_check_in <= $1 AND pb.expected_check_out > $1) OR
              (pb.expected_check_in < $2 AND pb.expected_check_out >= $2) OR
              (pb.expected_check_in >= $1 AND pb.expected_check_out <= $2)
            )
          ) THEN 'Pre-booked'
          WHEN r.status = 'Reserved' THEN 'Reserved'
          WHEN r.status IN ('Occupied', 'Maintenance') THEN 'Unavailable'
          ELSE 'Available'
        END as availability_status,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM booking b 
            WHERE b.room_id = r.room_id 
            AND b.status IN ('Booked', 'Checked-In')
            AND (
              (b.check_in_date <= $1 AND b.check_out_date > $1) OR
              (b.check_in_date < $2 AND b.check_out_date >= $2) OR
              (b.check_in_date >= $1 AND b.check_out_date <= $2)
            )
            ${exclude_booking_id ? `AND b.booking_id != $${excludeBookingParamIndex}` : ''}
          ) THEN (
            SELECT json_build_object(
              'booking_id', b.booking_id,
              'guest_name', COALESCE(g.full_name, 'Unknown Guest'),
              'check_in_date', b.check_in_date,
              'check_out_date', b.check_out_date,
              'status', b.status,
              'type', 'booking'
            )
            FROM booking b
            LEFT JOIN guest g ON b.guest_id = g.guest_id
            WHERE b.room_id = r.room_id 
            AND b.status IN ('Booked', 'Checked-In')
            AND (
              (b.check_in_date <= $1 AND b.check_out_date > $1) OR
              (b.check_in_date < $2 AND b.check_out_date >= $2) OR
              (b.check_in_date >= $1 AND b.check_out_date <= $2)
            )
            ${exclude_booking_id ? `AND b.booking_id != $${excludeBookingParamIndex}` : ''}
            ORDER BY b.check_in_date
            LIMIT 1
          )
          WHEN EXISTS (
            SELECT 1 FROM pre_booking pb 
            WHERE pb.room_type_id = r.room_type_id 
            AND pb.status = 'Pending'
            AND pb.auto_cancel_date > CURRENT_DATE
            AND (
              (pb.expected_check_in <= $1 AND pb.expected_check_out > $1) OR
              (pb.expected_check_in < $2 AND pb.expected_check_out >= $2) OR
              (pb.expected_check_in >= $1 AND pb.expected_check_out <= $2)
            )
          ) THEN (
            SELECT json_build_object(
              'pre_booking_id', pb.pre_booking_id,
              'customer_name', COALESCE(g.full_name, 'Unknown Customer'),
              'check_in_date', pb.expected_check_in,
              'check_out_date', pb.expected_check_out,
              'status', pb.status,
              'type', 'pre_booking',
              'auto_cancel_date', pb.auto_cancel_date
            )
            FROM pre_booking pb
            LEFT JOIN customer c ON c.customer_id = pb.customer_id
            LEFT JOIN guest g ON g.guest_id = c.guest_id
            WHERE pb.room_type_id = r.room_type_id 
            AND pb.status = 'Pending'
            AND pb.auto_cancel_date > CURRENT_DATE
            AND (
              (pb.expected_check_in <= $1 AND pb.expected_check_out > $1) OR
              (pb.expected_check_in < $2 AND pb.expected_check_out >= $2) OR
              (pb.expected_check_in >= $1 AND pb.expected_check_out <= $2)
            )
            ORDER BY pb.expected_check_in
            LIMIT 1
          )
          ELSE NULL
        END as conflicting_booking
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE 1=1
    `;
    
    const queryParams = [checkInDate, checkOutDate];
    let paramIndex = 3;
    let excludeBookingParamIndex = 0;
    
    if (room_type_id) {
      availabilityQuery += ` AND rt.room_type_id = $${paramIndex}`;
      queryParams.push(room_type_id);
      paramIndex++;
    }
    if (room_id) {
      availabilityQuery += ` AND r.room_id = $${paramIndex}`;
      queryParams.push(room_id);
      paramIndex++;
    }
    if (branch_id) {
      availabilityQuery += ` AND r.branch_id = $${paramIndex}`;
      queryParams.push(branch_id);
      paramIndex++;
    }
    if (exclude_booking_id) {
      excludeBookingParamIndex = paramIndex;
      queryParams.push(exclude_booking_id);
      paramIndex++;
    }
    
    availabilityQuery += ` ORDER BY r.room_number`;
    
    const availabilityRes = await pool.query(availabilityQuery, queryParams);
    
    console.log('🔍 Availability query result for room_id:', room_id);
    console.log('Query result rows:', availabilityRes.rows.length);
    if (availabilityRes.rows.length > 0) {
      console.log('First row:', availabilityRes.rows[0]);
    }
    
    // Group rooms by type only
    const groupedRooms = availabilityRes.rows.reduce((acc, room) => {
      const typeKey = room.room_type_name;
      
      if (!acc[typeKey]) {
        acc[typeKey] = {
          room_type_id: room.room_type_id,
          room_type_name: room.room_type_name,
          base_rate: room.base_rate,
          max_occupancy: room.max_occupancy,
          description: room.description,
          rooms: []
        };
      }
      
      acc[typeKey].rooms.push(room);
      
      return acc;
    }, {});
    
    // Calculate availability summary
    const summary = {
      total_rooms: availabilityRes.rows.length,
      available_rooms: availabilityRes.rows.filter(r => r.availability_status === 'Available').length,
      occupied_rooms: availabilityRes.rows.filter(r => r.availability_status === 'Occupied').length,
      unavailable_rooms: availabilityRes.rows.filter(r => r.availability_status === 'Unavailable').length,
      pre_booked_rooms: availabilityRes.rows.filter(r => r.availability_status === 'Pre-booked').length,
      reserved_rooms: availabilityRes.rows.filter(r => r.availability_status === 'Reserved').length,
      occupancy_rate: availabilityRes.rows.length > 0 ? 
        (availabilityRes.rows.filter(r => r.availability_status === 'Occupied').length / availabilityRes.rows.length * 100).toFixed(1) : 0
    };
    
    // Handle availability check based on whether it's a specific room or room type with quantity
    let isAvailable = false;
    let checkedRoom = null;
    
    if (room_id) {
      // Specific room check
      checkedRoom = availabilityRes.rows.find(room => room.room_id === room_id);
      isAvailable = checkedRoom ? checkedRoom.availability_status === 'Available' : false;
    } else if (room_type_id && quantity) {
      // Room type with quantity check
      const availableRoomsOfType = availabilityRes.rows.filter(room => 
        room.room_type_id === room_type_id && room.availability_status === 'Available'
      );
      isAvailable = availableRoomsOfType.length >= quantity;
      checkedRoom = availableRoomsOfType[0]; // Use first available room as reference
    } else if (room_type_id) {
      // Room type check without quantity
      const availableRoomsOfType = availabilityRes.rows.filter(room => 
        room.room_type_id === room_type_id && room.availability_status === 'Available'
      );
      isAvailable = availableRoomsOfType.length > 0;
      checkedRoom = availableRoomsOfType[0];
    }
    
    // Get suggestions based on booking type
    let suggestions = [];
    
    if (room_id) {
      // Individual booking suggestions - alternative rooms of same type
      suggestions = availabilityRes.rows.filter(room => 
        room.availability_status === 'Available' && 
        room.room_id !== room_id &&
        room.room_type_id === checkedRoom?.room_type_id
      ).map(room => ({
        room_id: room.room_id,
        room_number: room.room_number,
        room_type_name: room.room_type_name,
        daily_rate: room.base_rate,
        max_occupancy: room.max_occupancy,
        availability_status: room.availability_status
      }));
    } else if (room_type_id) {
      // Group booking suggestions - alternative room types with availability count
      const roomTypeGroups = availabilityRes.rows.reduce((acc, room) => {
        if (!acc[room.room_type_id]) {
          acc[room.room_type_id] = {
            room_type_id: room.room_type_id,
            room_type_name: room.room_type_name,
            daily_rate: room.base_rate,
            max_occupancy: room.max_occupancy,
            available_count: 0
          };
        }
        if (room.availability_status === 'Available') {
          acc[room.room_type_id].available_count++;
        }
        return acc;
      }, {});
      
      suggestions = Object.values(roomTypeGroups)
        .filter(type => type.available_count > 0 && type.room_type_id !== room_type_id)
        .map(type => ({
          room_type_id: type.room_type_id,
          room_type_name: type.room_type_name,
          daily_rate: type.daily_rate,
          max_occupancy: type.max_occupancy,
          available_count: type.available_count
        }));
    }

    const response = {
      available: isAvailable,
      suggestions: suggestions,
      summary,
      rooms_by_type: groupedRooms,
      raw_rooms: availabilityRes.rows,
      date_range: {
        check_in_date: check_in_date,
        check_out_date: check_out_date
      }
    };
    
    // Add available_rooms count for group bookings
    if (room_type_id && quantity) {
      const availableRoomsOfType = availabilityRes.rows.filter(room => 
        room.room_type_id === room_type_id && room.availability_status === 'Available'
      );
      response.available_rooms = availableRoomsOfType.length;
      response.requested_quantity = quantity;
    }
    
    console.log('🔍 Final availability response:', JSON.stringify(response, null, 2));
    
    res.json(response);
    
  } catch (error) {
    console.error("❌ Availability error:", error);
    if (error instanceof z.ZodError) {
      console.error("❌ Zod validation errors:", error.errors);
      return res.status(400).json({ 
        error: "Validation error", 
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get room timeline view for a specific room
async function getRoomTimeline(req, res) {
  const { roomId } = req.params;
  const { start_date, end_date } = req.query;
  
  try {
    const roomIdNum = parseInt(roomId, 10);
    
    // Default to next 30 days if no date range provided
    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Get room details
    const roomQuery = `
      SELECT 
        r.room_id,
        r.room_number,
        r.status,
        rt.name as room_type_name,
        rt.daily_rate as base_rate,
        rt.capacity as max_occupancy
      FROM room r
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_id = $1
    `;
    
    const roomRes = await pool.query(roomQuery, [roomIdNum]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    const room = roomRes.rows[0];
    
    // Get bookings for this room in the date range
    const bookingsQuery = `
      SELECT 
        b.booking_id,
        b.check_in_date,
        b.check_out_date,
        b.status,
        b.booked_rate,
        COALESCE(g.full_name, 'Unknown Guest') as guest_name,
        g.email,
        g.phone
      FROM booking b
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      WHERE b.room_id = $1
      AND (
        (b.check_in_date <= $2 AND b.check_out_date > $2) OR
        (b.check_in_date < $3 AND b.check_out_date >= $3) OR
        (b.check_in_date >= $2 AND b.check_out_date <= $3)
      )
      ORDER BY b.check_in_date
    `;
    
    const bookingsRes = await pool.query(bookingsQuery, [roomIdNum, startDate, endDate]);
    
    // Get maintenance tasks for this room
    const maintenanceQuery = `
      SELECT 
        ht.task_id,
        ht.task_type,
        ht.priority,
        ht.status,
        ht.scheduled_date,
        ht.estimated_duration,
        ht.notes
      FROM housekeeping_task ht
      WHERE ht.room_id = $1
      AND ht.scheduled_date BETWEEN $2 AND $3
      ORDER BY ht.scheduled_date
    `;
    
    const maintenanceRes = await pool.query(maintenanceQuery, [roomIdNum, startDate, endDate]);
    
    res.json({
      room: room,
      date_range: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      },
      bookings: bookingsRes.rows,
      maintenance_tasks: maintenanceRes.rows,
      timeline: {
        bookings: bookingsRes.rows.map(booking => ({
          id: booking.booking_id,
          type: 'booking',
          start: booking.check_in_date,
          end: booking.check_out_date,
          status: booking.status,
          guest_name: booking.guest_name,
          rate: booking.booked_rate
        })),
        maintenance: maintenanceRes.rows.map(task => ({
          id: task.task_id,
          type: 'maintenance',
          start: task.scheduled_date,
          end: task.scheduled_date,
          priority: task.priority,
          status: task.status,
          task_type: task.task_type,
          notes: task.notes
        }))
      }
    });
    
  } catch (error) {
    console.error("Error getting room timeline:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Assign room to booking with conflict checking
async function assignRoomToBooking(req, res) {
  try {
    const validatedData = roomAssignmentSchema.parse(req.body);
    const { booking_id, room_id, reason, notes } = validatedData;
    
    // Start transaction
    await pool.query('BEGIN');
    
    try {
      // Get booking details
      const bookingQuery = `
        SELECT 
          b.booking_id,
          b.check_in_date,
          b.check_out_date,
          b.status,
          COALESCE(g.full_name, 'Unknown Guest') as guest_name
        FROM booking b
        LEFT JOIN guest g ON b.guest_id = g.guest_id
        WHERE b.booking_id = $1
      `;
      
      const bookingRes = await pool.query(bookingQuery, [booking_id]);
      if (bookingRes.rows.length === 0) {
        throw new Error("Booking not found");
      }
      
      const booking = bookingRes.rows[0];
      
      // Check for conflicts
      const conflictQuery = `
        SELECT 
          b.booking_id,
          b.check_in_date,
          b.check_out_date,
          b.status,
          COALESCE(g.full_name, 'Unknown Guest') as guest_name,
          COALESCE(r.room_number, 'Unknown Room') as room_number
        FROM booking b
        LEFT JOIN guest g ON b.guest_id = g.guest_id
        LEFT JOIN room r ON b.room_id = r.room_id
        WHERE b.room_id = $1
        AND b.booking_id != $2
        AND b.status IN ('Booked', 'Checked-In')
        AND (
          (b.check_in_date <= $3 AND b.check_out_date > $3) OR
          (b.check_in_date < $4 AND b.check_out_date >= $4) OR
          (b.check_in_date >= $3 AND b.check_out_date <= $4)
        )
      `;
      
      const conflictRes = await pool.query(conflictQuery, [
        room_id,
        booking_id,
        booking.check_in_date,
        booking.check_out_date
      ]);
      
      if (conflictRes.rows.length > 0) {
        throw new Error(`Room conflict detected with booking ${conflictRes.rows[0].booking_id} (${conflictRes.rows[0].guest_name})`);
      }
      
      // Get current room assignment
      const currentRoomQuery = `
        SELECT room_id, room_number
        FROM room
        WHERE room_id = (SELECT room_id FROM booking WHERE booking_id = $1)
      `;
      const currentRoomRes = await pool.query(currentRoomQuery, [booking_id]);
      const currentRoom = currentRoomRes.rows[0];
      
      // Update booking with new room
      const updateQuery = `
        UPDATE booking 
        SET room_id = $1
        WHERE booking_id = $2
      `;
      await pool.query(updateQuery, [room_id, booking_id]);
      
      // Log the room change
      const auditQuery = `
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id, timestamp)
        VALUES ('booking', $1, 'room_assignment', $2, $3, $4, NOW())
      `;
      
      const oldValues = JSON.stringify({ room_id: currentRoom?.room_id, room_number: currentRoom?.room_number });
      const newValues = JSON.stringify({ room_id: room_id, reason: reason, notes: notes });
      
      await pool.query(auditQuery, [booking_id, oldValues, newValues, req.user.employee_id]);
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({
        success: true,
        message: "Room assigned successfully",
        booking_id: booking_id,
        room_id: room_id,
        previous_room: currentRoom,
        reason: reason,
        notes: notes
      });
      
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error("Error assigning room:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

// Get room upgrade suggestions
async function getRoomUpgradeSuggestions(req, res) {
  const { bookingId } = req.params;
  
  try {
    const bookingIdNum = parseInt(bookingId, 10);
    
    // Get current booking details
    const bookingQuery = `
      SELECT 
        b.booking_id,
        b.check_in_date,
        b.check_out_date,
        b.booked_rate,
        b.room_id,
        rt.room_type_id,
        rt.name as current_room_type,
        rt.base_rate as current_base_rate,
        rt.max_occupancy as current_max_occupancy
      FROM booking b
      JOIN room r ON b.room_id = r.room_id
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE b.booking_id = $1
    `;
    
    const bookingRes = await pool.query(bookingQuery, [bookingIdNum]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const booking = bookingRes.rows[0];
    
    // Get available room types that are upgrades
    const upgradeQuery = `
      SELECT 
        rt.room_type_id,
        rt.name as room_type_name,
        rt.daily_rate as base_rate,
        rt.capacity as max_occupancy,
        rt.amenities as description,
        COUNT(r.room_id) as available_rooms,
        MIN(r.room_number) as sample_room_number
      FROM room_type rt
      JOIN room r ON rt.room_type_id = r.room_type_id
      WHERE rt.base_rate > $1
      AND rt.max_occupancy >= $2
      AND NOT EXISTS (
        SELECT 1 FROM booking b2
        WHERE b2.room_id = r.room_id
        AND b2.status IN ('Booked', 'Checked-In')
        AND (
          (b2.check_in_date <= $3 AND b2.check_out_date > $3) OR
          (b2.check_in_date < $4 AND b2.check_out_date >= $4) OR
          (b2.check_in_date >= $3 AND b2.check_out_date <= $4)
        )
        AND b2.booking_id != $5
      )
      GROUP BY rt.room_type_id, rt.name, rt.base_rate, rt.max_occupancy, rt.amenities
      ORDER BY rt.base_rate ASC
    `;
    
    const upgradeRes = await pool.query(upgradeQuery, [
      booking.current_base_rate,
      booking.current_max_occupancy,
      booking.check_in_date,
      booking.check_out_date,
      bookingIdNum
    ]);
    
    const suggestions = upgradeRes.rows.map(upgrade => ({
      room_type_id: upgrade.room_type_id,
      room_type_name: upgrade.room_type_name,
      base_rate: upgrade.base_rate,
      max_occupancy: upgrade.max_occupancy,
      description: upgrade.description,
      available_rooms: parseInt(upgrade.available_rooms),
      sample_room_number: upgrade.sample_room_number,
      upgrade_amount: upgrade.base_rate - booking.current_base_rate,
      upgrade_percentage: ((upgrade.base_rate - booking.current_base_rate) / booking.current_base_rate * 100).toFixed(1)
    }));
    
    res.json({
      current_booking: booking,
      upgrade_suggestions: suggestions,
      total_suggestions: suggestions.length
    });
    
  } catch (error) {
    console.error("Error getting room upgrade suggestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getRoomAvailability,
  getRoomTimeline,
  assignRoomToBooking,
  getRoomUpgradeSuggestions
};
