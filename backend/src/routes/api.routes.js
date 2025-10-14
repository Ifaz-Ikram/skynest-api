/**
 * Comprehensive API Routes for SkyNest Hotel
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireStaff } = require('../middleware/rbac');

// Controllers
const authController = require('../controllers/auth.controller');
const bookingController = require('../controllers/booking.controller');
const servicePaymentController = require('../controllers/service-payment.controller');
const adminController = require('../controllers/admin.controller');
const invoiceController = require('../controllers/invoice.controller');
const emailController = require('../utils/email');


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

// Get single booking with full details
router.get('/bookings/:id', requireAuth, bookingController.getBookingById);
router.get('/bookings/:id/full', requireAuth, bookingController.getBookingFull);

// Create booking (Receptionist/Manager)
router.post('/bookings', requireAuth, requireRole('Receptionist', 'Manager'), bookingController.createBooking);
router.post('/bookings/with-payment', requireAuth, requireRole('Receptionist', 'Manager'), bookingController.createBookingWithPayment);

// Update booking status (Receptionist/Manager)
router.patch('/bookings/:id/status', requireAuth, requireRole('Receptionist', 'Manager'), bookingController.updateStatus);

// Check-in and check-out routes
router.post('/bookings/:id/checkin', requireAuth, requireRole('Receptionist', 'Manager'), async (req, res) => {
  try {
    const bookingId = req.params.id;
    // Update booking status to Checked-In
    req.body = { status: 'Checked-In' };
    req.params.id = bookingId;
    return bookingController.updateStatus(req, res);
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bookings/:id/checkout', requireAuth, requireRole('Receptionist', 'Manager'), async (req, res) => {
  try {
    const bookingId = req.params.id;
    // Update booking status to Checked-Out
    req.body = { status: 'Checked-Out' };
    req.params.id = bookingId;
    return bookingController.updateStatus(req, res);
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Room availability
router.get('/bookings/rooms/:roomId/availability', requireAuth, requireStaff, bookingController.roomAvailability);
router.get('/bookings/rooms/free', requireAuth, requireStaff, bookingController.listFreeRooms);

// ============================================================================
// SERVICE CATALOG & USAGE ROUTES
// ============================================================================
// Service catalog (public for browsing, CRUD for admin)
router.get('/service-catalog', requireAuth, servicePaymentController.listServiceCatalog);
router.post('/admin/service-catalog', requireAuth, requireRole('Admin'), adminController.createService);
router.put('/admin/service-catalog/:id', requireAuth, requireRole('Admin'), adminController.updateService);
router.delete('/admin/service-catalog/:id', requireAuth, requireRole('Admin'), adminController.deleteService);
router.get('/admin/service-catalog', requireAuth, requireRole('Admin'), adminController.adminListServices);

// Alias routes for frontend compatibility
router.get('/services', requireAuth, servicePaymentController.listServiceCatalog);

// Catalog routes for frontend
router.get('/catalog/services', requireAuth, servicePaymentController.listServiceCatalog);
router.get('/catalog/rooms', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    const result = await pool.query(`
      SELECT 
        r.room_id,
        r.branch_id,
        r.room_number,
        r.room_type_code,
        r.max_occupancy,
        r.daily_rate,
        r.current_status,
        b.branch_name,
        rt.type_desc as room_type_desc
      FROM room r
      JOIN branch b ON b.branch_id = r.branch_id
      LEFT JOIN room_type rt ON rt.type_code = r.room_type_code
      ORDER BY b.branch_name, r.room_number
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Catalog rooms error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/catalog/free-rooms', requireAuth, requireStaff, async (req, res) => {
  try {
    const { from, to } = req.query;
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT 
        r.room_id,
        r.branch_id,
        r.room_number,
        r.room_type_code,
        r.max_occupancy,
        r.daily_rate,
        r.current_status,
        b.branch_name,
        rt.type_desc as room_type_desc
      FROM room r
      JOIN branch b ON b.branch_id = r.branch_id
      LEFT JOIN room_type rt ON rt.type_code = r.room_type_code
      WHERE r.current_status = 'Available'
        AND NOT EXISTS (
          SELECT 1 FROM booking bk
          WHERE bk.room_id = r.room_id
            AND bk.status IN ('Booked', 'Checked-In')
            AND daterange(bk.check_in_date, bk.check_out_date, '[)') && daterange($1::date, $2::date, '[)')
        )
      ORDER BY b.branch_name, r.room_number
    `, [from || new Date().toISOString().split('T')[0], to || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Free rooms error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Service usage
router.get('/bookings/:id/services', requireAuth, servicePaymentController.getBookingServices);
router.post('/service-usage', requireAuth, requireRole('Receptionist', 'Manager'), servicePaymentController.createServiceUsage);

// Service usage list endpoint for frontend
router.get('/services/usage', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    const result = await pool.query(`
      SELECT 
        su.service_usage_id,
        su.booking_id,
        su.service_id,
        su.qty,
        su.unit_price_at_use,
        su.used_on,
        sc.name as service_name,
        sc.code as service_code,
        sc.category,
        b.booking_id
      FROM service_usage su
      JOIN service_catalog sc ON sc.service_id = su.service_id
      JOIN booking b ON b.booking_id = su.booking_id
      ORDER BY su.used_on DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Service usage list error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// PAYMENT & ADJUSTMENT ROUTES
// ============================================================================
router.get('/bookings/:id/payments', requireAuth, servicePaymentController.getBookingPayments);
router.post('/payments', requireAuth, requireRole('Receptionist', 'Accountant', 'Manager'), servicePaymentController.createPayment);

// Get all payments
router.get('/payments', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    const result = await pool.query(`
      SELECT 
        p.*,
        b.booking_id,
        g.full_name as guest_name,
        r.room_number,
        br.branch_name
      FROM payment p
      JOIN booking b ON b.booking_id = p.booking_id
      JOIN guest g ON g.guest_id = b.guest_id
      JOIN room r ON r.room_id = b.room_id
      JOIN branch br ON br.branch_id = r.branch_id
      ORDER BY p.paid_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/bookings/:id/adjustments', requireAuth, servicePaymentController.getBookingAdjustments);
router.post('/payment-adjustments', requireAuth, requireRole('Manager', 'Accountant'), servicePaymentController.createAdjustment);

// Alias routes for frontend compatibility
router.post('/payments/adjust', requireAuth, requireRole('Manager', 'Accountant'), servicePaymentController.createAdjustment);

// ============================================================================
// PRE-BOOKING ROUTES
// ============================================================================
const preBookingController = require('../controllers/prebooking.controller');
router.get('/pre-bookings', requireAuth, requireStaff, preBookingController.listPreBookings);
router.get('/pre-bookings/:id', requireAuth, requireStaff, preBookingController.getPreBookingById);
router.post('/pre-bookings', requireAuth, requireRole('Receptionist', 'Manager'), preBookingController.createPreBooking);

// Alias routes for frontend compatibility
router.get('/prebookings', requireAuth, requireStaff, preBookingController.listPreBookings);
router.get('/prebookings/:id', requireAuth, requireStaff, preBookingController.getPreBookingById);
router.post('/prebookings', requireAuth, requireRole('Receptionist', 'Manager'), preBookingController.createPreBooking);

// ============================================================================
// LOOKUPS & METADATA
// ============================================================================
// Get current user's persona (customer → guest, employee → branch)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const result = { user };
    
    // If customer, get guest details
    if (user.role === 'Customer' && user.guest_id) {
      const guestQ = await require('../db').pool.query(
        `SELECT * FROM guest WHERE guest_id = $1`,
        [user.guest_id]
      );
      result.guest = guestQ.rows[0] || null;
    }
    
    // If employee, get employee + branch details
    if (user.employee_id) {
      const empQ = await require('../db').pool.query(
        `SELECT e.*, b.branch_name, b.address as branch_address
         FROM employee e
         JOIN branch b ON b.branch_id = e.branch_id
         WHERE e.employee_id = $1`,
        [user.employee_id]
      );
      result.employee = empQ.rows[0] || null;
    }
    
    res.json(result);
  } catch (err) {
    console.error('Get /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Branches
router.get('/branches', requireAuth, adminController.listBranches);
router.get('/branches/:id/rooms', requireAuth, adminController.listBranchRooms);

// Alias routes for frontend compatibility
router.get('/admin/branches', requireAuth, adminController.listBranches);

// Branch CRUD operations
router.post('/admin/branches', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { branch_name, location, contact_number, manager_name } = req.body;
    const { pool } = require('../db');
    
    // Auto-generate branch code by finding the next available number
    const lastBranch = await pool.query(`
      SELECT branch_code FROM branch 
      WHERE branch_code ~ '^BRN[0-9]+$'
      ORDER BY CAST(SUBSTRING(branch_code FROM 4) AS INTEGER) DESC 
      LIMIT 1
    `);
    
    let nextNumber = 1;
    if (lastBranch.rows.length > 0) {
      const lastCode = lastBranch.rows[0].branch_code;
      const lastNumber = parseInt(lastCode.substring(3));
      nextNumber = lastNumber + 1;
    }
    
    const branch_code = 'BRN' + nextNumber.toString().padStart(3, '0');
    
    const result = await pool.query(`
      INSERT INTO branch (branch_name, address, contact_number, manager_name, branch_code)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [branch_name, location || '', contact_number || '', manager_name || '', branch_code]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create branch error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.put('/admin/branches/:id', requireAuth, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_name, location, contact_number, manager_name } = req.body;
    const { pool } = require('../db');
    
    // Don't allow updating branch_code - it's auto-generated and immutable
    const result = await pool.query(`
      UPDATE branch
      SET branch_name = $1, address = $2, contact_number = $3, manager_name = $4
      WHERE branch_id = $5
      RETURNING *
    `, [branch_name, location, contact_number, manager_name, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update branch error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.delete('/admin/branches/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../db');
    
    const result = await pool.query(`
      DELETE FROM branch WHERE branch_id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error('Delete branch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rooms
router.get('/rooms', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    const result = await pool.query(`
      SELECT 
        r.room_id,
        r.branch_id,
        r.room_number,
        r.room_type_code,
        r.max_occupancy,
        r.daily_rate,
        r.current_status,
        b.branch_name,
        rt.type_desc as room_type_desc
      FROM room r
      JOIN branch b ON b.branch_id = r.branch_id
      LEFT JOIN room_type rt ON rt.type_code = r.room_type_code
      ORDER BY b.branch_name, r.room_number
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Rooms list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Room Types
router.get('/room-types', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    const result = await pool.query(`
      SELECT 
        room_type_id,
        name,
        capacity,
        daily_rate,
        amenities
      FROM room_type
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Room types list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guests
router.get('/guests', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
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
    `);
    res.json(result.rows);
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

// ============================================================================
// REPORTS (Manager/Accountant)
// ============================================================================
const reportController = require('../controllers/report.controller');

// Existing reports (Sequelize-based)
router.get('/reports/occupancy-by-day', requireAuth, requireStaff, reportController.occupancyByDay);
router.get('/reports/billing-summary', requireAuth, requireStaff, reportController.billingSummary);
router.get('/reports/service-usage-detail', requireAuth, requireStaff, reportController.serviceUsageDetail);
router.get('/reports/branch-revenue-monthly', requireAuth, requireStaff, reportController.branchRevenueMonthly);
router.get('/reports/service-monthly-trend', requireAuth, requireStaff, reportController.serviceMonthlyTrend);
router.get('/reports/payments-ledger', requireAuth, requireStaff, reportController.paymentsLedger);
router.get('/reports/adjustments', requireAuth, requireStaff, reportController.adjustmentsLast);

// New dashboard-specific reports
// These will be created as simple wrappers or use existing views
router.get('/reports/occupancy', requireAuth, requireStaff, async (req, res) => {
  // This can reuse occupancy-by-day or create a new summary
  try {
    const { from, to } = req.query;
    const { pool } = require('../db');
    const { getNextNDays } = require('../utils/dates');
    
    const range = from && to ? { from, to } : getNextNDays(14);
    
    // Get total and occupied rooms per branch
    const result = await pool.query(`
      SELECT 
        b.branch_id,
        b.branch_name,
        COUNT(DISTINCT r.room_id) as total_rooms,
        COUNT(DISTINCT CASE 
          WHEN bk.status IN ('Booked', 'Checked-In')
            AND daterange(bk.check_in_date, bk.check_out_date, '[)') && daterange($1::date, $2::date, '[)')
          THEN bk.room_id 
        END) as occupied_rooms
      FROM branch b
      LEFT JOIN room r ON r.branch_id = b.branch_id
      LEFT JOIN booking bk ON bk.room_id = r.room_id
      GROUP BY b.branch_id, b.branch_name
      ORDER BY b.branch_name
    `, [range.from, range.to]);
    
    res.json({
      from: range.from,
      to: range.to,
      branches: result.rows,
    });
  } catch (err) {
    console.error('Occupancy report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/revenue', requireAuth, requireStaff, async (req, res) => {
  // Revenue snapshot for dashboard
  try {
    const { from, to } = req.query;
    const { pool } = require('../db');
    const { getLastNDays } = require('../utils/dates');
    
    const range = from && to ? { from, to } : getLastNDays(30);
    
    // Use the existing view or create aggregated query
    const result = await pool.query(`
      SELECT 
        DATE(day) as date,
        SUM(room_revenue) as room_revenue,
        SUM(service_revenue) as service_revenue
      FROM (
        SELECT 
          generate_series($1::date, $2::date, '1 day'::interval) as day,
          0::numeric as room_revenue,
          0::numeric as service_revenue
      ) dates
      LEFT JOIN LATERAL (
        SELECT SUM(b.booked_rate) as room_rev
        FROM booking b
        WHERE b.status IN ('Booked', 'Checked-In', 'Checked-Out')
          AND daterange(b.check_in_date, b.check_out_date, '[)') @> DATE(day)
      ) room ON true
      LEFT JOIN LATERAL (
        SELECT SUM(su.qty * su.unit_price_at_use) as svc_rev
        FROM service_usage su
        WHERE DATE(su.used_on) = DATE(day)
      ) svc ON true
      GROUP BY DATE(day)
      ORDER BY DATE(day)
    `, [range.from, range.to]);
    
    res.json({
      from: range.from,
      to: range.to,
      daily: result.rows,
    });
  } catch (err) {
    console.error('Revenue report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/top-services', requireAuth, requireStaff, async (req, res) => {
  // Top services by revenue/usage
  try {
    const { from, to, limit = 10 } = req.query;
    const { pool } = require('../db');
    const { getLastNDays } = require('../utils/dates');
    
    const range = from && to ? { from, to } : getLastNDays(30);
    
    const result = await pool.query(`
      SELECT 
        sc.service_id,
        sc.code,
        sc.name,
        sc.category,
        SUM(su.qty) as total_qty,
        SUM(su.qty * su.unit_price_at_use) as total_revenue
      FROM service_usage su
      JOIN service_catalog sc ON sc.service_id = su.service_id
      WHERE su.used_on BETWEEN $1 AND $2
      GROUP BY sc.service_id, sc.code, sc.name, sc.category
      ORDER BY total_revenue DESC
      LIMIT $3
    `, [range.from, range.to, parseInt(limit)]);
    
    res.json({
      from: range.from,
      to: range.to,
      services: result.rows,
    });
  } catch (err) {
    console.error('Top services report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Outstanding balances for Accountant
router.get('/reports/balances-due', requireAuth, requireRole('Accountant', 'Manager'), async (req, res) => {
  try {
    const { pool } = require('../db');
    
    // Use the billing view or calculate on the fly
    const result = await pool.query(`
      SELECT * FROM vw_billing_summary
      WHERE balance_due > 0.01
      ORDER BY balance_due DESC
    `);
    
    res.json({ outstanding: result.rows });
  } catch (err) {
    console.error('Balances due report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST handlers for reports (frontend uses POST with date range in body)
router.post('/reports/occupancy', requireAuth, requireStaff, async (req, res) => {
  try {
    const { from, to, start_date, end_date } = req.body;
    const { pool } = require('../db');
    const { getNextNDays } = require('../utils/dates');
    
    // Accept both from/to and start_date/end_date
    const fromDate = from || start_date;
    const toDate = to || end_date;
    const range = fromDate && toDate ? { from: fromDate, to: toDate } : getNextNDays(14);
    
    // Get total and occupied rooms per branch
    const result = await pool.query(`
      SELECT 
        b.branch_id,
        b.branch_name,
        COUNT(DISTINCT r.room_id) as total_rooms,
        COUNT(DISTINCT CASE 
          WHEN bk.status IN ('Booked', 'Checked-In')
            AND daterange(bk.check_in_date, bk.check_out_date, '[)') && daterange($1::date, $2::date, '[)')
          THEN bk.room_id 
        END) as occupied_rooms
      FROM branch b
      LEFT JOIN room r ON r.branch_id = b.branch_id
      LEFT JOIN booking bk ON bk.room_id = r.room_id
      GROUP BY b.branch_id, b.branch_name
      ORDER BY b.branch_name
    `, [range.from, range.to]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Occupancy report error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/reports/revenue', requireAuth, requireStaff, async (req, res) => {
  const { pool } = require('../db');
  const { from, to, start_date, end_date } = req.body;
  
  // Accept both from/to and start_date/end_date
  const fromDate = from || start_date || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
  const toDate = to || end_date || new Date().toISOString().split('T')[0];
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE(day) as date,
        COALESCE(room_rev, 0) as room_revenue,
        COALESCE(svc_rev, 0) as service_revenue,
        COALESCE(room_rev, 0) + COALESCE(svc_rev, 0) as total_revenue
      FROM (
        SELECT generate_series($1::date, $2::date, '1 day'::interval) as day
      ) dates
      LEFT JOIN LATERAL (
        SELECT SUM(b.booked_rate) as room_rev
        FROM booking b
        WHERE b.status IN ('Booked', 'Checked-In', 'Checked-Out')
          AND daterange(b.check_in_date, b.check_out_date, '[)') @> DATE(day)
      ) room ON true
      LEFT JOIN LATERAL (
        SELECT SUM(su.qty * su.unit_price_at_use) as svc_rev
        FROM service_usage su
        WHERE DATE(su.used_on) = DATE(day)
      ) svc ON true
      ORDER BY DATE(day)
    `, [fromDate, toDate]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Revenue report error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/reports/bookings', requireAuth, requireStaff, async (req, res) => {
  try {
    const { from, to, start_date, end_date } = req.body;
    const { pool } = require('../db');
    
    const fromDate = from || start_date || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const toDate = to || end_date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        b.*,
        g.full_name as guest_name,
        r.room_number,
        br.branch_name
      FROM booking b
      JOIN guest g ON g.guest_id = b.guest_id
      JOIN room r ON r.room_id = b.room_id
      JOIN branch br ON br.branch_id = r.branch_id
      WHERE b.check_in_date >= $1::date
        AND b.check_in_date <= $2::date
      ORDER BY b.check_in_date DESC
    `, [fromDate, toDate]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Bookings report error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/reports/payments', requireAuth, requireStaff, async (req, res) => {
  try {
    const { from, to, start_date, end_date } = req.body;
    const { pool } = require('../db');
    
    const fromDate = from || start_date || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const toDate = to || end_date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        p.payment_id,
        p.booking_id,
        p.amount,
        p.method as payment_method,
        p.paid_at as payment_date,
        p.payment_reference,
        g.full_name as guest_name,
        b.check_in_date,
        b.check_out_date,
        b.status as booking_status
      FROM payment p
      JOIN booking b ON b.booking_id = p.booking_id
      JOIN guest g ON g.guest_id = b.guest_id
      WHERE DATE(p.paid_at) >= $1::date
        AND DATE(p.paid_at) <= $2::date
      ORDER BY p.paid_at DESC
    `, [fromDate, toDate]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Payments report error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/reports/customers', requireAuth, requireStaff, async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT 
        g.guest_id,
        g.full_name,
        g.email,
        g.phone,
        COUNT(DISTINCT b.booking_id) as total_bookings,
        COALESCE(SUM(b.booked_rate), 0) as total_spent,
        MAX(b.check_in_date) as last_visit
      FROM guest g
      LEFT JOIN booking b ON b.guest_id = g.guest_id
      GROUP BY g.guest_id, g.full_name, g.email, g.phone
      ORDER BY total_bookings DESC, total_spent DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Customers report error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/reports/services', requireAuth, requireStaff, async (req, res) => {
  try {
    const { from, to, start_date, end_date } = req.body;
    const { pool } = require('../db');
    
    const fromDate = from || start_date || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const toDate = to || end_date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        sc.service_id,
        sc.code,
        sc.name,
        sc.category,
        SUM(su.qty) as total_qty,
        SUM(su.qty * su.unit_price_at_use) as total_revenue
      FROM service_usage su
      JOIN service_catalog sc ON sc.service_id = su.service_id
      WHERE su.used_on >= $1::date
        AND su.used_on <= $2::date
      GROUP BY sc.service_id, sc.code, sc.name, sc.category
      ORDER BY total_revenue DESC
    `, [fromDate, toDate]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Services report error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


// ============================================================================
// ADMIN/USER MANAGEMENT ROUTES
// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================
// Employee creation with role-based access control
// Admin can create: Admin, Manager, Receptionist, Accountant
// Manager can create: Manager, Receptionist, Accountant
router.post('/admin/employees', requireAuth, requireRole('Admin', 'Manager'), adminController.createEmployee);
router.get('/admin/allowed-roles', requireAuth, adminController.getAllowedRoles);

// Legacy user management (Admin and Manager can view users)
router.get('/users', requireAuth, requireRole('Admin', 'Manager'), adminController.listUsers);
router.post('/users', requireAuth, requireRole('Admin'), adminController.createUser);
router.patch('/users/:id/role', requireAuth, requireRole('Admin'), adminController.updateUserRole);

// Alias routes for frontend compatibility
router.get('/admin/users', requireAuth, requireRole('Admin', 'Manager'), adminController.listUsers);
router.post('/admin/users', requireAuth, requireRole('Admin'), adminController.createUser);

// ============================================================================
// INVOICE ROUTES (Customer, Receptionist, Accountant, Manager)
// ============================================================================
router.get('/bookings/:id/invoice', requireAuth, requireRole('Customer', 'Receptionist', 'Accountant', 'Manager'), invoiceController.generateInvoice);
router.get('/bookings/:id/invoice/html', requireAuth, requireRole('Customer', 'Receptionist', 'Accountant', 'Manager'), invoiceController.generateInvoiceHTML);

// Alias routes for frontend compatibility
router.post('/invoices/generate', requireAuth, requireRole('Receptionist', 'Accountant', 'Manager'), async (req, res) => {
  try {
    const { booking_id } = req.body;
    // Generate and return invoice for this booking
    await invoiceController.generateInvoice({ params: { id: booking_id } }, res);
  } catch (err) {
    console.error('Generate invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/invoices/:id/html', requireAuth, requireRole('Customer', 'Receptionist', 'Accountant', 'Manager'), async (req, res) => {
  try {
    const bookingId = req.params.id;
    // Forward to existing route
    req.params.id = bookingId;
    return invoiceController.generateInvoiceHTML(req, res);
  } catch (err) {
    console.error('Invoice HTML error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// EMAIL NOTIFICATION ROUTES (Receptionist, Manager, Accountant)
// ============================================================================
router.post('/bookings/:id/send-confirmation', requireAuth, requireRole('Receptionist', 'Manager'), emailController.triggerBookingConfirmation);
router.post('/bookings/:id/send-invoice', requireAuth, requireRole('Accountant', 'Manager'), emailController.triggerInvoiceEmail);

module.exports = router;

