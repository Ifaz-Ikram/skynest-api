// backend/src/controllers/reports.controller.js
const { pool } = require('../db');

// Get report data
async function getReportData(req, res) {
  const { start_date, end_date, report_type, property, roomType, channel, segment } = req.query;

  try {
    let reportData = {};

    switch (report_type) {
      case 'overview':
        reportData = await getOverviewReport(start_date, end_date);
        break;
      case 'revenue':
        reportData = await getRevenueReport(start_date, end_date);
        break;
      case 'occupancy':
        reportData = await getOccupancyReport(start_date, end_date);
        break;
      case 'guests':
        reportData = await getGuestReport(start_date, end_date);
        break;
      case 'forecasting':
        reportData = await getForecastingReport(start_date, end_date);
        break;
      default:
        reportData = await getOverviewReport(start_date, end_date);
    }

    res.json(reportData);
  } catch (error) {
    console.error('Error getting report data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get overview report
async function getOverviewReport(startDate, endDate) {
  // Revenue KPIs
  const revenueQuery = `
    SELECT 
      COALESCE(SUM(b.booked_rate * EXTRACT(DAY FROM (b.check_out_date - b.check_in_date))), 0) as total_revenue,
      COALESCE(SUM(su.qty * su.unit_price_at_use), 0) as service_revenue,
      COALESCE(SUM(pa.amount), 0) as adjustments
    FROM booking b
    LEFT JOIN service_usage su ON b.booking_id = su.booking_id 
      AND DATE(su.used_at) BETWEEN $1 AND $2
    LEFT JOIN payment_adjustment pa ON b.booking_id = pa.booking_id 
      AND DATE(pa.created_at) BETWEEN $1 AND $2
    WHERE DATE(b.check_in_date) BETWEEN $1 AND $2
  `;

  const revenueRes = await pool.query(revenueQuery, [startDate, endDate]);
  const revenue = revenueRes.rows[0];

  // Guest statistics
  const guestQuery = `
    SELECT 
      COUNT(CASE WHEN DATE(b.check_in_date) BETWEEN $1 AND $2 THEN 1 END) as arrivals,
      COUNT(CASE WHEN DATE(b.check_out_date) BETWEEN $1 AND $2 THEN 1 END) as departures,
      COUNT(CASE WHEN b.status = 'Checked-In' AND DATE(b.check_in_date) <= $2 AND DATE(b.check_out_date) >= $1 THEN 1 END) as in_house
    FROM booking b
  `;

  const guestRes = await pool.query(guestQuery, [startDate, endDate]);
  const guests = guestRes.rows[0];

  // Occupancy data
  const occupancyQuery = `
    SELECT 
      COUNT(*) as total_rooms,
      COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupied_rooms
    FROM room r
  `;

  const occupancyRes = await pool.query(occupancyQuery);
  const occupancy = occupancyRes.rows[0];
  const occupancyRate = occupancy.total_rooms > 0 ? 
    (occupancy.occupied_rooms / occupancy.total_rooms) * 100 : 0;

  // Calculate ADR and RevPAR
  const totalRevenue = parseFloat(revenue.total_revenue) + parseFloat(revenue.service_revenue) + parseFloat(revenue.adjustments);
  const adr = guests.arrivals > 0 ? totalRevenue / parseInt(guests.arrivals) : 0;
  const revpar = occupancy.total_rooms > 0 ? totalRevenue / parseInt(occupancy.total_rooms) : 0;

  return {
    kpis: {
      total_revenue: Math.round(totalRevenue * 100) / 100,
      adr: Math.round(adr * 100) / 100,
      revpar: Math.round(revpar * 100) / 100,
      occupancy: Math.round(occupancyRate * 100) / 100,
      revenue_trend: 0, // Will be calculated by frontend
      adr_trend: 0,
      revpar_trend: 0,
      occupancy_trend: 0
    },
    revenue: {
      room: parseFloat(revenue.total_revenue),
      services: parseFloat(revenue.service_revenue),
      adjustments: parseFloat(revenue.adjustments),
      total: totalRevenue
    },
    guests: {
      arrivals: parseInt(guests.arrivals),
      departures: parseInt(guests.departures),
      in_house: parseInt(guests.in_house),
      total: parseInt(guests.arrivals) + parseInt(guests.departures)
    },
    occupancy: {
      total_rooms: parseInt(occupancy.total_rooms),
      occupied_rooms: parseInt(occupancy.occupied_rooms),
      rate: Math.round(occupancyRate * 100) / 100
    }
  };
}

// Get revenue report
async function getRevenueReport(startDate, endDate) {
  // Channel performance
  const channelQuery = `
    SELECT 
      'Direct' as name,
      COUNT(*) as bookings,
      SUM(b.booked_rate * EXTRACT(DAY FROM (b.check_out_date - b.check_in_date))) as revenue,
      AVG(b.booked_rate) as adr
    FROM booking b
    WHERE DATE(b.check_in_date) BETWEEN $1 AND $2
    GROUP BY 'Direct'
  `;

  const channelRes = await pool.query(channelQuery, [startDate, endDate]);
  const channels = channelRes.rows;

  // Room type performance
  const roomTypeQuery = `
    SELECT 
      rt.name,
      COUNT(*) as bookings,
      SUM(b.booked_rate * EXTRACT(DAY FROM (b.check_out_date - b.check_in_date))) as revenue,
      AVG(b.booked_rate) as adr,
      COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupancy
    FROM booking b
    LEFT JOIN room r ON b.room_id = r.room_id
    LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
    WHERE DATE(b.check_in_date) BETWEEN $1 AND $2
    GROUP BY rt.name, rt.room_type_id
  `;

  const roomTypeRes = await pool.query(roomTypeQuery, [startDate, endDate]);
  const roomTypes = roomTypeRes.rows.map(rt => ({
    name: rt.name,
    bookings: parseInt(rt.bookings),
    revenue: parseFloat(rt.revenue),
    adr: Math.round(parseFloat(rt.adr) * 100) / 100,
    occupancy: Math.round((parseInt(rt.occupancy) / parseInt(rt.bookings)) * 100) || 0
  }));

  return {
    channels: channels.map(ch => ({
      name: ch.name,
      bookings: parseInt(ch.bookings),
      revenue: parseFloat(ch.revenue),
      adr: Math.round(parseFloat(ch.adr) * 100) / 100,
      market_share: 100 // Mock data
    })),
    room_types: roomTypes
  };
}

// Get occupancy report
async function getOccupancyReport(startDate, endDate) {
  // Daily occupancy data
  const dailyOccupancyQuery = `
    SELECT 
      DATE(b.check_in_date) as date,
      COUNT(*) as arrivals,
      COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupied_rooms
    FROM booking b
    LEFT JOIN room r ON b.room_id = r.room_id
    WHERE DATE(b.check_in_date) BETWEEN $1 AND $2
    GROUP BY DATE(b.check_in_date)
    ORDER BY DATE(b.check_in_date)
  `;

  const dailyRes = await pool.query(dailyOccupancyQuery, [startDate, endDate]);
  const dailyOccupancy = dailyRes.rows;

  // Room type occupancy
  const roomTypeOccupancyQuery = `
    SELECT 
      rt.name,
      COUNT(*) as total_bookings,
      COUNT(CASE WHEN r.status = 'Occupied' THEN 1 END) as occupied_count,
      AVG(b.booked_rate) as avg_rate
    FROM booking b
    LEFT JOIN room r ON b.room_id = r.room_id
    LEFT JOIN room_type rt ON r.room_type_id = rt.room_type_id
    WHERE DATE(b.check_in_date) BETWEEN $1 AND $2
    GROUP BY rt.name, rt.room_type_id
  `;

  const roomTypeRes = await pool.query(roomTypeOccupancyQuery, [startDate, endDate]);
  const roomTypeOccupancy = roomTypeRes.rows.map(rt => ({
    name: rt.name,
    total_bookings: parseInt(rt.total_bookings),
    occupied_count: parseInt(rt.occupied_count),
    occupancy_rate: Math.round((parseInt(rt.occupied_count) / parseInt(rt.total_bookings)) * 100) || 0,
    avg_rate: Math.round(parseFloat(rt.avg_rate) * 100) / 100
  }));

  return {
    daily_occupancy: dailyOccupancy,
    room_type_occupancy: roomTypeOccupancy
  };
}

// Get guest report
async function getGuestReport(startDate, endDate) {
  // Guest demographics
  const guestQuery = `
    SELECT 
      COUNT(*) as total_guests,
      COUNT(CASE WHEN g.created_at BETWEEN $1::date AND $2::date THEN 1 END) as new_guests,
      AVG(EXTRACT(DAY FROM (b.check_out_date - b.check_in_date))) as avg_stay_length
    FROM booking b
    LEFT JOIN guest g ON b.guest_id = g.guest_id
    WHERE DATE(b.check_in_date) BETWEEN $1 AND $2
  `;

  const guestRes = await pool.query(guestQuery, [startDate, endDate]);
  const guests = guestRes.rows[0];

  // Guest satisfaction (mock data)
  const satisfaction = {
    avg_rating: 4.2,
    total_reviews: 45,
    positive: 85,
    complaints: 3
  };

  // Channel analysis
  const channelQuery = `
    SELECT 
      'Direct' as channel,
      COUNT(*) as bookings,
      SUM(b.booked_rate * EXTRACT(DAY FROM (b.check_out_date - b.check_in_date))) as revenue,
      AVG(b.booked_rate) as adr
    FROM booking b
    WHERE DATE(b.check_in_date) BETWEEN $1 AND $2
    GROUP BY 'Direct'
  `;

  const channelRes = await pool.query(channelQuery, [startDate, endDate]);
  const channels = channelRes.rows.map(ch => ({
    name: ch.channel,
    bookings: parseInt(ch.bookings),
    revenue: parseFloat(ch.revenue),
    adr: Math.round(parseFloat(ch.adr) * 100) / 100,
    market_share: 100
  }));

  return {
    guests: {
      total: parseInt(guests.total_guests),
      new: parseInt(guests.new_guests),
      returning: parseInt(guests.total_guests) - parseInt(guests.new_guests),
      avg_stay: Math.round(parseFloat(guests.avg_stay_length) * 100) / 100
    },
    satisfaction: satisfaction,
    channels: channels
  };
}

// Get forecasting report
async function getForecastingReport(startDate, endDate) {
  // Mock forecasting data
  const forecast = {
    next_week: 12500,
    next_month: 45000,
    next_quarter: 135000
  };

  // Pickup analysis (mock data)
  const pickupData = [
    { date: '2024-01-01', bookings: 15, revenue: 1800 },
    { date: '2024-01-02', bookings: 18, revenue: 2160 },
    { date: '2024-01-03', bookings: 12, revenue: 1440 },
    { date: '2024-01-04', bookings: 20, revenue: 2400 },
    { date: '2024-01-05', bookings: 25, revenue: 3000 }
  ];

  return {
    forecast: forecast,
    pickup_data: pickupData
  };
}

// Export report
async function exportReport(req, res) {
  const { start_date, end_date, report_type, format } = req.query;

  try {
    let reportData = {};
    
    switch (report_type) {
      case 'overview':
        reportData = await getOverviewReport(start_date, end_date);
        break;
      case 'revenue':
        reportData = await getRevenueReport(start_date, end_date);
        break;
      case 'occupancy':
        reportData = await getOccupancyReport(start_date, end_date);
        break;
      case 'guests':
        reportData = await getGuestReport(start_date, end_date);
        break;
      case 'forecasting':
        reportData = await getForecastingReport(start_date, end_date);
        break;
      default:
        reportData = await getOverviewReport(start_date, end_date);
    }

    if (format === 'pdf') {
      // Generate PDF report (simplified)
      const reportHtml = generateReportHtml(reportData, report_type, start_date, end_date);
      res.setHeader('Content-Type', 'text/html');
      res.send(reportHtml);
    } else {
      // Return JSON data for Excel export
      res.json(reportData);
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to generate report HTML
function generateReportHtml(reportData, reportType, startDate, endDate) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${startDate} to ${endDate}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .hotel-name { font-size: 24px; font-weight: bold; }
        .report-title { font-size: 18px; margin-top: 10px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hotel-name">SkyNest Hotel</div>
        <div class="report-title">${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</div>
        <div>Period: ${startDate} to ${endDate}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Report Data</div>
        <pre>${JSON.stringify(reportData, null, 2)}</pre>
      </div>
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  getReportData,
  exportReport
};

