// src/routes/booking.routes.js
const express = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const { validateRequest } = require("../middleware/validateRequest");
const bookingController = require("../controllers/booking.controller");

const router = express.Router();

// Listing and availability
router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Customer"),
  bookingController.listBookings,
);

router.get(
  "/availability/matrix",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.availabilityTimeline,
);

router.post(
  "/check-availability",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  body("room_id").isInt({ min: 1 }),
  body("check_in").isISO8601(),
  body("check_out").isISO8601(),
  body("capacity").optional().isInt({ min: 1 }),
  body("room_type_id").optional().isInt({ min: 1 }),
  validateRequest,
  bookingController.checkAvailability,
);

router.get(
  "/rooms/free",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.listFreeRooms,
);

router.get(
  "/rooms/:roomId/availability",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.roomAvailability,
);

// Group management
router.get(
  "/groups",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.listBookingGroups,
);

router.post(
  "/groups",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.saveBookingGroup,
);

router.post(
  "/groups/:groupId/assign",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.assignBookingGroupMembers,
);

router.delete(
  "/groups/:groupId/bookings/:bookingId",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.removeBookingFromGroup,
);

// Metadata management
router.get(
  "/:id/meta",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Accountant"),
  bookingController.getBookingMeta,
);

router.put(
  "/:id/meta",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.upsertBookingMeta,
);

router.delete(
  "/:id/meta",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  bookingController.deleteBookingMeta,
);

// Aliases to align with prompt-style routes
router.get(
  "/:id/services",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Accountant", "Customer"),
  (req, res, next) =>
    require("../controllers/service.controller").listServiceUsage(
      { ...req, params: { bookingId: req.params.id } },
      res,
      next,
    ),
);

router.get(
  "/:id/payments",
  requireAuth,
  requireRole("Admin", "Manager", "Accountant", "Customer"),
  (req, res, next) =>
    require("../controllers/payment.controller").listPaymentsForBooking(
      { ...req, params: { bookingId: req.params.id } },
      res,
      next,
    ),
);

router.get(
  "/:id/full",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Accountant"),
  bookingController.getBookingFull,
);

router.get(
  "/:id",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Customer"),
  bookingController.getBookingById,
);

// Mutations
router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  body("guest_id").isInt({ min: 1 }),
  body("room_id").optional().isInt({ min: 1 }),
  body("check_in_date").isISO8601(),
  body("check_out_date").isISO8601(),
  body("booked_rate").isFloat({ min: 0 }),
  body("advance_payment").optional().isFloat({ min: 0 }),
  body("is_group_booking").optional().isBoolean(),
  body("group_name").optional().custom((value) => {
    if (value === null || value === undefined || typeof value === 'string') {
      return true;
    }
    throw new Error('group_name must be a string or null');
  }),
  body("room_type_id").optional().isInt({ min: 1 }),
  body("room_quantity").optional().isInt({ min: 1 }),
  // Custom validation for group vs individual bookings
  body().custom((value) => {
    const isGroupBooking = value.is_group_booking;
    
    if (isGroupBooking) {
      // For group bookings, require room_type_id and room_quantity
      if (!value.room_type_id || !value.room_quantity) {
        throw new Error("For group bookings, room_type_id and room_quantity are required");
      }
    } else {
      // For individual bookings, require room_id
      if (!value.room_id) {
        throw new Error("For individual bookings, room_id is required");
      }
    }
    
    return true;
  }),
  validateRequest,
  bookingController.createBooking,
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist"),
  body("status").isIn(["Booked", "Checked-In", "Checked-Out", "Cancelled"]),
  validateRequest,
  bookingController.updateStatus,
);

module.exports = router;
