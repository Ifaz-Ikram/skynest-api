// src/routes/service.routes.js
const express = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const { validateRequest } = require("../middleware/validateRequest");
const { addServiceUsage } = require("../controllers/service.controller");

const router = express.Router();

// -------------------- ADD SERVICE USAGE --------------------
router.post(
  "/usage",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  body("booking_id").isInt({ min: 1 }),
  body("service_id").isInt({ min: 1 }),
  body("used_on").isISO8601(),
  body("qty").isInt({ min: 1 }),
  body("unit_price_at_use").isFloat({ min: 0 }),
  validateRequest,
  addServiceUsage,
);

module.exports = router;
