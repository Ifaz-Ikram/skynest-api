const { pool } = require('../db');
const { z } = require('zod');

// Zod schemas for validation
const onlineCheckInSchema = z.object({
  id_document_type: z.enum(['Passport', 'Driver License', 'National ID', 'Other']),
  id_document_number: z.string().min(1).max(50),
  id_document_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emergency_contact_name: z.string().min(1).max(100),
  emergency_contact_phone: z.string().min(1).max(20),
  special_requests: z.string().max(500).optional(),
  arrival_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  vehicle_plate: z.string().max(20).optional(),
  dietary_restrictions: z.string().max(200).optional(),
  accessibility_needs: z.string().max(200).optional(),
  agree_terms: z.boolean().refine(val => val === true, { message: "Must agree to terms and conditions" })
});

const onlineCheckOutSchema = z.object({
  checkout_method: z.enum(['Express', 'Standard']),
  receipt_email: z.string().email().optional(),
  receipt_sms: z.string().max(20).optional(),
  feedback_rating: z.number().int().min(1).max(5).optional(),
  feedback_comments: z.string().max(1000).optional(),
  future_stay_preferences: z.string().max(500).optional(),
  marketing_consent: z.boolean().default(false)
});

// Customer Bookings Management
async function getCustomerBookings(req, res) {
  try {
    const { status, upcoming, past } = req.query;
    
    let query = `
      SELECT 
        b.booking_id,
        b.check_in_date,
        b.check_out_date,
        b.booked_rate,
        b.status,
        b.confirmation_number,
        r.room_number,
        rt.name as room_type,
        rt.description as room_description,
        rt.max_occupancy,
        CASE 
          WHEN b.status = 'Confirmed' AND b.check_in_date > CURRENT_DATE THEN 'Upcoming'
          WHEN b.status IN ('Checked-In', 'Checked-Out') THEN 'Current/Past'
          ELSE 'Other'
        END as booking_category
      FROM booking b
      LEFT JOIN room r ON b.room_id = r.room_id
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE b.guest_id = $1
    `;
    
    const params = [req.user.guest_id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
    }
    
    if (upcoming === 'true') {
      query += ` AND b.status = 'Confirmed' AND b.check_in_date > CURRENT_DATE`;
    }
    
    if (past === 'true') {
      query += ` AND b.status IN ('Checked-In', 'Checked-Out') AND b.check_out_date < CURRENT_DATE`;
    }
    
    query += ` ORDER BY b.check_in_date DESC`;
    
    const result = await pool.query(query, params);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const bookings = result.rows.map(row => {
      const checkInMs = row.check_in_date ? new Date(row.check_in_date).setHours(0, 0, 0, 0) : null;
      const checkOutMs = row.check_out_date ? new Date(row.check_out_date).setHours(0, 0, 0, 0) : null;

      return {
        booking_id: row.booking_id,
        check_in_date: row.check_in_date,
        check_out_date: row.check_out_date,
        booked_rate: parseFloat(row.booked_rate),
        status: row.status,
        confirmation_number: row.confirmation_number,
        room_number: row.room_number,
        room_type: row.room_type,
        room_description: row.room_description,
        max_occupancy: parseInt(row.max_occupancy),
        booking_category: row.booking_category,
        can_checkin: row.status === 'Confirmed' && checkInMs !== null && checkInMs <= todayMs,
        can_checkout: row.status === 'Checked-In' && checkOutMs !== null && checkOutMs <= todayMs
      };
    });
    
    res.json(bookings);
    
  } catch (error) {
    console.error("Error getting customer bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getCustomerBookingDetails(req, res) {
  try {
    const { bookingId } = req.params;
    const bookingIdNum = parseInt(bookingId, 10);
    
    // Get booking details
    const bookingQuery = `
      SELECT 
        b.*,
        r.room_number,
        rt.name as room_type,
        rt.description as room_description,
        rt.max_occupancy,
        rt.amenities,
        COALESCE(g.full_name, 'Unknown Guest') as guest_name,
        COALESCE(g.email, '') as guest_email,
        COALESCE(g.phone, '') as guest_phone
      FROM booking b
      LEFT JOIN room r ON b.room_id = r.room_id
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      WHERE b.booking_id = $1 AND b.guest_id = $2
    `;
    const bookingRes = await pool.query(bookingQuery, [bookingIdNum, req.user.guest_id]);
    
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const booking = bookingRes.rows[0];
    
    // Get payments
    const paymentsQuery = `
      SELECT 
        payment_id,
        amount,
        payment_method,
        payment_reference,
        created_at as payment_date,
        status
      FROM payment
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `;
    const paymentsRes = await pool.query(paymentsQuery, [bookingIdNum]);
    
    // Get service usage
    const servicesQuery = `
      SELECT 
        su.service_usage_id,
        su.service_name,
        su.quantity,
        su.unit_price,
        (su.qty * su.unit_price_at_use) as total_amount,
        su.created_at,
        su.status
      FROM service_usage su
      WHERE su.booking_id = $1
      ORDER BY su.created_at DESC
    `;
    const servicesRes = await pool.query(servicesQuery, [bookingIdNum]);
    
    // Get check-in record if exists
    const checkinQuery = `
      SELECT 
        ci.checkin_id,
        ci.checkin_time,
        ci.id_document_type,
        ci.id_document_number,
        ci.special_requests,
        ci.arrival_time,
        ci.vehicle_plate,
        ci.dietary_restrictions,
        ci.accessibility_needs,
        ci.is_online_checkin
      FROM checkin ci
      WHERE ci.booking_id = $1
    `;
    const checkinRes = await pool.query(checkinQuery, [bookingIdNum]);
    
    // Calculate totals
    const totalPayments = paymentsRes.rows.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0);
    const totalServices = servicesRes.rows.reduce((sum, service) => 
      sum + parseFloat(service.total_amount), 0);
    const balance = parseFloat(booking.booked_rate) + totalServices - totalPayments;
    
    res.json({
      booking: {
        ...booking,
        booked_rate: parseFloat(booking.booked_rate),
        max_occupancy: parseInt(booking.max_occupancy)
      },
      payments: paymentsRes.rows.map(payment => ({
        ...payment,
        amount: parseFloat(payment.amount)
      })),
      services: servicesRes.rows.map(service => ({
        ...service,
        unit_price: parseFloat(service.unit_price),
        total_amount: parseFloat(service.total_amount)
      })),
      checkin: checkinRes.rows[0] || null,
      totals: {
        room_rate: parseFloat(booking.booked_rate),
        services_total: totalServices,
        payments_total: totalPayments,
        balance_due: balance
      }
    });
    
  } catch (error) {
    console.error("Error getting customer booking details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Online Check-In
async function processOnlineCheckIn(req, res) {
  try {
    const { bookingId } = req.params;
    const validatedData = onlineCheckInSchema.parse(req.body);
    
    const bookingIdNum = parseInt(bookingId, 10);
    
    // Verify booking belongs to customer
    const bookingQuery = `
      SELECT booking_id, status, check_in_date, guest_id
      FROM booking 
      WHERE booking_id = $1 AND guest_id = $2
    `;
    const bookingRes = await pool.query(bookingQuery, [bookingIdNum, req.user.guest_id]);
    
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const booking = bookingRes.rows[0];
    
    // Check if booking is eligible for online check-in
    if (booking.status !== 'Confirmed') {
      return res.status(400).json({ error: "Booking is not confirmed" });
    }
    
    if (new Date(booking.check_in_date) > new Date()) {
      return res.status(400).json({ error: "Check-in date has not arrived" });
    }
    
    // Check if already checked in
    const existingCheckinQuery = `
      SELECT checkin_id FROM checkin WHERE booking_id = $1
    `;
    const existingCheckinRes = await pool.query(existingCheckinQuery, [bookingIdNum]);
    
    if (existingCheckinRes.rows.length > 0) {
      return res.status(400).json({ error: "Already checked in" });
    }
    
    // Create check-in record
    const checkinQuery = `
      INSERT INTO checkin (
        booking_id, checkin_time, id_document_type, id_document_number,
        id_document_expiry, special_requests, arrival_time, vehicle_plate,
        dietary_restrictions, accessibility_needs, is_online_checkin,
        created_by, created_at
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW())
      RETURNING checkin_id
    `;
    
    const checkinRes = await pool.query(checkinQuery, [
      bookingIdNum,
      validatedData.id_document_type,
      validatedData.id_document_number,
      validatedData.id_document_expiry,
      validatedData.special_requests,
      validatedData.arrival_time,
      validatedData.vehicle_plate,
      validatedData.dietary_restrictions,
      validatedData.accessibility_needs,
      req.user.guest_id
    ]);
    
    // Update booking status
    const updateBookingQuery = `
      UPDATE booking 
      SET status = 'Checked-In', updated_at = NOW()
      WHERE booking_id = $1
    `;
    await pool.query(updateBookingQuery, [bookingIdNum]);
    
    res.json({
      success: true,
      message: "Online check-in completed successfully",
      checkin_id: checkinRes.rows[0].checkin_id,
      checkin_time: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error processing online check-in:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

// Online Check-Out
async function processOnlineCheckOut(req, res) {
  try {
    const { bookingId } = req.params;
    const validatedData = onlineCheckOutSchema.parse(req.body);
    
    const bookingIdNum = parseInt(bookingId, 10);
    
    // Verify booking belongs to customer
    const bookingQuery = `
      SELECT booking_id, status, check_out_date, guest_id
      FROM booking 
      WHERE booking_id = $1 AND guest_id = $2
    `;
    const bookingRes = await pool.query(bookingQuery, [bookingIdNum, req.user.guest_id]);
    
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const booking = bookingRes.rows[0];
    
    // Check if booking is eligible for online check-out
    if (booking.status !== 'Checked-In') {
      return res.status(400).json({ error: "Booking is not checked in" });
    }
    
    if (new Date(booking.check_out_date) > new Date()) {
      return res.status(400).json({ error: "Check-out date has not arrived" });
    }
    
    // Check if already checked out
    const existingCheckoutQuery = `
      SELECT checkout_id FROM checkout WHERE booking_id = $1
    `;
    const existingCheckoutRes = await pool.query(existingCheckoutQuery, [bookingIdNum]);
    
    if (existingCheckoutRes.rows.length > 0) {
      return res.status(400).json({ error: "Already checked out" });
    }
    
    // Get final folio
    const folioQuery = `
      SELECT 
        b.booked_rate as room_rate,
        COALESCE(SUM(su.qty * su.unit_price_at_use), 0) as services_total,
        COALESCE(SUM(p.amount), 0) as payments_total,
        b.booked_rate + COALESCE(SUM(su.qty * su.unit_price_at_use), 0) - COALESCE(SUM(p.amount), 0) as balance_due
      FROM booking b
      LEFT JOIN service_usage su ON b.booking_id = su.booking_id
      LEFT JOIN payment p ON b.booking_id = p.booking_id
      WHERE b.booking_id = $1
      GROUP BY b.booking_id, b.booked_rate
    `;
    const folioRes = await pool.query(folioQuery, [bookingIdNum]);
    
    const folio = folioRes.rows[0];
    const balanceDue = parseFloat(folio.balance_due);
    
    // Check if balance is zero for express checkout
    if (validatedData.checkout_method === 'Express' && balanceDue > 0) {
      return res.status(400).json({ 
        error: "Express checkout not available - balance due must be zero",
        balance_due: balanceDue
      });
    }
    
    // Create checkout record
    const checkoutQuery = `
      INSERT INTO checkout (
        booking_id, checkout_time, checkout_method, receipt_email,
        receipt_sms, feedback_rating, feedback_comments,
        future_stay_preferences, marketing_consent, is_online_checkout,
        created_by, created_at
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, true, $9, NOW())
      RETURNING checkout_id
    `;
    
    const checkoutRes = await pool.query(checkoutQuery, [
      bookingIdNum,
      validatedData.checkout_method,
      validatedData.receipt_email,
      validatedData.receipt_sms,
      validatedData.feedback_rating,
      validatedData.feedback_comments,
      validatedData.future_stay_preferences,
      validatedData.marketing_consent,
      req.user.guest_id
    ]);
    
    // Update booking status
    const updateBookingQuery = `
      UPDATE booking 
      SET status = 'Checked-Out', updated_at = NOW()
      WHERE booking_id = $1
    `;
    await pool.query(updateBookingQuery, [bookingIdNum]);
    
    // Generate receipt if requested
    let receiptData = null;
    if (validatedData.receipt_email || validatedData.receipt_sms) {
      receiptData = {
        checkout_id: checkoutRes.rows[0].checkout_id,
        booking_id: bookingIdNum,
        checkout_time: new Date().toISOString(),
        folio: {
          room_rate: parseFloat(folio.room_rate),
          services_total: parseFloat(folio.services_total),
          payments_total: parseFloat(folio.payments_total),
          balance_due: balanceDue
        }
      };
    }
    
    res.json({
      success: true,
      message: "Online check-out completed successfully",
      checkout_id: checkoutRes.rows[0].checkout_id,
      checkout_time: new Date().toISOString(),
      folio: {
        room_rate: parseFloat(folio.room_rate),
        services_total: parseFloat(folio.services_total),
        payments_total: parseFloat(folio.payments_total),
        balance_due: balanceDue
      },
      receipt: receiptData
    });
    
  } catch (error) {
    console.error("Error processing online check-out:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

// Customer Preferences Management
// NOTE: This feature requires the guest_preference table which is not yet implemented
async function getCustomerPreferences(req, res) {
  try {
    // Guest preferences feature not implemented - table doesn't exist in schema
    return res.json({
      preferences: [],
      message: 'Guest preferences feature not yet implemented. Requires guest_preference table.',
      feature_status: 'coming_soon'
    });
  } catch (error) {
    console.error("Error getting customer preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function addCustomerPreference(req, res) {
  try {
    // Guest preferences feature not implemented - table doesn't exist in schema
    return res.status(501).json({
      error: 'Feature not implemented',
      message: 'Guest preferences feature not yet implemented. Requires guest_preference table.',
      feature_status: 'coming_soon'
    });
  } catch (error) {
    console.error("Error adding customer preference:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateCustomerPreference(req, res) {
  try {
    // Guest preferences feature not implemented - table doesn't exist in schema
    return res.status(501).json({
      error: 'Feature not implemented',
      message: 'Guest preferences feature not yet implemented. Requires guest_preference table.',
      feature_status: 'coming_soon'
    });
  } catch (error) {
    console.error("Error updating customer preference:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteCustomerPreference(req, res) {
  try {
    // Guest preferences feature not implemented - table doesn't exist in schema
    return res.status(501).json({
      error: 'Feature not implemented',
      message: 'Guest preferences feature not yet implemented. Requires guest_preference table.',
      feature_status: 'coming_soon'
    });
  } catch (error) {
    console.error("Error deleting customer preference:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Online Payment
async function makeOnlinePayment(req, res) {
  try {
    const { booking_id, amount, payment_method, payment_reference } = req.body;
    
    if (!booking_id || !amount || !payment_method) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const bookingIdNum = parseInt(booking_id, 10);
    const paymentAmount = parseFloat(amount);
    
    // Verify booking belongs to customer
    const bookingQuery = `
      SELECT booking_id, status, guest_id
      FROM booking 
      WHERE booking_id = $1 AND guest_id = $2
    `;
    const bookingRes = await pool.query(bookingQuery, [bookingIdNum, req.user.guest_id]);
    
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const booking = bookingRes.rows[0];
    
    if (booking.status !== 'Checked-In') {
      return res.status(400).json({ error: "Payment can only be made for checked-in bookings" });
    }
    
    // Create payment record
    const paymentQuery = `
      INSERT INTO payment (
        booking_id, amount, payment_method, payment_reference,
        status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, 'Completed', $5, NOW())
      RETURNING payment_id
    `;
    
    const paymentRes = await pool.query(paymentQuery, [
      bookingIdNum,
      paymentAmount,
      payment_method,
      payment_reference,
      req.user.guest_id
    ]);
    
    res.json({
      success: true,
      message: "Payment processed successfully",
      payment_id: paymentRes.rows[0].payment_id,
      amount: paymentAmount,
      payment_method: payment_method,
      payment_date: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error processing online payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Customer Profile Management
async function getCustomerProfile(req, res) {
  try {
    const profileQuery = `
      SELECT 
        g.*,
        COUNT(b.booking_id) as total_stays,
        SUM(b.booked_rate) as total_spent,
        MAX(b.check_out_date) as last_stay_date,
        MIN(b.check_in_date) as first_stay_date,
        lp.membership_level,
        lp.current_points,
        lp.enrollment_date
      FROM guest g
      LEFT JOIN booking b ON g.guest_id = b.guest_id AND b.status IN ('Checked-In', 'Checked-Out')
      LEFT JOIN loyalty_program lp ON g.guest_id = lp.guest_id
      WHERE g.guest_id = $1
      GROUP BY g.guest_id, lp.membership_level, lp.current_points, lp.enrollment_date
    `;
    
    const result = await pool.query(profileQuery, [req.user.guest_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer profile not found" });
    }
    
    const profile = result.rows[0];
    
    res.json({
      guest_id: profile.guest_id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      guest_type: profile.guest_type,
      total_stays: parseInt(profile.total_stays),
      total_spent: parseFloat(profile.total_spent || 0),
      last_stay_date: profile.last_stay_date,
      first_stay_date: profile.first_stay_date,
      loyalty: {
        membership_level: profile.membership_level,
        current_points: parseInt(profile.current_points || 0),
        enrollment_date: profile.enrollment_date
      }
    });
    
  } catch (error) {
    console.error("Error getting customer profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getCustomerBookings,
  getCustomerBookingDetails,
  processOnlineCheckIn,
  processOnlineCheckOut,
  getCustomerPreferences,
  addCustomerPreference,
  updateCustomerPreference,
  deleteCustomerPreference,
  makeOnlinePayment,
  getCustomerProfile
};
