// src/routes/service.routes.js
const express = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const { validateRequest } = require("../middleware/validateRequest");
const {
  listServices,
  addServiceUsage,
  listServiceUsage,
  deleteServiceUsage,
} = require("../controllers/service.controller");

const router = express.Router();

// -------------------- LIST SERVICE CATALOG --------------------
router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Accountant"),
  (req, res, next) => listServices(req, res, next),
);

// -------------------- ADD SERVICE USAGE --------------------
router.post(
  "/usage",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  body("booking_id").isInt({ min: 1 }),
  body("service_id").isInt({ min: 1 }),
  body("used_on").isISO8601(),
  // Accept either qty/unit_price_at_use or quantity/unit_price from API layer
  // Validation kept light here; controller normalizes
  body(["qty", "quantity"]).optional().isInt({ min: 1 }),
  body(["unit_price_at_use", "unit_price"]).optional().isFloat({ min: 0 }),
  validateRequest,
  addServiceUsage,
);

// -------------------- LIST USAGE FOR BOOKING --------------------
router.get(
  "/usage/:bookingId",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Accountant"),
  (req, res, next) => listServiceUsage(req, res, next),
);

// -------------------- DELETE USAGE ROW --------------------
router.delete(
  "/usage/:usageId",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  (req, res, next) => deleteServiceUsage(req, res, next),
);

module.exports = router;
