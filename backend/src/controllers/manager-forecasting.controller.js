const { pool } = require('../db');
const { z } = require('zod');

// Zod schemas for validation
const forecastQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  room_type_id: z.number().int().positive().optional()
});

// Pace Analysis
async function getPaceAnalysis(req, res) {
  try {
    const validatedData = forecastQuerySchema.parse(req.query);
    const { start_date, end_date, room_type_id } = validatedData;
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get booking pace data
    const paceQuery = `
      SELECT 
        DATE(b.created_at) as booking_date,
        COUNT(b.booking_id) as bookings_count,
        SUM(b.booked_rate) as revenue,
        AVG(b.booked_rate) as avg_rate,
        COUNT(CASE WHEN b.status IN ('Checked-In', 'Checked-Out') THEN 1 END) as completed_bookings,
        SUM(CASE WHEN b.status IN ('Checked-In', 'Checked-Out') THEN b.booked_rate ELSE 0 END) as completed_revenue
      FROM booking b
      WHERE b.created_at BETWEEN $1 AND $2
      ${room_type_id ? 'AND b.room_id IN (SELECT room_id FROM room WHERE room_type_id = $3)' : ''}
      GROUP BY DATE(b.created_at)
      ORDER BY booking_date
    `;
    
    const params = [startDate, endDate];
    if (room_type_id) params.push(room_type_id);
    
    const paceRes = await pool.query(paceQuery, params);
    
    // Calculate cumulative totals
    let cumulativeBookings = 0;
    let cumulativeRevenue = 0;
    let cumulativeCompletedBookings = 0;
    let cumulativeCompletedRevenue = 0;
    
    const paceData = paceRes.rows.map(row => {
      cumulativeBookings += parseInt(row.bookings_count);
      cumulativeRevenue += parseFloat(row.revenue || 0);
      cumulativeCompletedBookings += parseInt(row.completed_bookings);
      cumulativeCompletedRevenue += parseFloat(row.completed_revenue || 0);
      
      return {
        date: row.booking_date,
        daily_bookings: parseInt(row.bookings_count),
        daily_revenue: parseFloat(row.revenue || 0),
        daily_avg_rate: parseFloat(row.avg_rate || 0),
        daily_completed_bookings: parseInt(row.completed_bookings),
        daily_completed_revenue: parseFloat(row.completed_revenue || 0),
        cumulative_bookings: cumulativeBookings,
        cumulative_revenue: cumulativeRevenue,
        cumulative_completed_bookings: cumulativeCompletedBookings,
        cumulative_completed_revenue: cumulativeCompletedRevenue
      };
    });
    
    // Calculate pace metrics
    const totalBookings = paceData.length > 0 ? paceData[paceData.length - 1].cumulative_bookings : 0;
    const totalRevenue = paceData.length > 0 ? paceData[paceData.length - 1].cumulative_revenue : 0;
    const avgDailyBookings = totalDays > 0 ? totalBookings / totalDays : 0;
    const avgDailyRevenue = totalDays > 0 ? totalRevenue / totalDays : 0;
    
    res.json({
      period: {
        start_date: start_date,
        end_date: end_date,
        total_days: totalDays
      },
      pace_data: paceData,
      summary: {
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        avg_daily_bookings: parseFloat(avgDailyBookings.toFixed(2)),
        avg_daily_revenue: parseFloat(avgDailyRevenue.toFixed(2)),
        total_completed_bookings: cumulativeCompletedBookings,
        total_completed_revenue: cumulativeCompletedRevenue
      }
    });
    
  } catch (error) {
    console.error("Error getting pace analysis:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

// Pickup Analysis
async function getPickupAnalysis(req, res) {
  try {
    const { start_date, end_date, days_ahead = 30 } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const daysAhead = parseInt(days_ahead, 10);
    
    // Get pickup data by days ahead
    const pickupQuery = `
      SELECT 
        DATE(b.created_at) as pickup_date,
        DATE(b.check_in_date) as arrival_date,
        EXTRACT(DAYS FROM (b.check_in_date - b.created_at)) as days_ahead,
        COUNT(b.booking_id) as bookings_count,
        SUM(b.booked_rate) as revenue,
        AVG(b.booked_rate) as avg_rate
      FROM booking b
      WHERE b.created_at BETWEEN $1 AND $2
      AND b.check_in_date > b.created_at
      GROUP BY DATE(b.created_at), DATE(b.check_in_date), EXTRACT(DAYS FROM (b.check_in_date - b.created_at))
      ORDER BY pickup_date, days_ahead
    `;
    
    const pickupRes = await pool.query(pickupQuery, [startDate, endDate]);
    
    // Group by days ahead ranges
    const pickupRanges = {
      '0-7': { bookings: 0, revenue: 0, count: 0 },
      '8-14': { bookings: 0, revenue: 0, count: 0 },
      '15-30': { bookings: 0, revenue: 0, count: 0 },
      '31-60': { bookings: 0, revenue: 0, count: 0 },
      '60+': { bookings: 0, revenue: 0, count: 0 }
    };
    
    pickupRes.rows.forEach(row => {
      const daysAhead = parseInt(row.days_ahead);
      const bookings = parseInt(row.bookings_count);
      const revenue = parseFloat(row.revenue || 0);
      
      let range;
      if (daysAhead <= 7) range = '0-7';
      else if (daysAhead <= 14) range = '8-14';
      else if (daysAhead <= 30) range = '15-30';
      else if (daysAhead <= 60) range = '31-60';
      else range = '60+';
      
      pickupRanges[range].bookings += bookings;
      pickupRanges[range].revenue += revenue;
      pickupRanges[range].count += 1;
    });
    
    // Calculate averages
    Object.keys(pickupRanges).forEach(range => {
      if (pickupRanges[range].count > 0) {
        pickupRanges[range].avg_rate = pickupRanges[range].revenue / pickupRanges[range].bookings;
      } else {
        pickupRanges[range].avg_rate = 0;
      }
    });
    
    res.json({
      period: {
        start_date: start_date,
        end_date: end_date,
        days_ahead: daysAhead
      },
      pickup_ranges: pickupRanges,
      raw_data: pickupRes.rows.map(row => ({
        pickup_date: row.pickup_date,
        arrival_date: row.arrival_date,
        days_ahead: parseInt(row.days_ahead),
        bookings_count: parseInt(row.bookings_count),
        revenue: parseFloat(row.revenue || 0),
        avg_rate: parseFloat(row.avg_rate || 0)
      }))
    });
    
  } catch (error) {
    console.error("Error getting pickup analysis:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Segmentation Analysis
async function getSegmentationAnalysis(req, res) {
  try {
    const validatedData = forecastQuerySchema.parse(req.query);
    const { start_date, end_date } = validatedData;
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    // Get segmentation data (simplified since guest_type and property_id don't exist)
    const segmentQuery = `
      SELECT 
        'All Guests' as segment,
        COUNT(b.booking_id) as bookings_count,
        SUM(b.booked_rate) as revenue,
        AVG(b.booked_rate) as avg_rate,
        AVG(EXTRACT(DAYS FROM (b.check_out_date - b.check_in_date))) as avg_length_of_stay,
        COUNT(CASE WHEN b.status IN ('Checked-In', 'Checked-Out') THEN 1 END) as completed_bookings,
        SUM(CASE WHEN b.status IN ('Checked-In', 'Checked-Out') THEN b.booked_rate ELSE 0 END) as completed_revenue
      FROM booking b
      WHERE b.check_in_date BETWEEN $1 AND $2
      ORDER BY revenue DESC
    `;
    
    const params = [startDate, endDate];
    
    const segmentRes = await pool.query(segmentQuery, params);
    
    // Calculate totals
    const totals = segmentRes.rows.reduce((acc, row) => ({
      total_bookings: acc.total_bookings + parseInt(row.bookings_count),
      total_revenue: acc.total_revenue + parseFloat(row.revenue || 0),
      total_completed_bookings: acc.total_completed_bookings + parseInt(row.completed_bookings),
      total_completed_revenue: acc.total_completed_revenue + parseFloat(row.completed_revenue || 0)
    }), { total_bookings: 0, total_revenue: 0, total_completed_bookings: 0, total_completed_revenue: 0 });
    
    // Calculate percentages
    const segments = segmentRes.rows.map(row => {
      const bookings = parseInt(row.bookings_count);
      const revenue = parseFloat(row.revenue || 0);
      
      return {
        segment: row.segment,
        bookings_count: bookings,
        revenue: revenue,
        avg_rate: parseFloat(row.avg_rate || 0),
        avg_length_of_stay: parseFloat(row.avg_length_of_stay || 0),
        completed_bookings: parseInt(row.completed_bookings),
        completed_revenue: parseFloat(row.completed_revenue || 0),
        booking_percentage: totals.total_bookings > 0 ? ((bookings / totals.total_bookings) * 100).toFixed(2) : 0,
        revenue_percentage: totals.total_revenue > 0 ? ((revenue / totals.total_revenue) * 100).toFixed(2) : 0
      };
    });
    
    res.json({
      period: {
        start_date: start_date,
        end_date: end_date
      },
      segments: segments,
      totals: totals
    });
    
  } catch (error) {
    console.error("Error getting segmentation analysis:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

// Forecasting Dashboard
async function getForecastingDashboard(req, res) {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    // Get booking trends
    const trendQuery = `
      SELECT 
        DATE(b.created_at) as date,
        COUNT(b.booking_id) as bookings,
        SUM(b.booked_rate) as revenue,
        AVG(b.booked_rate) as avg_rate
      FROM booking b
      WHERE b.created_at BETWEEN $1 AND $2
      GROUP BY DATE(b.created_at)
      ORDER BY date
    `;
    const trendRes = await pool.query(trendQuery, [startDate, endDate]);
    
    // Get segment performance (simplified since guest_type doesn't exist)
    const segmentQuery = `
      SELECT 
        'All Guests' as guest_type,
        COUNT(b.booking_id) as bookings,
        SUM(b.booked_rate) as revenue,
        AVG(b.booked_rate) as avg_rate
      FROM booking b
      WHERE b.check_in_date BETWEEN $1 AND $2
      ORDER BY revenue DESC
    `;
    const segmentRes = await pool.query(segmentQuery, [startDate, endDate]);
    
    // Get room type performance
    const roomTypeQuery = `
      SELECT 
        rt.name as room_type,
        COUNT(b.booking_id) as bookings,
        SUM(b.booked_rate) as revenue,
        AVG(b.booked_rate) as avg_rate
      FROM booking b
      JOIN room r ON b.room_id = r.room_id
      JOIN room_type rt ON r.room_type_id = rt.room_type_id
      WHERE b.check_in_date BETWEEN $1 AND $2
      GROUP BY rt.name
      ORDER BY revenue DESC
    `;
    const roomTypeRes = await pool.query(roomTypeQuery, [startDate, endDate]);
    
    res.json({
      period: {
        start_date: start_date,
        end_date: end_date
      },
      trends: trendRes.rows.map(row => ({
        date: row.date,
        bookings: parseInt(row.bookings),
        revenue: parseFloat(row.revenue || 0),
        avg_rate: parseFloat(row.avg_rate || 0)
      })),
      segment_performance: segmentRes.rows.map(row => ({
        segment: row.guest_type,
        bookings: parseInt(row.bookings),
        revenue: parseFloat(row.revenue || 0),
        avg_rate: parseFloat(row.avg_rate || 0)
      })),
      room_type_performance: roomTypeRes.rows.map(row => ({
        room_type: row.room_type,
        bookings: parseInt(row.bookings),
        revenue: parseFloat(row.revenue || 0),
        avg_rate: parseFloat(row.avg_rate || 0)
      }))
    });
    
  } catch (error) {
    console.error("Error getting forecasting dashboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getPaceAnalysis: getPaceAnalysis,
  getBookingPace: getPaceAnalysis,
  getPickupAnalysis: getPickupAnalysis,
  getPickupReport: getPickupAnalysis,
  getSegmentationAnalysis,
  getForecastingDashboard
};
