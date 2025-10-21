// src/controllers/report.controller.js
const { sequelize } = require("../models");
const { pool } = require("../db");

// GET /reports/occupancy-by-day
exports.occupancyByDay = async (_req, res, next) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT * FROM vw_occupancy_by_day ORDER BY day DESC LIMIT 366",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

// GET /reports/billing-summary
exports.billingSummary = async (_req, res, next) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT * FROM vw_billing_summary LIMIT 1000",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

// GET /reports/service-usage-detail?booking_id=&from=&to=
exports.serviceUsageDetail = async (req, res, next) => {
  try {
    const { booking_id, from, to } = req.query;
    const conds = [];
    const repl = {};

    if (booking_id) {
      conds.push("booking_id = :booking_id");
      repl.booking_id = Number(booking_id);
    }
    if (from) {
      conds.push("used_on >= :from");
      repl.from = from;
    }
    if (to) {
      conds.push("used_on <= :to");
      repl.to = to;
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const sql = `SELECT * FROM vw_service_usage_detail ${where}
                 ORDER BY used_on DESC LIMIT 1000`;

    const [rows] = await sequelize.query(sql, { replacements: repl });
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

// GET /reports/branch-revenue-monthly
exports.branchRevenueMonthly = async (_req, res, next) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT * FROM vw_branch_revenue_monthly ORDER BY month DESC LIMIT 60",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

// GET /reports/service-monthly-trend
exports.serviceMonthlyTrend = async (_req, res, next) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT * FROM vw_service_monthly_trend ORDER BY month DESC LIMIT 60",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

// GET /reports/payments-ledger?days=30
exports.paymentsLedger = async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days || 30)));
    const [rows] = await sequelize.query(
      `SELECT p.payment_id, p.booking_id, p.amount, p.method, p.paid_at,
              b.guest_id
         FROM payment p
         JOIN booking b ON b.booking_id = p.booking_id
        WHERE p.paid_at >= NOW() - INTERVAL '${days} days'
        ORDER BY p.paid_at DESC, p.payment_id DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /reports/adjustments?days=30
exports.adjustmentsLast = async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days || 30)));
    const [rows] = await sequelize.query(
      `SELECT a.adjustment_id, a.booking_id,
              CASE WHEN a.type IN ('refund','chargeback') THEN -a.amount ELSE a.amount END AS amount,
              a.type,
              COALESCE(a.created_at, a.adjusted_at, a.createdon, a.created, a."timestamp", a.ts, NOW()) AS created_at
         FROM payment_adjustment a
        WHERE COALESCE(a.created_at, a.adjusted_at, a.createdon, a.created, a."timestamp", a.ts, NOW())
              >= NOW() - INTERVAL '${days} days'
        ORDER BY created_at DESC, adjustment_id DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// Simple operational lists (no schema changes)
// GET /reports/arrivals-today
exports.arrivalsToday = async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.booking_id, COALESCE(g.full_name, 'Unknown Guest') AS guest, COALESCE(r.room_number, 'Unknown Room') AS room_number, COALESCE(br.branch_name, 'Unknown Branch') AS branch_name,
              b.check_in_date, b.check_out_date, b.status
         FROM booking b
         LEFT JOIN guest g ON g.guest_id = b.guest_id
         LEFT JOIN room r ON r.room_id = b.room_id
         LEFT JOIN branch br ON br.branch_id = r.branch_id
        WHERE b.check_in_date = CURRENT_DATE
          AND b.status IN ('Booked','Checked-In')
        ORDER BY br.branch_name, r.room_number, g.full_name`
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /reports/departures-today
exports.departuresToday = async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.booking_id, COALESCE(g.full_name, 'Unknown Guest') AS guest, COALESCE(r.room_number, 'Unknown Room') AS room_number, COALESCE(br.branch_name, 'Unknown Branch') AS branch_name,
              b.check_in_date, b.check_out_date, b.status
         FROM booking b
         LEFT JOIN guest g ON g.guest_id = b.guest_id
         LEFT JOIN room r ON r.room_id = b.room_id
         LEFT JOIN branch br ON br.branch_id = r.branch_id
        WHERE b.check_out_date = CURRENT_DATE
          AND b.status IN ('Booked','Checked-In')
        ORDER BY br.branch_name, r.room_number, g.full_name`
    );
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /reports/in-house
exports.inHouse = async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.booking_id, COALESCE(g.full_name, 'Unknown Guest') AS guest, COALESCE(r.room_number, 'Unknown Room') AS room_number, COALESCE(br.branch_name, 'Unknown Branch') AS branch_name,
              b.check_in_date, b.check_out_date, b.status
         FROM booking b
         LEFT JOIN guest g ON g.guest_id = b.guest_id
         LEFT JOIN room r ON r.room_id = b.room_id
         LEFT JOIN branch br ON br.branch_id = r.branch_id
        WHERE CURRENT_DATE >= b.check_in_date AND CURRENT_DATE < b.check_out_date
          AND b.status = 'Checked-In'
        ORDER BY br.branch_name, r.room_number`
    );
    res.json(rows);
  } catch (e) { next(e); }
};
