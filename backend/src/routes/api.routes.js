/**
 * Comprehensive API Routes for SkyNest Hotel
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireStaff } = require('../middleware/rbac');
const { pool } = require('../db');

// Controllers (only those that work with actual database)
const authController = require('../controllers/auth.controller');
const bookingController = require('../controllers/booking.controller');
const paymentController = require('../controllers/payment.controller');
const invoiceController = require('../controllers/invoice.controller');
const reportController = require('../controllers/report.controller');
const branchController = require('../controllers/branch.controller');
const emailController = require('../utils/email');
const housekeepingController = require('../controllers/housekeeping.controller');
const ratesController = require('../controllers/rates.controller');
const checkinController = require('../controllers/checkin.controller');
const checkoutController = require('../controllers/checkout.controller');
const roomAvailabilityController = require('../controllers/room-availability.controller');
const reportingDashboardsController = require('../controllers/reporting-dashboards.controller');
const serviceUsageController = require('../controllers/service-usage.controller');
const prebookingController = require('../controllers/prebooking.controller');
const customerPortalController = require('../controllers/customer-portal.controller');
const serviceController = require('../controllers/service.controller');
const guestController = require('../controllers/guest.controller');
const auditLogController = require('../controllers/auditlog.controller');

// Import booking routes for additional booking endpoints
const bookingRoutes = require('./booking.routes');

// ============================================================================
// AUTH ROUTES (Public)
// ============================================================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', requireAuth, authController.me);

// ============================================================================
// BOOKING ROUTES
// ============================================================================
// List bookings (with RBAC filtering)
router.get('/bookings', requireAuth, bookingController.listBookings);

// Group booking routes (must come before /:id routes)
router.use('/bookings', bookingRoutes);

// Get single booking with full details
router.get('/bookings/:id', requireAuth, bookingController.getBookingById);
router.get('/bookings/:id/full', requireAuth, bookingController.getBookingFull);

// Invoices
router.get('/bookings/:id/invoice', requireAuth, requireRole('Admin', 'Customer', 'Receptionist', 'Accountant', 'Manager'), invoiceController.generateInvoice);
router.get('/bookings/:id/invoice/html', requireAuth, requireRole('Admin', 'Customer', 'Receptionist', 'Accountant', 'Manager'), invoiceController.generateInvoiceHTML);

// Emails
router.post('/bookings/:id/send-confirmation', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), emailController.triggerBookingConfirmation);
router.post('/bookings/:id/send-invoice', requireAuth, requireRole('Admin', 'Accountant', 'Manager'), emailController.triggerInvoiceEmail);

// Create booking (Receptionist/Manager)
router.post('/bookings', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), bookingController.createBooking);
router.post('/bookings/with-payment', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), bookingController.createBookingWithPayment);

// Update booking status (Receptionist/Manager)
router.patch('/bookings/:id/status', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), bookingController.updateStatus);

// Check-in and check-out routes
router.post('/bookings/:id/checkin', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), async (req, res) => {
  try {
    const bookingId = req.params.id;
    req.body = { status: 'Checked-In' };
    req.params.id = bookingId;
    return bookingController.updateStatus(req, res);
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bookings/:id/checkout', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), async (req, res) => {
  try {
    const bookingId = req.params.id;
    req.body = { status: 'Checked-Out' };
    req.params.id = bookingId;
    return bookingController.updateStatus(req, res);
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// PAYMENT ROUTES
// ============================================================================
router.get('/payments', requireAuth, requireRole('Admin', 'Accountant', 'Manager'), paymentController.listPayments);
router.post('/payments', requireAuth, requireRole('Admin', 'Accountant', 'Manager'), paymentController.createPayment);
router.post('/payments/adjustment', requireAuth, requireRole('Admin', 'Accountant', 'Manager'), paymentController.createPaymentAdjustment);
router.get('/bookings/:id/payments', requireAuth, requireRole('Admin', 'Accountant', 'Manager'), paymentController.listPaymentsForBooking);
router.get('/bookings/:id/deposit-receipt', requireAuth, requireRole('Admin', 'Accountant', 'Manager'), paymentController.getDepositReceipt);

// ============================================================================
// SERVICE ROUTES
// ============================================================================
router.get('/services', requireAuth, requireStaff, serviceController.listServices);
router.post('/services', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { code, name, category, unit_price, tax_rate_percent, active = true } = req.body;
    
    // Validate required fields
    if (!name || !unit_price) {
      return res.status(400).json({ 
        error: 'service_name, service_type, and price are required',
        details: 'Missing required fields: name and unit_price'
      });
    }
    
    // Insert new service
    const result = await pool.query(`
      INSERT INTO service_catalog (code, name, category, unit_price, tax_rate_percent, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING service_id, code, name, category, unit_price, tax_rate_percent, active
    `, [code, name, category, parseFloat(unit_price), parseFloat(tax_rate_percent || 0), active]);
    
    res.status(201).json({ 
      message: 'Service created successfully',
      service: result.rows[0]
    });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/services/:id', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const serviceId = parseInt(id, 10);
    
    // Check if service exists
    const serviceCheck = await pool.query('SELECT service_id FROM service_catalog WHERE service_id = $1', [serviceId]);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if service has any usage records
    const usageCheck = await pool.query('SELECT COUNT(*) as count FROM service_usage WHERE service_id = $1', [serviceId]);
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete service with existing usage records',
        details: 'Please delete all service usage records first'
      });
    }
    
    // Delete the service
    const result = await pool.query('DELETE FROM service_catalog WHERE service_id = $1 RETURNING service_id, name', [serviceId]);
    
    res.json({ 
      message: 'Service deleted successfully',
      service: result.rows[0]
    });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Service routes are handled by service-payment controller

// Service usage
router.get('/service-usage', requireAuth, requireStaff, serviceUsageController.getServiceUsages);
router.post('/service-usage', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), serviceUsageController.createServiceUsage);
router.patch('/service-usage/:id', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), serviceUsageController.updateServiceUsage);
router.delete('/service-usage/:id', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), serviceUsageController.deleteServiceUsage);

// ============================================================================
// ROOM & AVAILABILITY ROUTES
// ============================================================================
router.get('/catalog/rooms', requireAuth, checkinController.getAvailableRooms);
router.get('/catalog/all-rooms', requireAuth, checkinController.getAllRooms);
router.get('/test/all-rooms', checkinController.getAllRooms); // Debug route without auth
router.get('/catalog/free-rooms', requireAuth, bookingController.listFreeRooms);
router.get('/catalog/room-types', requireAuth, checkinController.getRoomTypes);
router.get('/availability', requireAuth, roomAvailabilityController.getRoomAvailability);
router.post('/assign-room', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), roomAvailabilityController.assignRoomToBooking);

// Room CRUD operations
router.post('/rooms', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { room_type_id, branch_id, status = 'Available' } = req.body;
    
    if (!room_type_id || !branch_id) {
      return res.status(400).json({ error: 'room_type_id and branch_id are required' });
    }

    const result = await pool.query(
      `INSERT INTO room (room_id, room_type_id, branch_id, status) 
       VALUES (nextval('room_room_id_seq'), $1, $2, $3) 
       RETURNING *`,
      [room_type_id, branch_id, status]
    );

    return res.status(201).json({ room: result.rows[0] });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/rooms/:id', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { room_type_id, branch_id, status } = req.body;
    
    const result = await pool.query(
      `UPDATE room 
       SET room_type_id = COALESCE($1, room_type_id),
           branch_id = COALESCE($2, branch_id),
           status = COALESCE($3, status)
       WHERE room_id = $4 
       RETURNING *`,
      [room_type_id, branch_id, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.json({ room: result.rows[0] });
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/rooms/:id', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if room has any bookings
    const bookingCheck = await pool.query('SELECT COUNT(*) as count FROM booking WHERE room_id = $1', [id]);
    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete room with existing bookings',
        details: 'Please move or cancel all bookings for this room first'
      });
    }
    
    const result = await pool.query('DELETE FROM room WHERE room_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.json({ message: 'Room deleted successfully', room: result.rows[0] });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// BRANCH ROUTES
// ============================================================================
router.get('/branches', requireAuth, branchController.getBranches);
router.post('/branches', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { branch_name, branch_code, address, contact_number } = req.body;
    
    if (!branch_name || !branch_code) {
      return res.status(400).json({ error: 'branch_name and branch_code are required' });
    }

    const result = await pool.query(
      `INSERT INTO branch (branch_id, branch_name, branch_code, address, contact_number) 
       VALUES (nextval('branch_branch_id_seq'), $1, $2, $3, $4) 
       RETURNING *`,
      [branch_name, branch_code, address || null, contact_number || null]
    );

    return res.status(201).json({ branch: result.rows[0] });
  } catch (err) {
    console.error('Create branch error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      constraint: err.constraint
    });
  }
});

// Delete branch
router.delete('/branches/:id', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if branch has any bookings
    const bookingCheck = await pool.query('SELECT COUNT(*) as count FROM booking WHERE branch_id = $1', [id]);
    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete branch with existing bookings' });
    }
    
    // Check if branch has any rooms
    const roomCheck = await pool.query('SELECT COUNT(*) as count FROM room WHERE branch_id = $1', [id]);
    if (parseInt(roomCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete branch with existing rooms' });
    }
    
    const result = await pool.query('DELETE FROM branch WHERE branch_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error('Delete branch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// PREBOOKING ROUTES
// ============================================================================
router.get('/pre-bookings', requireAuth, requireStaff, prebookingController.listPreBookings);
router.post('/pre-bookings', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), prebookingController.createPreBooking);
router.get('/pre-bookings/:id', requireAuth, requireStaff, prebookingController.getPreBookingById);
router.put('/pre-bookings/:id', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), prebookingController.updatePreBooking);
router.delete('/pre-bookings/:id', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), prebookingController.deletePreBooking);
router.post('/pre-bookings/:id/convert', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), prebookingController.convertPreBookingToBooking);

// ============================================================================
// GUEST ROUTES
// ============================================================================
// Guest ID proof management routes
router.put('/guests/:guestId/id-proof', requireAuth, guestController.updateGuestIdProof);
router.get('/guests/:guestId/id-proof-status', requireAuth, guestController.getGuestIdProofStatus);

// ============================================================================
// CUSTOMER ROUTES
// ============================================================================
// Customer management routes are handled by customer-portal controller

// Customer portal routes
router.get('/customer/bookings', requireAuth, requireRole('Customer'), customerPortalController.getCustomerBookings);
router.get('/customer/bookings/:id', requireAuth, requireRole('Customer'), customerPortalController.getCustomerBookingDetails);
router.get('/customer/profile', requireAuth, requireRole('Customer'), customerPortalController.getCustomerProfile);
router.post('/customer/checkin', requireAuth, requireRole('Customer'), customerPortalController.processOnlineCheckIn);
router.post('/customer/checkout', requireAuth, requireRole('Customer'), customerPortalController.processOnlineCheckOut);
router.get('/customer/preferences', requireAuth, requireRole('Customer'), customerPortalController.getCustomerPreferences);
router.post('/customer/preferences', requireAuth, requireRole('Customer'), customerPortalController.addCustomerPreference);
router.patch('/customer/preferences/:id', requireAuth, requireRole('Customer'), customerPortalController.updateCustomerPreference);
router.delete('/customer/preferences/:id', requireAuth, requireRole('Customer'), customerPortalController.deleteCustomerPreference);
router.post('/customer/payment', requireAuth, requireRole('Customer'), customerPortalController.makeOnlinePayment);

// Staff routes for customer management
router.get('/customers', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    const query = `
      SELECT 
        c.customer_id,
        g.guest_id,
        g.full_name,
        g.email,
        g.phone,
        g.address,
        c.created_at
      FROM customer c
      JOIN guest g ON c.guest_id = g.guest_id
      ORDER BY g.full_name
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ============================================================================
// GUEST MANAGEMENT ROUTES (Core functionality)
// ============================================================================
router.get('/guests', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    const { page = 1, limit = 50 } = req.query;
    
    const p = Math.max(Number(page) || 1, 1);
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const offset = (p - 1) * lim;
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM guest');
    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total / lim);
    
    // Get paginated results
    const result = await pool.query(`
      SELECT 
        g.guest_id,
        g.full_name,
        g.email,
        g.phone,
        g.address,
        g.nationality,
        g.gender,
        g.date_of_birth,
        g.id_proof_type,
        g.id_proof_number,
        COUNT(DISTINCT b.booking_id) as total_bookings
      FROM guest g
      LEFT JOIN booking b ON b.guest_id = g.guest_id
      GROUP BY g.guest_id, g.full_name, g.email, g.phone, g.address, g.nationality, g.gender, g.date_of_birth, g.id_proof_type, g.id_proof_number
      ORDER BY g.full_name
      LIMIT $1 OFFSET $2
    `, [lim, offset]);
    
    res.json({
      guests: result.rows,
      total,
      page: p,
      totalPages
    });
  } catch (err) {
    console.error('Guests list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/guests', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), async (req, res) => {
  try {
    const { full_name, email, phone, address, nationality, gender, date_of_birth, id_proof_type, id_proof_number } = req.body;
    const { pool } = require('../db');
    
    const result = await pool.query(`
      INSERT INTO guest (full_name, email, phone, address, nationality, gender, date_of_birth, id_proof_type, id_proof_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [full_name, email, phone, address, nationality || null, gender || null, date_of_birth || null, id_proof_type || null, id_proof_number || null]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create guest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/guests/:id', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, address, nationality, gender, date_of_birth, id_proof_type, id_proof_number } = req.body;
    const { pool } = require('../db');
    
    const result = await pool.query(`
      UPDATE guest 
      SET full_name = $1, email = $2, phone = $3, address = $4, nationality = $5, gender = $6, date_of_birth = $7, id_proof_type = $8, id_proof_number = $9
      WHERE guest_id = $10
      RETURNING *
    `, [full_name, email, phone, address, nationality, gender, date_of_birth, id_proof_type, id_proof_number, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update guest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/guests/:id', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../db');
    
    // Check if guest has bookings
    const bookingCheck = await pool.query('SELECT COUNT(*) as count FROM booking WHERE guest_id = $1', [id]);
    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete guest with existing bookings' });
    }
    
    const result = await pool.query('DELETE FROM guest WHERE guest_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    res.json({ message: 'Guest deleted successfully' });
  } catch (err) {
    console.error('Delete guest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// HOUSEKEEPING MANAGEMENT ROUTES (Uses housekeeping.controller only)
// ============================================================================

// Get housekeeping board (derived room statuses)
router.get('/housekeeping/board', requireAuth, requireStaff, housekeepingController.board);

// Get valid status transitions for a room
router.get('/housekeeping/room/:room_id/transitions', requireAuth, requireStaff, housekeepingController.getValidStatusTransitions);

// Update room statuses automatically based on booking events
router.post('/housekeeping/update-statuses', requireAuth, requireStaff, housekeepingController.updateRoomStatusesAutomatically);

// Simple test route
router.get('/test/simple', (req, res) => {
  res.json({ message: "Test route working" });
});

// Test route without auth (temporary)
router.put('/test/rooms/:roomId/status', async (req, res) => {
  try {
    console.log('Test route called with:', req.params, req.body);
    const { roomId } = req.params;
    const { status } = req.body;
    const roomIdNum = parseInt(roomId, 10);

    console.log('Parsed values:', { roomIdNum, status });

    // Validate status
    const validStatuses = ['Available', 'Occupied', 'Maintenance', 'Reserved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        valid_statuses: validStatuses 
      });
    }

    console.log('Status validation passed');

    // Verify room exists
    const roomQuery = `
      SELECT room_id, room_number, status
      FROM room
      WHERE room_id = $1
    `;

    console.log('Executing room query with roomId:', roomIdNum);
    const roomRes = await pool.query(roomQuery, [roomIdNum]);
    console.log('Room query result:', roomRes.rows);
    
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Update room status
    const updateQuery = `
      UPDATE room
      SET status = $1
      WHERE room_id = $2
      RETURNING room_id, room_number, status
    `;

    console.log('Executing update query with:', { status, roomIdNum });
    const result = await pool.query(updateQuery, [status, roomIdNum]);
    console.log('Update query result:', result.rows);

    res.json({
      message: "Room status updated successfully",
      room: result.rows[0]
    });

  } catch (error) {
    console.error("Error updating room status:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Update room status (for housekeeping) with enhanced business logic
router.put('/rooms/:roomId/status', requireAuth, requireStaff, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, force = false } = req.body; // force parameter for emergency override
    const roomIdNum = parseInt(roomId, 10);

    // Validate status
    const validStatuses = ['Available', 'Occupied', 'Maintenance', 'Reserved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        valid_statuses: validStatuses 
      });
    }

    // Verify room exists and get current status
    const roomQuery = `
      SELECT room_id, room_number, status
      FROM room
      WHERE room_id = $1
    `;

    const roomRes = await pool.query(roomQuery, [roomIdNum]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    const currentStatus = roomRes.rows[0].status;

    // Enhanced business logic validation (unless force override)
    if (!force) {
      // Import the validation function from housekeeping controller
      const { validateStatusTransition } = require('../controllers/housekeeping.controller');
      
      // Get room data with booking information for validation
      const today = new Date().toISOString().slice(0, 10);
      const roomDataQuery = `
        SELECT r.room_id, r.room_number, r.status as room_status,
               b.booking_id, b.guest_id, b.status as booking_status,
               b.check_in_date, b.check_out_date,
               g.full_name AS guest_name
        FROM room r
        LEFT JOIN booking b ON b.room_id = r.room_id 
          AND daterange(b.check_in_date, b.check_out_date, '[)') && daterange($1::date, $1::date, '[)')
          AND b.status IN ('Booked','Checked-In')
        LEFT JOIN guest g ON g.guest_id = b.guest_id
        WHERE r.room_id = $2
      `;
      
      const roomDataRes = await pool.query(roomDataQuery, [today, roomIdNum]);
      const roomData = roomDataRes.rows[0];
      
      // Calculate derived status
      let derived = 'Available';
      if (roomData.booking_id) {
        const todayDate = new Date(today + 'T00:00:00Z');
        const outD = new Date(roomData.check_out_date);
        const isLastNight = outD.getTime() - todayDate.getTime() === 24 * 3600 * 1000;
        derived = roomData.booking_status === 'Checked-In' ? (isLastNight ? 'Due Out' : 'Stayover') : 'Arrival';
      }
      
      const roomDataWithDerived = { ...roomData, derived, booking: roomData.booking_id ? roomData : null };
      
      // Validate the status transition
      const validation = validateStatusTransition(currentStatus, status, roomDataWithDerived);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Status transition not allowed', 
          reason: validation.reason,
          suggestion: 'Use force=true for emergency override (Admin only)'
        });
      }
    }

    // Check if user has admin role for force override
    if (force && req.user?.role !== 'Admin') {
      return res.status(403).json({ 
        error: 'Emergency override requires Admin role' 
      });
    }

    // Update room status
    const updateQuery = `
      UPDATE room
      SET status = $1
      WHERE room_id = $2
      RETURNING room_id, room_number, status
    `;

    const result = await pool.query(updateQuery, [status, roomIdNum]);

    // Log audit trail with enhanced details
    await pool.query(`
      INSERT INTO audit_log (actor, action, entity, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user?.user_id || 'system',
      'UPDATE',
      'room',
      roomIdNum,
      JSON.stringify({
        status: status,
        previous_status: currentStatus,
        force_override: force,
        user_role: req.user?.role,
        timestamp: new Date().toISOString()
      })
    ]);

    res.json({
      message: force ? "Room status updated with emergency override" : "Room status updated successfully",
      room: result.rows[0],
      force_override: force
    });

  } catch (error) {
    console.error("Error updating room status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================================
// CHECK-IN/CHECK-OUT ROUTES
// ============================================================================
router.post('/checkin', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), checkinController.createCheckIn);
router.get('/checkin/:bookingId', requireAuth, requireStaff, checkinController.getCheckInRecord);
router.get('/rooms/available', requireAuth, requireStaff, checkinController.getAvailableRooms);
router.post('/rooms', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { room_number, room_type_id, branch_id, floor, status = 'Available' } = req.body;
    
    if (!room_number || !room_type_id || !branch_id) {
      return res.status(400).json({ error: 'room_number, room_type_id, and branch_id are required' });
    }

    const result = await pool.query(
      `INSERT INTO room (room_number, room_type_id, branch_id, floor, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [room_number, Number(room_type_id), Number(branch_id), floor || null, status]
    );

    return res.status(201).json({ room: result.rows[0] });
  } catch (err) {
    console.error('Create room error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/rooms/:roomId/conflicts', requireAuth, requireStaff, checkinController.getRoomConflicts);
router.put('/bookings/:bookingId/assign-room', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), checkinController.assignRoom);
router.get('/room-types', requireAuth, requireStaff, checkinController.getRoomTypes);
router.post('/room-types', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { room_type_name, base_rate, capacity, description } = req.body;
    
    if (!room_type_name || !base_rate || !capacity) {
      return res.status(400).json({ error: 'room_type_name, base_rate, and capacity are required' });
    }

    const result = await pool.query(
      `INSERT INTO room_type (name, daily_rate, capacity, amenities) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [room_type_name, Number(base_rate), Number(capacity), description || null]
    );

    return res.status(201).json({ room_type: result.rows[0] });
  } catch (err) {
    console.error('Create room type error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete room type
router.delete('/room-types/:id', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if room type has any rooms
    const roomCheck = await pool.query('SELECT COUNT(*) as count FROM room WHERE room_type_id = $1', [id]);
    if (parseInt(roomCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete room type with existing rooms' });
    }
    
    // Check if room type has any bookings
    const bookingCheck = await pool.query(`
      SELECT COUNT(*) as count FROM booking b 
      JOIN room r ON r.room_id = b.room_id 
      WHERE r.room_type_id = $1
    `, [id]);
    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete room type with existing bookings' });
    }
    
    const result = await pool.query('DELETE FROM room_type WHERE room_type_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room type not found' });
    }
    
    res.json({ message: 'Room type deleted successfully' });
  } catch (err) {
    console.error('Delete room type error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/checkout', requireAuth, requireRole('Admin', 'Receptionist', 'Manager'), checkoutController.processCheckout);
router.get('/checkout/:bookingId/folio', requireAuth, requireStaff, checkoutController.getFolioReview);
router.post('/checkout/auto-checkout-past', requireAuth, requireRole('Admin', 'Manager'), checkoutController.autoCheckoutPastBookings);

// ============================================================================
// RATES ROUTES
// ============================================================================
router.get('/rates/quote', requireAuth, ratesController.quote);

// ============================================================================
// REPORTING ROUTES
// ============================================================================
router.get('/reports/occupancy-by-day', requireAuth, requireStaff, reportController.occupancyByDay);
router.get('/reports/billing-summary', requireAuth, requireStaff, reportController.billingSummary);
router.get('/reports/service-usage-detail', requireAuth, requireStaff, reportController.serviceUsageDetail);
router.get('/reports/branch-revenue-monthly', requireAuth, requireStaff, reportController.branchRevenueMonthly);
router.get('/reports/service-monthly-trend', requireAuth, requireStaff, reportController.serviceMonthlyTrend);
router.get('/reports/arrivals-today', requireAuth, requireStaff, reportController.arrivalsToday);
router.get('/reports/departures-today', requireAuth, requireStaff, reportController.departuresToday);
router.get('/reports/in-house', requireAuth, requireStaff, reportController.inHouse);
router.get('/reports/detailed-bookings', requireAuth, requireStaff, reportController.detailedBookings);

// Dashboard reports
router.get('/reports/dashboard/kpis', requireAuth, requireStaff, reportingDashboardsController.getKPIsDashboard);
router.get('/reports/dashboard/occupancy-trends', requireAuth, requireStaff, reportingDashboardsController.getOccupancyTrends);
router.get('/reports/dashboard/revenue-analysis', requireAuth, requireStaff, reportingDashboardsController.getRevenueAnalysis);
router.get('/reports/dashboard/guest-analytics', requireAuth, requireStaff, reportingDashboardsController.getGuestAnalytics);
router.get('/reports/export', requireAuth, requireStaff, reportingDashboardsController.exportReportData);

// ============================================================================
// BOOKING ROUTES (Additional endpoints) - Already included above
// ============================================================================

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

// Get all users with their details
router.get('/users', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { rows: users } = await pool.query(`
      SELECT 
        ua.user_id,
        ua.username,
        ua.role,
        ua.guest_id,
        e.name as employee_name,
        e.email as employee_email,
        e.contact_no as employee_contact,
        e.branch_id,
        b.branch_name,
        g.full_name as guest_name,
        g.email as guest_email,
        g.phone as guest_phone
      FROM user_account ua
      LEFT JOIN employee e ON ua.user_id = e.user_id
      LEFT JOIN branch b ON e.branch_id = b.branch_id
      LEFT JOIN guest g ON ua.guest_id = g.guest_id
      ORDER BY ua.user_id DESC
    `);
    
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        ua.user_id,
        ua.username,
        ua.role,
        ua.guest_id,
        e.name as employee_name,
        e.email as employee_email,
        e.contact_no as employee_contact,
        e.branch_id,
        b.branch_name,
        g.full_name as guest_name,
        g.email as guest_email,
        g.phone as guest_phone
      FROM user_account ua
      LEFT JOIN employee e ON ua.user_id = e.user_id
      LEFT JOIN branch b ON e.branch_id = b.branch_id
      LEFT JOIN guest g ON ua.guest_id = g.guest_id
      WHERE ua.user_id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/users', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { username, password, role, branch_id, name, email, contact_no } = req.body;
    
    // Debug: Log the received data
    console.log('Received user creation data:', { username, password, role, branch_id, name, email, contact_no });
    
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password, and role are required' });
    }
    
    // Validate contact information for all roles
    if (!name || !email || !contact_no) {
      return res.status(400).json({ error: 'name, email, and contact_no are required for all user types' });
    }
    
    // Hash password (you should use bcrypt in production)
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create user account
      const { rows: userRows } = await client.query(`
        INSERT INTO user_account (user_id, username, password_hash, role)
        VALUES (nextval('user_account_user_id_seq'), $1, $2, $3)
        RETURNING user_id, username, role
      `, [username, password_hash, role]);
      
      const user = userRows[0];
      
      // If it's an employee role, create employee record
      if (['Admin', 'Manager', 'Receptionist', 'Accountant'].includes(role)) {
        await client.query(`
          INSERT INTO employee (employee_id, user_id, branch_id, name, email, contact_no)
          VALUES (nextval('employee_employee_id_seq'), $1, $2, $3, $4, $5)
        `, [user.user_id, branch_id || null, name || null, email || null, contact_no || null]);
      }
      
      // If it's a customer role, create guest record and link to user
      if (role === 'Customer') {
        const { rows: guestRows } = await client.query(`
          INSERT INTO guest (guest_id, full_name, email, phone)
          VALUES (nextval('guest_guest_id_seq'), $1, $2, $3)
          RETURNING guest_id
        `, [name || null, email || null, contact_no || null]);
        
        const guest = guestRows[0];
        
        // Update user_account to link to guest
        await client.query(`
          UPDATE user_account SET guest_id = $1 WHERE user_id = $2
        `, [guest.guest_id, user.user_id]);
      }
      
      await client.query('COMMIT');
      
      // Fetch the complete user data with guest_id
      const { rows: completeUserRows } = await client.query(`
        SELECT 
          ua.user_id,
          ua.username,
          ua.role,
          ua.guest_id,
          e.name as employee_name,
          e.email as employee_email,
          e.contact_no as employee_contact,
          e.branch_id,
          b.branch_name,
          g.full_name as guest_name,
          g.email as guest_email,
          g.phone as guest_phone
        FROM user_account ua
        LEFT JOIN employee e ON ua.user_id = e.user_id
        LEFT JOIN branch b ON e.branch_id = b.branch_id
        LEFT JOIN guest g ON ua.guest_id = g.guest_id
        WHERE ua.user_id = $1
      `, [user.user_id]);
      
      res.status(201).json({ user: completeUserRows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/users/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, branch_id, name, email, contact_no } = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update user account
      let updateQuery = 'UPDATE user_account SET username = $1, role = $2';
      let params = [username, role];
      let paramCount = 2;
      
      if (password) {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        updateQuery += `, password_hash = $${++paramCount}`;
        params.push(password_hash);
      }
      
      updateQuery += ` WHERE user_id = $${++paramCount}`;
      params.push(id);
      
      await client.query(updateQuery, params);
      
      // Update employee record if exists
      if (['Admin', 'Manager', 'Receptionist', 'Accountant'].includes(role)) {
        await client.query(`
          UPDATE employee 
          SET branch_id = $1, name = $2, email = $3, contact_no = $4
          WHERE user_id = $5
        `, [branch_id || null, name || null, email || null, contact_no || null, id]);
      }
      
      await client.query('COMMIT');
      res.json({ message: 'User updated successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete employee record first (if exists)
      await client.query('DELETE FROM employee WHERE user_id = $1', [id]);
      
      // Delete user account
      const { rows } = await client.query('DELETE FROM user_account WHERE user_id = $1 RETURNING *', [id]);
      
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }
      
      await client.query('COMMIT');
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all employees
router.get('/employees', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { rows: employees } = await pool.query(`
      SELECT 
        e.employee_id,
        e.user_id,
        e.branch_id,
        e.name,
        e.email,
        e.contact_no,
        b.branch_name,
        ua.username,
        ua.role
      FROM employee e
      JOIN user_account ua ON e.user_id = ua.user_id
      LEFT JOIN branch b ON e.branch_id = b.branch_id
      ORDER BY e.name
    `);
    
    res.json({ employees });
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================
router.get('/audit-logs', requireAuth, requireStaff, auditLogController.listAuditLogs);
router.get('/audit-logs/stats', requireAuth, requireStaff, auditLogController.getAuditLogStats);
router.get('/audit-logs/:id', requireAuth, requireStaff, auditLogController.getAuditLogById);
router.get('/audit-logs/export/csv', requireAuth, requireRole('Admin', 'Manager'), auditLogController.exportAuditLogs);

// ============================================================================
// HEALTH CHECK
// ============================================================================
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;