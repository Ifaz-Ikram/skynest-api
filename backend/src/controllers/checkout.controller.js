const { pool } = require('../db');
const { z } = require('zod');

// Zod schemas for validation
const checkoutSchema = z.object({
  booking_id: z.number().int().positive(),
  final_payment_amount: z.number().min(0).optional(),
  payment_method: z.string().min(1).optional(),
  payment_reference: z.string().optional(),
  signature_data: z.string().optional(),
  additional_charges: z.array(z.object({
    description: z.string(),
    amount: z.number().min(0),
    department: z.string().optional()
  })).optional(),
  folio_split: z.object({
    guest_amount: z.number().min(0),
    company_amount: z.number().min(0).optional(),
    agency_amount: z.number().min(0).optional()
  }).optional(),
  notes: z.string().optional()
});

// Get comprehensive folio for checkout review
async function getFolioReview(req, res) {
  const { bookingId } = req.params;
  const { include_services, include_payments, include_adjustments } = req.query;

  console.log('=== getFolioReview called ===');
  console.log('bookingId param:', bookingId);
  console.log('Query params:', { include_services, include_payments, include_adjustments });
  console.log('User:', req.user);

  try {
    const bookingIdNum = parseInt(bookingId, 10);
    console.log('Parsed bookingId:', bookingIdNum);
    
    // Get booking details
    const bookingQuery = `
      SELECT 
        b.booking_id,
        b.advance_payment,
        b.booked_rate,
        b.tax_rate_percent,
        b.check_in_date,
        b.check_out_date,
        b.status,
        COALESCE(g.full_name, 'Unknown Guest') AS guest_name,
        g.email,
        g.phone,
        COALESCE(r.room_number, 'Unknown Room') AS room_number,
        COALESCE(rt.name, 'Unknown Room Type') AS room_type,
        COALESCE(rt.daily_rate, b.booked_rate) AS base_rate
      FROM booking b
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      LEFT JOIN room r ON b.room_id = r.room_id
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE b.booking_id = $1
    `;

    console.log('Executing booking query for booking_id:', bookingIdNum);
    const bookingRes = await pool.query(bookingQuery, [bookingIdNum]);
    console.log('Query result rows:', bookingRes.rows.length);
    
    if (bookingRes.rows.length === 0) {
      console.log('ERROR: Booking not found in database');
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];
    console.log('Found booking:', { booking_id: booking.booking_id, status: booking.status });
    
    // Check if booking is in a valid status for checkout
    if (booking.status !== 'Checked-In') {
      return res.status(400).json({ 
        error: "Booking must be checked in before checkout", 
        current_status: booking.status,
        booking_id: bookingIdNum
      });
    }

    // Calculate room charges
    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const roomCharges = nights * booking.booked_rate;
    const taxAmount = roomCharges * (booking.tax_rate_percent / 100);
    
    const folio = {
      booking: booking,
      charges: {
        room: {
          description: `${booking.room_type} - ${nights} nights`,
          amount: roomCharges,
          nights: nights,
          rate_per_night: booking.booked_rate
        },
        tax: {
          description: `Tax (${booking.tax_rate_percent}%)`,
          amount: taxAmount,
          rate: booking.tax_rate_percent
        }
      },
      payments: [],
      adjustments: [],
      services: [],
      totals: {
        charges: roomCharges + taxAmount,
        payments: 0,
        adjustments: 0,
        services: 0,
        balance: 0
      }
    };
    
    // Get services if requested
    if (include_services === 'true') {
      const servicesQuery = `
      SELECT 
          su.service_usage_id,
          su.qty AS quantity,
          su.unit_price_at_use AS unit_price,
          (su.qty * su.unit_price_at_use) AS total_amount,
          su.used_on AS created_at,
          COALESCE(sc.name, 'Unknown Service') AS service_name,
          sc.category
      FROM service_usage su
        LEFT JOIN service_catalog sc ON su.service_id = sc.service_id
      WHERE su.booking_id = $1
        ORDER BY su.used_on DESC
      `;
      
      const servicesRes = await pool.query(servicesQuery, [bookingIdNum]);
      folio.services = servicesRes.rows;
      folio.totals.services = servicesRes.rows.reduce((sum, service) => sum + parseFloat(service.total_amount || 0), 0);
    }
    
    // Get payments if requested
    if (include_payments === 'true') {
      const paymentsQuery = `
      SELECT 
          p.payment_id,
          p.amount,
          p.method AS payment_method,
          p.payment_reference,
          p.paid_at AS created_at
        FROM payment p
        WHERE p.booking_id = $1
        ORDER BY p.paid_at DESC
      `;
      
      const paymentsRes = await pool.query(paymentsQuery, [bookingIdNum]);
      folio.payments = paymentsRes.rows;
      folio.totals.payments = paymentsRes.rows.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    }
    
    // Get adjustments if requested
    if (include_adjustments === 'true') {
      const adjustmentsQuery = `
      SELECT 
          pa.adjustment_id,
          pa.amount,
          pa.type AS reason,
          pa.reference_note,
          pa.created_at
        FROM payment_adjustment pa
        WHERE pa.booking_id = $1
        ORDER BY pa.created_at DESC
      `;
      
      const adjustmentsRes = await pool.query(adjustmentsQuery, [bookingIdNum]);
      folio.adjustments = adjustmentsRes.rows;
      folio.totals.adjustments = adjustmentsRes.rows.reduce((sum, adj) => sum + parseFloat(adj.amount || 0), 0);
    }
    
    // Calculate final balance
    const totalCharges = folio.totals.charges + folio.totals.services;
    const totalPayments = folio.totals.payments + folio.totals.adjustments;
    folio.totals.balance = totalCharges - totalPayments;
    
    // Add advance payment to payments total
    if (booking.advance_payment > 0) {
      folio.totals.payments += parseFloat(booking.advance_payment);
      folio.totals.balance -= parseFloat(booking.advance_payment);
    }

    res.json(folio);
  } catch (error) {
    console.error("Error getting folio review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Process checkout with final payment and receipt
async function processCheckout(req, res) {
  try {
    const validatedData = checkoutSchema.parse(req.body);
    const { booking_id, final_payment_amount, payment_method, payment_reference, signature_data, additional_charges, folio_split, notes } = validatedData;
    
    // Start transaction
    await pool.query('BEGIN');

    try {
      // Get current booking status
      const bookingQuery = `
        SELECT status, check_out_date, room_id
        FROM booking
        WHERE booking_id = $1
      `;
      const bookingRes = await pool.query(bookingQuery, [booking_id]);
      
      if (bookingRes.rows.length === 0) {
        throw new Error("Booking not found");
      }
      
      const booking = bookingRes.rows[0];
      
      if (booking.status !== 'Checked-In') {
        throw new Error("Guest must be checked in before checkout");
    }

    // Add additional charges if any
      if (additional_charges && additional_charges.length > 0) {
        for (const charge of additional_charges) {
        const chargeQuery = `
            INSERT INTO service_usage (booking_id, service_id, used_on, qty, unit_price_at_use)
            VALUES ($1, $2, NOW(), 1, $3)
          `;
          
          // Use a generic service ID for additional charges (you might want to create a special service for this)
          await pool.query(chargeQuery, [booking_id, 1, charge.amount]);
        }
      }
      
      // Process final payment if amount > 0
      if (final_payment_amount && final_payment_amount > 0) {
        const paymentQuery = `
          INSERT INTO payment (booking_id, amount, method, paid_at, payment_reference)
          VALUES ($1, $2, $3, NOW(), $4)
        `;
        
        await pool.query(paymentQuery, [
          booking_id,
          final_payment_amount,
          payment_method || 'Cash',
          payment_reference || `CHECKOUT-${Date.now()}`
        ]);
      }
      
      // Update booking status to Checked-Out
    const updateBookingQuery = `
      UPDATE booking 
        SET status = 'Checked-Out'
        WHERE booking_id = $1
      `;
      await pool.query(updateBookingQuery, [booking_id]);
      
      // Set room status to Maintenance (for cleaning) and create housekeeping task
      const roomUpdateQuery = `
        UPDATE room 
        SET status = 'Maintenance'
        WHERE room_id = $1
      `;
      await pool.query(roomUpdateQuery, [booking.room_id]);
      
      // Note: Housekeeping task creation skipped - table doesn't exist in current schema
      // Room is set to Maintenance status for cleaning

      // Commit transaction
      await pool.query('COMMIT');
      const checkoutTime = new Date().toISOString();
      
      // Generate receipt data
      const receiptData = {
        booking_id: booking_id,
        checkout_time: checkoutTime,
        final_payment_amount: final_payment_amount || 0,
        payment_method: payment_method,
        payment_reference: payment_reference,
        signature_captured: !!signature_data,
        additional_charges: additional_charges || [],
        folio_split: folio_split || null,
        notes: notes
      };

    res.json({ 
      success: true, 
        message: "Checkout processed successfully",
        receipt_data: receiptData
    });
      
  } catch (error) {
    await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error("Error processing checkout:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

// Generate checkout receipt
async function generateCheckoutReceipt(req, res) {
  const { bookingId } = req.params;
  
  try {
    const bookingIdNum = parseInt(bookingId, 10);
    
    // Get checkout data
    // Meta feature removed - not in schema
    // const bookingMetaStore = require("../data/bookingMetaStore");
    // const checkoutData = await bookingMetaStore.getMeta(bookingIdNum, 'checkout');
    const checkoutData = null; // Meta feature disabled
    
    if (!checkoutData) {
      return res.status(404).json({ error: "Checkout data not found" });
    }
    
    // Get booking details for receipt
    const bookingQuery = `
      SELECT 
        b.booking_id,
        b.advance_payment,
        b.booked_rate,
        b.tax_rate_percent,
        b.check_in_date,
        b.check_out_date,
        b.actual_check_out_time,
        COALESCE(g.full_name, 'Unknown Guest') AS guest_name,
        g.email,
        g.phone,
        COALESCE(r.room_number, 'Unknown Room') AS room_number,
        COALESCE(rt.name, 'Unknown Room Type') AS room_type
      FROM booking b
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      LEFT JOIN room r ON b.room_id = r.room_id
      LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE b.booking_id = $1
    `;

    const bookingRes = await pool.query(bookingQuery, [bookingIdNum]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRes.rows[0];

    // Calculate totals
    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const roomCharges = nights * booking.booked_rate;
    const taxAmount = roomCharges * (booking.tax_rate_percent / 100);

    const receiptData = {
      booking: booking,
      checkout: checkoutData,
      charges: {
        room: roomCharges,
        tax: taxAmount,
        additional: checkoutData.additional_charges?.reduce((sum, charge) => sum + charge.amount, 0) || 0
      },
      payments: {
        advance: parseFloat(booking.advance_payment) || 0,
        final: checkoutData.final_payment_amount || 0
      },
      totals: {
        charges: roomCharges + taxAmount + (checkoutData.additional_charges?.reduce((sum, charge) => sum + charge.amount, 0) || 0),
        payments: (parseFloat(booking.advance_payment) || 0) + (checkoutData.final_payment_amount || 0),
        balance: 0
      }
    };
    
    receiptData.totals.balance = receiptData.totals.charges - receiptData.totals.payments;
    
    res.json(receiptData);
    
  } catch (error) {
    console.error("Error generating checkout receipt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Set room status to dirty after checkout
async function setRoomDirty(req, res) {
  try {
    const { roomId } = req.params;
    const roomIdNum = parseInt(roomId, 10);

    // Verify room exists
    const roomQuery = `
      SELECT room_id, room_number, status
      FROM room
      WHERE room_id = $1
    `;

    const roomRes = await pool.query(roomQuery, [roomIdNum]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Update room status to Maintenance (for cleaning)
    const updateQuery = `
      UPDATE room
      SET status = 'Maintenance', updated_at = NOW()
      WHERE room_id = $1
      RETURNING room_id, room_number, status
    `;

    const result = await pool.query(updateQuery, [roomIdNum]);

    // Log audit trail
    await pool.query(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, changes, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      req.user.user_id,
      'UPDATE',
      'room',
      roomIdNum,
      JSON.stringify({
        status: 'Maintenance',
        previous_status: roomRes.rows[0].status
      })
    ]);

    res.json({
      message: "Room status updated to Maintenance",
      room: result.rows[0]
    });

  } catch (error) {
    console.error("Error setting room to dirty:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Auto checkout past bookings
async function autoCheckoutPastBookings(req, res) {
  try {
    console.log('🔄 Manual auto checkout triggered...');
    
    // Find all bookings that should be checked out
    const pastBookingsQuery = `
      SELECT 
        b.booking_id,
        b.room_id,
        b.guest_id,
        b.check_out_date,
        COALESCE(g.full_name, 'Unknown Guest') AS guest_name,
        COALESCE(r.room_number, 'Unknown Room') AS room_number
      FROM booking b
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      LEFT JOIN room r ON b.room_id = r.room_id
      WHERE b.status = 'Checked-In'
        AND b.check_out_date < CURRENT_DATE
      ORDER BY b.check_out_date ASC
    `;
    
    const pastBookingsRes = await pool.query(pastBookingsQuery);
    const pastBookings = pastBookingsRes.rows;
    
    if (pastBookings.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No past bookings found that need checkout',
        processed_count: 0
      });
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    let processedCount = 0;
    const processedBookings = [];
    
    for (const booking of pastBookings) {
      try {
        // Update booking status to Checked-Out
        const updateBookingQuery = `
          UPDATE booking 
          SET status = 'Checked-Out'
          WHERE booking_id = $1
        `;
        await pool.query(updateBookingQuery, [booking.booking_id]);
        
        // Set room status to Maintenance (for cleaning)
        const updateRoomQuery = `
          UPDATE room 
          SET status = 'Maintenance'
          WHERE room_id = $1
        `;
        await pool.query(updateRoomQuery, [booking.room_id]);
        
        // Note: Housekeeping task creation skipped - table doesn't exist in current schema
        // Room is set to Maintenance status for cleaning
        
        processedBookings.push({
          booking_id: booking.booking_id,
          guest_name: booking.guest_name,
          room_number: booking.room_number,
          checkout_date: booking.check_out_date
        });
        
        processedCount++;
        
      } catch (error) {
        console.error(`Error processing booking #${booking.booking_id}:`, error);
      }
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      message: `Successfully checked out ${processedCount} past bookings`,
      processed_count: processedCount,
      processed_bookings: processedBookings
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error in auto checkout:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process auto checkout',
      details: error.message 
    });
  }
}

module.exports = {
  getFolioReview,
  processCheckout,
  generateCheckoutReceipt,
  setRoomDirty,
  autoCheckoutPastBookings
};
