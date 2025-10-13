// src/routes/booking.routes.js
const express = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const { validateRequest } = require("../middleware/validateRequest");
const {
  createBooking,
  updateStatus,
} = require("../controllers/booking.controller");

const router = express.Router();

// Listing and lookups
router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  validateRequest,
  (req, res, next) => require("../controllers/booking.controller").listBookings(req, res, next),
);

router.get(
  "/:id(\\d+)",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  (req, res, next) => require("../controllers/booking.controller").getBookingById(req, res, next),
);

router.get(
  "/rooms/free",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  (req, res, next) => require("../controllers/booking.controller").listFreeRooms(req, res, next),
);

router.get(
  "/rooms/:roomId/availability",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  (req, res, next) => require("../controllers/booking.controller").roomAvailability(req, res, next),
);

router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  // validations 👇
  body("guest_id").isInt({ min: 1 }),
  body("room_id").isInt({ min: 1 }),
  body("check_in_date").isISO8601(),
  body("check_out_date").isISO8601(),
  body("booked_rate").isFloat({ min: 0 }),
  body("advance_payment").optional().isFloat({ min: 0 }),

  validateRequest,
  createBooking,
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  body("status").isIn(["Booked", "Checked-In", "Checked-Out", "Cancelled"]),
  validateRequest,
  updateStatus,
);

module.exports = router;
