/**
 * Service Usage, Payments & Adjustments Controller
 */

const { pool } = require('../db');
const { formatMoney } = require('../utils/money');
const { getToday } = require('../utils/dates');

/**
 * GET /service-catalog
 * List all active services
 */
async function listServiceCatalog(req, res) {
  try {
    const { active = 'true' } = req.query;
    
    let query = 'SELECT * FROM service_catalog WHERE 1=1';
    const params = [];
    
    if (active === 'true') {
      query += ' AND active = true';
    }
    
    query += ' ORDER BY category, name';
    
    const { rows } = await pool.query(query, params);
    res.json({ services: rows });
  } catch (err) {
    console.error('List service catalog error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /bookings/:id/services
 * Get all services used for a booking
 */
async function getBookingServices(req, res) {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT su.*, sc.name, sc.category, sc.tax_rate_percent,
        (su.qty * su.unit_price_at_use) as line_total
       FROM service_usage su
       JOIN service_catalog sc ON sc.service_id = su.service_id
       WHERE su.booking_id = $1
       ORDER BY su.used_on DESC, su.service_usage_id DESC`,
      [id]
    );
    
    const total = rows.reduce((sum, s) => sum + parseFloat(s.line_total || 0), 0);
    
    res.json({ 
      services: rows,
      total: formatMoney(total),
    });
  } catch (err) {
    console.error('Get booking services error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /service-usage
 * Record a service usage (Receptionist/Manager)
 */
async function createServiceUsage(req, res) {
  try {
    const {
      booking_id,
      service_id,
      used_on = getToday(),
      qty,
      unit_price_at_use,
    } = req.body;
    
    // Validation
    if (!booking_id || !service_id || !qty) {
      return res.status(400).json({ 
        error: 'Missing required fields: booking_id, service_id, qty' 
      });
    }
    
    // If unit_price_at_use not provided, get it from catalog
    let price = unit_price_at_use;
    if (!price) {
      const catalogQ = await pool.query(
        'SELECT unit_price FROM service_catalog WHERE service_id = $1',
        [service_id]
      );
      if (catalogQ.rows.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      price = catalogQ.rows[0].unit_price;
    }
    
    // Verify booking exists
    const bookingQ = await pool.query(
      'SELECT booking_id FROM booking WHERE booking_id = $1',
      [booking_id]
    );
    if (bookingQ.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO service_usage (booking_id, service_id, used_on, qty, unit_price_at_use)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking_id, service_id, used_on, qty, price]
    );
    
    res.status(201).json({ service_usage: rows[0] });
  } catch (err) {
    console.error('Create service usage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /bookings/:id/payments
 * Get all payments for a booking
 */
async function getBookingPayments(req, res) {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT * FROM payment 
       WHERE booking_id = $1 
       ORDER BY paid_at DESC, payment_id DESC`,
      [id]
    );
    
    const total = rows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    res.json({ 
      payments: rows,
      total: formatMoney(total),
    });
  } catch (err) {
    console.error('Get booking payments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /payments
 * Record a payment (Receptionist/Accountant)
 */
async function createPayment(req, res) {
  try {
    const {
      booking_id,
      amount,
      method,
      paid_at = new Date(),
      payment_reference,
    } = req.body;
    
    // Validation
    if (!booking_id || !amount || !method) {
      return res.status(400).json({ 
        error: 'Missing required fields: booking_id, amount, method' 
      });
    }
    
    // Validate payment method
    const validMethods = ['Cash', 'Card', 'Online', 'BankTransfer'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ 
        error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` 
      });
    }
    
    // Verify booking exists
    const bookingQ = await pool.query(
      'SELECT booking_id FROM booking WHERE booking_id = $1',
      [booking_id]
    );
    if (bookingQ.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO payment (booking_id, amount, method, paid_at, payment_reference)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking_id, amount, method, paid_at, payment_reference]
    );
    
    res.status(201).json({ payment: rows[0] });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /bookings/:id/adjustments
 * Get all payment adjustments for a booking
 */
async function getBookingAdjustments(req, res) {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT * FROM payment_adjustment 
       WHERE booking_id = $1 
       ORDER BY created_at DESC, adjustment_id DESC`,
      [id]
    );
    
    const total = rows.reduce((sum, a) => {
      const amt = parseFloat(a.amount || 0);
      // Refunds and chargebacks reduce hotel's net
      if (a.type === 'refund' || a.type === 'chargeback') {
        return sum + amt;
      }
      return sum - amt;
    }, 0);
    
    res.json({ 
      adjustments: rows,
      total: formatMoney(total),
    });
  } catch (err) {
    console.error('Get booking adjustments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /payment-adjustments
 * Record a payment adjustment (Manager/Accountant)
 */
async function createAdjustment(req, res) {
  try {
    const {
      booking_id,
      amount,
      type,
      reference_note,
    } = req.body;
    
    // Validation
    if (!booking_id || !amount || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: booking_id, amount, type' 
      });
    }
    
    // Validate adjustment type
    const validTypes = ['refund', 'chargeback', 'manual_adjustment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid adjustment type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    // Verify booking exists
    const bookingQ = await pool.query(
      'SELECT booking_id FROM booking WHERE booking_id = $1',
      [booking_id]
    );
    if (bookingQ.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO payment_adjustment (booking_id, amount, type, reference_note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [booking_id, amount, type, reference_note]
    );
    
    res.status(201).json({ adjustment: rows[0] });
  } catch (err) {
    console.error('Create adjustment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listServiceCatalog,
  getBookingServices,
  createServiceUsage,
  getBookingPayments,
  createPayment,
  getBookingAdjustments,
  createAdjustment,
};
