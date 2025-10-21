// src/routes/payment.routes.js
const express = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const { validateRequest } = require("../middleware/validateRequest");
const {
  createPayment,
  createPaymentAdjustment,
} = require("../controllers/payment.controller");

const router = express.Router();

// -------------------- LIST PAYMENTS FOR BOOKING --------------------
router.get(
  "/:bookingId",
  requireAuth,
  requireRole("Admin", "Accountant", "Manager"),
  (req, res, next) =>
    require("../controllers/payment.controller").listPaymentsForBooking(
      req,
      res,
      next,
    ),
);

// -------------------- CREATE PAYMENT --------------------
router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Accountant", "Manager"),
  body("booking_id").isInt({ min: 1 }),
  body("paid_on").isISO8601(),
  body("amount").isFloat({ min: 0 }),
  body("method").isString().notEmpty(),
  validateRequest,
  createPayment,
);

// -------------------- ADJUST PAYMENT --------------------
router.post(
  "/adjustment",
  requireAuth,
  requireRole("Admin", "Accountant", "Manager"),
  body("payment_id").isInt({ min: 1 }),
  body("adjusted_on").isISO8601(),
  body("amount").isFloat(),
  validateRequest,
  createPaymentAdjustment,
);

module.exports = router;
