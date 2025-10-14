// src/routes/report.routes.js
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const {
  occupancyByDay,
  billingSummary,
  serviceUsageDetail,
  branchRevenueMonthly,
  serviceMonthlyTrend,
  paymentsLedger,
  adjustmentsLast,
} = require("../controllers/report.controller");

router.get(
  "/occupancy-by-day",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  occupancyByDay,
);

router.get(
  "/billing-summary",
  requireAuth,
  requireRole("Admin", "Manager", "Accountant"),
  billingSummary,
);

router.get(
  "/service-usage-detail",
  requireAuth,
  requireRole("Admin", "Manager", "Accountant", "Receptionist"),
  serviceUsageDetail,
);

router.get(
  "/branch-revenue-monthly",
  requireAuth,
  requireRole("Admin", "Manager", "Accountant"),
  branchRevenueMonthly,
);

router.get(
  "/service-monthly-trend",
  requireAuth,
  requireRole("Admin", "Manager", "Accountant"),
  serviceMonthlyTrend,
);

router.get(
  "/payments-ledger",
  requireAuth,
  requireRole("Admin", "Manager", "Accountant"),
  paymentsLedger,
);

router.get(
  "/adjustments",
  requireAuth,
  requireRole("Admin", "Manager", "Accountant"),
  adjustmentsLast,
);

module.exports = router;
