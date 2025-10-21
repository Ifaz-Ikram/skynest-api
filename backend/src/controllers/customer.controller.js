// backend/src/controllers/customer.controller.js
const { pool } = require('../db');
const { z } = require('zod');

// Validation schemas
const customerBookingSchema = z.object({
  room_type_id: z.number().int().positive(),
  check_in_date: z.string().date(),
  check_out_date: z.string().date(),
  guest_count: z.number().int().positive().max(10),
  special_requests: z.string().optional()
});

const customerProfileSchema = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email().max(150),
  phone: z.string().max(30),
  address: z.string().optional()
});

// Get customer profile
async function getCustomerProfile(req, res) {
  try {
    const customerId = req.user.user_id;
    
    const query = `
      SELECT 
        g.guest_id,
        g.full_name,
        g.email,
        g.phone,
        g.address,
        g.gender,
        g.date_of_birth,
        g.nationality,
        g.id_type,
        g.id_number,
        g.created_at
      FROM guest g
      JOIN customer c ON g.guest_id = c.guest_id
      WHERE c.user_id = $1
    `;
    
    const result = await pool.query(query, [customerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting customer profile:', error);
    res.status(500).json({ error: 'Failed to get customer profile' });
  }
}

// Update customer profile
async function updateCustomerProfile(req, res) {
  try {
    const customerId = req.user.user_id;
    const validatedData = customerProfileSchema.parse(req.body);
    
    const query = `
      UPDATE guest 
      SET full_name = $1, email = $2, phone = $3, address = $4
      WHERE guest_id = (
        SELECT guest_id FROM customer WHERE user_id = $5
      )
      RETURNING guest_id, full_name, email, phone, address
    `;
    
    const result = await pool.query(query, [
      validatedData.full_name,
      validatedData.email,
      validatedData.phone,
      validatedData.address,
      customerId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }
    
    res.json({ 
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ error: 'Failed to update customer profile' });
  }
}

// Get customer bookings
async function getCustomerBookings(req, res) {
  try {
    const customerId = req.user.user_id;
    
    const query = `
      SELECT 
        b.booking_id,
        b.check_in_date,
        b.check_out_date,
        b.status,
        b.booked_rate,
        b.advance_payment,
        COALESCE(r.room_number, 'Unknown Room') as room_number,
        COALESCE(rt.name, 'Unknown Type') as room_type_name,
        COALESCE(br.branch_name, 'Unknown Branch') as branch_name
      FROM booking b
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      JOIN customer c ON g.guest_id = c.guest_id
      LEFT JOIN room r ON b.room_id = r.room_id
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN branch br ON r.branch_id = br.branch_id
      WHERE c.user_id = $1
      ORDER BY b.check_in_date DESC
    `;
    
    const result = await pool.query(query, [customerId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting customer bookings:', error);
    res.status(500).json({ error: 'Failed to get customer bookings' });
  }
}

// Create customer booking
async function createCustomerBooking(req, res) {
  try {
    const customerId = req.user.user_id;
    const validatedData = customerBookingSchema.parse(req.body);
    
    const checkInDate = new Date(validatedData.check_in_date);
    const checkOutDate = new Date(validatedData.check_out_date);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Get room rate
    const roomQuery = `
      SELECT rt.daily_rate as base_rate, rt.room_type_id
      FROM room_type rt
      WHERE rt.room_type_id = $1
    `;
    const roomRes = await pool.query(roomQuery, [validatedData.room_type_id]);
    
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    const baseRate = parseFloat(roomRes.rows[0].base_rate);
    const totalAmount = baseRate * nights;

    // Find available room
    const availableRoomQuery = `
      SELECT r.room_id
      FROM room r
      WHERE r.room_type_id = $1 
        AND r.status = 'Available'
        AND r.room_id NOT IN (
          SELECT b.room_id 
          FROM booking b 
          WHERE (b.check_in_date <= $2 AND b.check_out_date > $2)
             OR (b.check_in_date < $3 AND b.check_out_date >= $3)
             OR (b.check_in_date >= $2 AND b.check_out_date <= $3)
        )
      LIMIT 1
    `;
    
    const availableRoomRes = await pool.query(availableRoomQuery, [
      validatedData.room_type_id,
      validatedData.check_in_date,
      validatedData.check_out_date
    ]);
    
    if (availableRoomRes.rows.length === 0) {
      return res.status(400).json({ error: 'No available rooms for selected dates' });
    }

    const roomId = availableRoomRes.rows[0].room_id;

    // Get guest ID
    const guestQuery = `
      SELECT guest_id FROM customer WHERE user_id = $1
    `;
    const guestRes = await pool.query(guestQuery, [customerId]);
    
    if (guestRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    const guestId = guestRes.rows[0].guest_id;

    // Create booking
    const bookingQuery = `
      INSERT INTO booking (
        guest_id, room_id, check_in_date, check_out_date, 
        booked_rate, advance_payment, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Booked')
      RETURNING booking_id
    `;
    
    const bookingRes = await pool.query(bookingQuery, [
      guestId,
      roomId,
      validatedData.check_in_date,
      validatedData.check_out_date,
      baseRate,
      totalAmount * 0.3 // 30% advance payment
    ]);

    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully',
      booking_id: bookingRes.rows[0].booking_id,
      total_amount: totalAmount,
      advance_payment: totalAmount * 0.3
    });

  } catch (error) {
    console.error('Error creating customer booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
}

// Get customer preferences (placeholder - preferences table not implemented)
async function getCustomerPreferences(req, res) {
  res.json({
    preferences: [],
    message: 'Preferences system not implemented in current database'
  });
}

// Update customer preferences (placeholder - preferences table not implemented)
async function updateCustomerPreferences(req, res) {
  res.status(501).json({ 
    error: 'Preferences system not implemented in current database',
    message: 'This feature requires guest_preference table'
  });
}

// Get customer notifications (placeholder - notifications table not implemented)
async function getCustomerNotifications(req, res) {
  res.json({
    notifications: [],
    message: 'Notifications system not implemented in current database'
  });
}

// Get customer loyalty data (placeholder - loyalty tables not implemented)
async function getCustomerLoyalty(req, res) {
  res.json({
    tier: 'Bronze',
    points: 0,
    total_stays: 0,
    last_stay: null,
    member_since: null,
    points_to_next: 1000,
    rewards: [],
    points_history: [],
    message: 'Loyalty system not implemented in current database'
  });
}

// Redeem customer reward (placeholder - loyalty tables not implemented)
async function redeemCustomerReward(req, res) {
  res.status(501).json({ 
    error: 'Loyalty system not implemented in current database',
    message: 'This feature requires loyalty_member and loyalty_reward tables'
  });
}

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerBookings,
  createCustomerBooking,
  getCustomerPreferences,
  updateCustomerPreferences,
  getCustomerNotifications,
  getCustomerLoyalty,
  redeemCustomerReward
};
