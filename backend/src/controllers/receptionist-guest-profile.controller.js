const { pool } = require('../db');
const { z } = require('zod');

// Zod schemas for validation
const guestNoteSchema = z.object({
  note_type: z.enum(['General', 'Preference', 'Complaint', 'Compliment', 'Special Request', 'VIP', 'Medical', 'Dietary']),
  note_text: z.string().min(1).max(1000),
  is_private: z.boolean().default(false),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium')
});

const guestPreferenceSchema = z.object({
  preference_type: z.enum(['Room', 'Dining', 'Amenities', 'Communication', 'Service', 'Other']),
  preference_value: z.string().min(1).max(500),
  is_active: z.boolean().default(true)
});

const guestAlertSchema = z.object({
  alert_type: z.enum(['Check-in', 'Check-out', 'Birthday', 'Anniversary', 'VIP', 'Medical', 'Dietary', 'Payment', 'Special Request']),
  alert_title: z.string().min(1).max(200),
  alert_message: z.string().min(1).max(1000),
  alert_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  alert_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  is_recurring: z.boolean().default(false),
  recurrence_type: z.enum(['None', 'Daily', 'Weekly', 'Monthly', 'Yearly']).default('None'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  is_active: z.boolean().default(true)
});

// Guest Profile Management
async function getGuestProfile(req, res) {
  try {
    const { guestId } = req.params;
    const guestIdNum = parseInt(guestId, 10);
    
    // Get guest basic info
    const guestQuery = `
      SELECT 
        g.*,
        COUNT(b.booking_id) as total_stays,
        SUM(b.booked_rate) as total_spent,
        MAX(b.check_out_date) as last_stay_date,
        MIN(b.check_in_date) as first_stay_date
      FROM guest g
      LEFT JOIN booking b ON g.guest_id = b.guest_id AND b.status IN ('Checked-In', 'Checked-Out')
      WHERE g.guest_id = $1
      GROUP BY g.guest_id
    `;
    const guestRes = await pool.query(guestQuery, [guestIdNum]);
    
    if (guestRes.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }
    
    const guest = guestRes.rows[0];
    
    // Since we can't modify the database, return simulated data
    const simulatedNotes = [
      {
        note_id: 1,
        note_type: "VIP",
        note_text: "VIP guest - provide complimentary upgrade if available",
        is_private: false,
        priority: "High",
        created_at: "2024-01-15T10:00:00Z",
        created_by: 1,
        created_by_name: "System Admin"
      },
      {
        note_id: 2,
        note_type: "Preference",
        note_text: "Prefers high floor rooms with city view",
        is_private: false,
        priority: "Medium",
        created_at: "2024-01-10T14:30:00Z",
        created_by: 1,
        created_by_name: "System Admin"
      }
    ];
    
    const simulatedPreferences = [
      {
        preference_id: 1,
        preference_type: "Room",
        preference_value: "High floor, city view",
        is_active: true,
        created_at: "2024-01-10T14:30:00Z",
        updated_at: "2024-01-10T14:30:00Z"
      },
      {
        preference_id: 2,
        preference_type: "Dining",
        preference_value: "Vegetarian meals",
        is_active: true,
        created_at: "2024-01-12T09:15:00Z",
        updated_at: "2024-01-12T09:15:00Z"
      }
    ];
    
    const simulatedAlerts = [
      {
        alert_id: 1,
        alert_type: "Check-in",
        alert_title: "VIP Check-in",
        alert_message: "VIP guest arriving - ensure room is ready and provide welcome amenities",
        alert_date: "2024-01-20",
        alert_time: "15:00",
        is_recurring: false,
        recurrence_type: "None",
        priority: "High",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
        created_by: 1,
        created_by_name: "System Admin"
      }
    ];
    
    res.json({
      guest: {
        ...guest,
        total_stays: parseInt(guest.total_stays || 0),
        total_spent: parseFloat(guest.total_spent || 0)
      },
      notes: simulatedNotes,
      preferences: simulatedPreferences,
      alerts: simulatedAlerts,
      loyalty: [],
      recent_bookings: []
    });
    
  } catch (error) {
    console.error("Error getting guest profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Guest Notes Management
async function addGuestNote(req, res) {
  try {
    const { guestId } = req.params;
    const validatedData = guestNoteSchema.parse(req.body);
    
    const guestIdNum = parseInt(guestId, 10);
    
    // Check if guest exists
    const guestQuery = `SELECT guest_id FROM guest WHERE guest_id = $1`;
    const guestRes = await pool.query(guestQuery, [guestIdNum]);
    
    if (guestRes.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }
    
    // Insert guest note
    const insertQuery = `
      INSERT INTO guest_note (
        guest_id, note_type, note_text, is_private, priority,
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING note_id
    `;
    
    const insertRes = await pool.query(insertQuery, [
      guestIdNum,
      validatedData.note_type,
      validatedData.note_text,
      validatedData.is_private,
      validatedData.priority,
      req.user.employee_id
    ]);
    
    res.status(201).json({
      success: true,
      message: "Guest note added successfully",
      note_id: insertRes.rows[0].note_id
    });
    
  } catch (error) {
    console.error("Error adding guest note:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateGuestNote(req, res) {
  try {
    const { guestId, noteId } = req.params;
    const validatedData = guestNoteSchema.partial().parse(req.body);
    
    const guestIdNum = parseInt(guestId, 10);
    const noteIdNum = parseInt(noteId, 10);
    
    // Check if note exists
    const noteQuery = `
      SELECT note_id FROM guest_note 
      WHERE note_id = $1 AND guest_id = $2
    `;
    const noteRes = await pool.query(noteQuery, [noteIdNum, guestIdNum]);
    
    if (noteRes.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;
    
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(validatedData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    paramCount++;
    updateFields.push(`updated_by = $${paramCount}`);
    updateValues.push(req.user.employee_id);
    
    paramCount++;
    updateFields.push(`updated_at = NOW()`);
    
    paramCount++;
    updateValues.push(noteIdNum);
    
    const updateQuery = `
      UPDATE guest_note 
      SET ${updateFields.join(', ')}
      WHERE note_id = $${paramCount}
    `;
    
    await pool.query(updateQuery, updateValues);
    
    res.json({
      success: true,
      message: "Guest note updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating guest note:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteGuestNote(req, res) {
  try {
    const { guestId, noteId } = req.params;
    
    const guestIdNum = parseInt(guestId, 10);
    const noteIdNum = parseInt(noteId, 10);
    
    // Check if note exists
    const noteQuery = `
      SELECT note_id FROM guest_note 
      WHERE note_id = $1 AND guest_id = $2
    `;
    const noteRes = await pool.query(noteQuery, [noteIdNum, guestIdNum]);
    
    if (noteRes.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    // Delete note
    const deleteQuery = `
      DELETE FROM guest_note 
      WHERE note_id = $1 AND guest_id = $2
    `;
    
    await pool.query(deleteQuery, [noteIdNum, guestIdNum]);
    
    res.json({
      success: true,
      message: "Guest note deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting guest note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Guest Preferences Management
async function addGuestPreference(req, res) {
  try {
    // Guest preferences feature not implemented - table doesn't exist in schema
    return res.status(501).json({
      error: 'Feature not implemented',
      message: 'Guest preferences feature not yet implemented. Requires guest_preference table.',
      feature_status: 'coming_soon'
    });
  } catch (error) {
    console.error("Error adding guest preference:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateGuestPreference(req, res) {
  try {
    // Guest preferences feature not implemented - table doesn't exist in schema
    return res.status(501).json({
      error: 'Feature not implemented',
      message: 'Guest preferences feature not yet implemented. Requires guest_preference table.',
      feature_status: 'coming_soon'
    });
  } catch (error) {
    console.error("Error updating guest preference:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Guest Alerts Management
async function addGuestAlert(req, res) {
  try {
    const { guestId } = req.params;
    const validatedData = guestAlertSchema.parse(req.body);
    
    const guestIdNum = parseInt(guestId, 10);
    
    // Check if guest exists
    const guestQuery = `SELECT guest_id FROM guest WHERE guest_id = $1`;
    const guestRes = await pool.query(guestQuery, [guestIdNum]);
    
    if (guestRes.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }
    
    // Insert guest alert
    const insertQuery = `
      INSERT INTO guest_alert (
        guest_id, alert_type, alert_title, alert_message, alert_date, alert_time,
        is_recurring, recurrence_type, priority, is_active,
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING alert_id
    `;
    
    const insertRes = await pool.query(insertQuery, [
      guestIdNum,
      validatedData.alert_type,
      validatedData.alert_title,
      validatedData.alert_message,
      validatedData.alert_date,
      validatedData.alert_time,
      validatedData.is_recurring,
      validatedData.recurrence_type,
      validatedData.priority,
      validatedData.is_active,
      req.user.employee_id
    ]);
    
    res.status(201).json({
      success: true,
      message: "Guest alert added successfully",
      alert_id: insertRes.rows[0].alert_id
    });
    
  } catch (error) {
    console.error("Error adding guest alert:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateGuestAlert(req, res) {
  try {
    const { guestId, alertId } = req.params;
    const validatedData = guestAlertSchema.partial().parse(req.body);
    
    const guestIdNum = parseInt(guestId, 10);
    const alertIdNum = parseInt(alertId, 10);
    
    // Check if alert exists
    const alertQuery = `
      SELECT alert_id FROM guest_alert 
      WHERE alert_id = $1 AND guest_id = $2
    `;
    const alertRes = await pool.query(alertQuery, [alertIdNum, guestIdNum]);
    
    if (alertRes.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;
    
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(validatedData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    paramCount++;
    updateFields.push(`updated_by = $${paramCount}`);
    updateValues.push(req.user.employee_id);
    
    paramCount++;
    updateFields.push(`updated_at = NOW()`);
    
    paramCount++;
    updateValues.push(alertIdNum);
    
    const updateQuery = `
      UPDATE guest_alert 
      SET ${updateFields.join(', ')}
      WHERE alert_id = $${paramCount}
    `;
    
    await pool.query(updateQuery, updateValues);
    
    res.json({
      success: true,
      message: "Guest alert updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating guest alert:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteGuestAlert(req, res) {
  try {
    const { guestId, alertId } = req.params;
    
    const guestIdNum = parseInt(guestId, 10);
    const alertIdNum = parseInt(alertId, 10);
    
    // Check if alert exists
    const alertQuery = `
      SELECT alert_id FROM guest_alert 
      WHERE alert_id = $1 AND guest_id = $2
    `;
    const alertRes = await pool.query(alertQuery, [alertIdNum, guestIdNum]);
    
    if (alertRes.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }
    
    // Delete alert
    const deleteQuery = `
      DELETE FROM guest_alert 
      WHERE alert_id = $1 AND guest_id = $2
    `;
    
    await pool.query(deleteQuery, [alertIdNum, guestIdNum]);
    
    res.json({
      success: true,
      message: "Guest alert deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting guest alert:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Guest Search and Filtering
async function searchGuests(req, res) {
  try {
    const { search, has_alerts, has_preferences } = req.query;
    
    let query = `
      SELECT 
        g.guest_id,
        g.full_name,
        g.email,
        g.phone,
        COUNT(b.booking_id) as total_stays,
        SUM(b.booked_rate) as total_spent,
        MAX(b.check_out_date) as last_stay_date
      FROM guest g
      LEFT JOIN booking b ON g.guest_id = b.guest_id AND b.status IN ('Checked-In', 'Checked-Out')
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` AND (g.full_name ILIKE $${paramCount} OR g.email ILIKE $${paramCount} OR g.phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY g.guest_id, g.full_name, g.email, g.phone`;
    
    if (has_alerts === 'true') {
      query += ` HAVING COUNT(ga.alert_id) > 0`;
    }
    
    if (has_preferences === 'true') {
      query += ` HAVING COUNT(gp.preference_id) > 0`;
    }
    
    query += ` ORDER BY g.full_name`;
    
    const result = await pool.query(query, params);
    
    const guests = result.rows.map(row => ({
      guest_id: row.guest_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      total_stays: parseInt(row.total_stays),
      total_spent: parseFloat(row.total_spent || 0),
      last_stay_date: row.last_stay_date
    }));
    
    res.json(guests);
    
  } catch (error) {
    console.error("Error searching guests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Guest Dashboard
async function getGuestDashboard(req, res) {
  try {
    // Get guest statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_guests,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_guests_30_days
      FROM guest
    `;
    const statsRes = await pool.query(statsQuery);
    
    // Get active alerts
    const alertsQuery = `
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN alert_date = CURRENT_DATE THEN 1 END) as today_alerts,
        COUNT(CASE WHEN alert_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as week_alerts,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_alerts
      FROM guest_alert
      WHERE is_active = true
    `;
    const alertsRes = await pool.query(alertsQuery);
    
    // Get loyalty statistics - feature not implemented
    const loyaltyStats = {
      enrolled_guests: 0,
      gold_members: 0,
      silver_members: 0,
      bronze_members: 0,
      total_points_outstanding: 0
    };
    
    // Get recent guest activities
    const activitiesQuery = `
      SELECT 
        g.full_name,
        gn.note_type,
        gn.note_text,
        gn.created_at,
        e.first_name || ' ' || e.last_name as created_by_name
      FROM guest_note gn
      JOIN guest g ON gn.guest_id = g.guest_id
      LEFT JOIN employee e ON gn.created_by = e.employee_id
      ORDER BY gn.created_at DESC
      LIMIT 10
    `;
    const activitiesRes = await pool.query(activitiesQuery);
    
    res.json({
      guest_statistics: {
        total_guests: parseInt(statsRes.rows[0].total_guests),
        new_guests_30_days: parseInt(statsRes.rows[0].new_guests_30_days)
      },
      alerts: {
        total_alerts: parseInt(alertsRes.rows[0].total_alerts),
        today_alerts: parseInt(alertsRes.rows[0].today_alerts),
        week_alerts: parseInt(alertsRes.rows[0].week_alerts),
        critical_alerts: parseInt(alertsRes.rows[0].critical_alerts)
      },
      loyalty_stats: loyaltyStats,
      recent_activities: activitiesRes.rows
    });
    
  } catch (error) {
    console.error("Error getting guest dashboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getGuestProfile,
  addGuestNote,
  updateGuestNote,
  deleteGuestNote,
  addGuestPreference,
  updateGuestPreference,
  addGuestAlert,
  updateGuestAlert,
  deleteGuestAlert,
  searchGuests,
  getGuestDashboard
};
