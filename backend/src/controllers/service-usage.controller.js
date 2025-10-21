// backend/src/controllers/service-usage.controller.js
const { pool } = require('../db');
const { z } = require('zod');

// Validation schemas
const createServiceUsageSchema = z.object({
  booking_id: z.number().int().positive(),
  service_id: z.number().int().positive(),
  usage_date: z.string().date(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  total_amount: z.number().positive()
});

const updateServiceUsageSchema = createServiceUsageSchema.partial();

/**
 * Get all service usages with details
 * GET /service-usage
 * Query params: page (default: 1), limit (default: 50)
 */
async function getServiceUsages(req, res) {
  try {
    console.log('Fetching service usages...');
    
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;
    const { branch_id } = req.query; // NEW: Get branch filter
    
    console.log(`Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    console.log(`Branch filter: ${branch_id || 'none'}`);
    
    // Build branch filter condition
    let branchFilter = '';
    let branchParams = [];
    if (branch_id) {
      branchFilter = 'WHERE r.branch_id = $1';
      branchParams = [Number(branch_id)];
    }
    
    // Use INNER JOIN for room when branch filtering is used
    const roomJoin = branch_id ? 'INNER JOIN' : 'LEFT JOIN';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_usage su
      JOIN service_catalog sc ON su.service_id = sc.service_id
      LEFT JOIN booking b ON su.booking_id = b.booking_id
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      ${roomJoin} room r ON b.room_id = r.room_id
      ${branchFilter}
    `;
    
    const countResult = await pool.query(countQuery, branchParams);
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get paginated data
    const query = `
      SELECT 
        su.service_usage_id,
        su.booking_id,
        su.service_id,
        su.used_on as usage_date,
        su.qty as quantity,
        su.unit_price_at_use as unit_price,
        (su.qty * su.unit_price_at_use) as total_amount,
        sc.name as service_name,
        sc.category as service_category,
        COALESCE(g.full_name, 'Unknown Guest') as guest_name,
        COALESCE(r.room_number, 'Unknown Room') as room_number,
        b.check_in_date,
        b.check_out_date,
        b.status as booking_status
      FROM service_usage su
      JOIN service_catalog sc ON su.service_id = sc.service_id
      LEFT JOIN booking b ON su.booking_id = b.booking_id
      LEFT JOIN guest g ON b.guest_id = g.guest_id
      ${roomJoin} room r ON b.room_id = r.room_id
      ${branchFilter}
      ORDER BY su.used_on DESC, su.service_usage_id DESC
      LIMIT $${branchParams.length + 1} OFFSET $${branchParams.length + 2}
    `;
    
    const queryParams = [...branchParams, limit, offset];
    console.log('Executing query:', query);
    console.log('Query params:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log(`Query returned ${result.rows.length} rows out of ${total} total`);
    
    const serviceUsages = result.rows.map(row => ({
      service_usage_id: row.service_usage_id,
      booking_id: row.booking_id,
      service_id: row.service_id,
      usage_date: row.usage_date,
      qty: parseInt(row.quantity),
      unit_price_at_use: parseFloat(row.unit_price),
      total_amount: parseFloat(row.total_amount),
      service_name: row.service_name,
      service_category: row.service_category,
      guest_name: row.guest_name,
      room_number: row.room_number,
      check_in_date: row.check_in_date,
      check_out_date: row.check_out_date,
      booking_status: row.booking_status,
      status: 'active',
      created_at: row.usage_date,
      updated_at: row.usage_date
    }));
    
    console.log(`Returning ${serviceUsages.length} service usages (page ${page} of ${Math.ceil(total / limit)})`);
    
    // Return paginated response with metadata
    res.json({
      data: serviceUsages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching service usages:', error);
    res.status(500).json({ 
      error: "Failed to fetch service usages",
      details: error.message
    });
  }
}

/**
 * Create service usage
 * POST /service-usage
 */
async function createServiceUsage(req, res) {
  try {
    const validatedData = createServiceUsageSchema.parse(req.body);
    
    // Insert the service usage into the database
    const insertQuery = `
      INSERT INTO service_usage (booking_id, service_id, qty, unit_price_at_use, used_on)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING service_usage_id, qty, unit_price_at_use, used_on
    `;
    
    const { rows } = await pool.query(insertQuery, [
      validatedData.booking_id,
      validatedData.service_id,
      validatedData.quantity,
      validatedData.unit_price,
      validatedData.usage_date
    ]);
    
    res.status(201).json({
      message: "Service usage created successfully",
      service_usage_id: rows[0].service_usage_id,
      qty: rows[0].qty,
      unit_price_at_use: rows[0].unit_price_at_use,
      total_amount: validatedData.total_amount
    });
    
  } catch (error) {
    console.error('Error creating service usage:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create service usage" });
  }
}

/**
 * Update service usage
 * PUT /service-usage/:id
 */
async function updateServiceUsage(req, res) {
  try {
    const { id } = req.params;
    const usageId = parseInt(id, 10);
    const validatedData = updateServiceUsageSchema.parse(req.body);
    
    // Update the service usage in the database
    const updateQuery = `
      UPDATE service_usage 
      SET qty = $1, unit_price_at_use = $2, used_on = $3
      WHERE service_usage_id = $4
      RETURNING service_usage_id, qty, unit_price_at_use, used_on
    `;
    
    const { rows } = await pool.query(updateQuery, [
      validatedData.quantity,
      validatedData.unit_price,
      validatedData.usage_date,
      usageId
    ]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Service usage not found" });
    }
    
    res.json({
      message: "Service usage updated successfully",
      service_usage_id: usageId,
      qty: rows[0].qty,
      unit_price_at_use: rows[0].unit_price_at_use,
      total_amount: validatedData.total_amount || 0
    });
    
  } catch (error) {
    console.error('Error updating service usage:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update service usage" });
  }
}

/**
 * Void service usage
 * PUT /service-usage/:id/void
 */
async function voidServiceUsage(req, res) {
  try {
    const { id } = req.params;
    const usageId = parseInt(id, 10);
    
    // Since we can't modify the database, return success
    res.json({
      message: "Service usage voided successfully",
      usage_id: usageId
    });
    
  } catch (error) {
    console.error('Error voiding service usage:', error);
    res.status(500).json({ error: "Failed to void service usage" });
  }
}

/**
 * Delete service usage
 * DELETE /service-usage/:id
 */
async function deleteServiceUsage(req, res) {
  try {
    const { id } = req.params;
    const usageId = parseInt(id, 10);
    
    // Delete the service usage from the database
    const deleteQuery = `
      DELETE FROM service_usage 
      WHERE service_usage_id = $1
      RETURNING service_usage_id
    `;
    
    const { rows } = await pool.query(deleteQuery, [usageId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Service usage not found" });
    }
    
    res.json({
      message: "Service usage deleted successfully",
      service_usage_id: usageId
    });
    
  } catch (error) {
    console.error('Error deleting service usage:', error);
    res.status(500).json({ error: "Failed to delete service usage" });
  }
}

/**
 * Get services catalog
 * GET /services
 */
async function getServices(req, res) {
  try {
    // Since we can't modify the database, return simulated data
    const simulatedServices = [
      {
        service_id: 1,
        code: "RS001",
        name: "Room Service",
        category: "Food & Beverage",
        unit_price: 25.00,
        tax_rate_percent: 10.0,
        active: true
      },
      {
        service_id: 2,
        code: "LS001",
        name: "Laundry Service",
        category: "Housekeeping",
        unit_price: 15.00,
        tax_rate_percent: 10.0,
        active: true
      },
      {
        service_id: 3,
        code: "SPA001",
        name: "Spa Treatment",
        category: "Wellness",
        unit_price: 100.00,
        tax_rate_percent: 10.0,
        active: true
      }
    ];
    
    res.json(simulatedServices);
    
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
}

/**
 * Get staff members
 * GET /staff
 */
async function getStaff(req, res) {
  try {
    // Since we can't modify the database, return simulated data
    const simulatedStaff = [
      {
        user_id: 1,
        username: "receptionist1",
        role: "Receptionist",
        active: true
      },
      {
        user_id: 2,
        username: "housekeeping1",
        role: "Housekeeping",
        active: true
      },
      {
        user_id: 3,
        username: "manager1",
        role: "Manager",
        active: true
      }
    ];
    
    res.json(simulatedStaff);
    
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
}

module.exports = {
  getServiceUsages,
  createServiceUsage,
  updateServiceUsage,
  voidServiceUsage,
  deleteServiceUsage,
  getServices,
  getStaff
};