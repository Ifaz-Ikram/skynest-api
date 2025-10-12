// src/controllers/report.controller.js
const { sequelize } = require("../../models");

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
