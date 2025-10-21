const { z } = require("zod");

const BookingStatus = z.enum([
  "Booked",
  "Checked-In",
  "Checked-Out",
  "Cancelled",
]);

const createBookingSchema = z.object({
  pre_booking_id: z.number().int().positive().optional(), // bigint, nullable
  guest_id: z.number().int().positive(),
  room_id: z.number().int().positive().optional(), // Made optional for group bookings
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  status: BookingStatus.optional(),
  booked_rate: z.number().positive(),
  tax_rate_percent: z.number().nonnegative().optional(), // NOT NULL with default 0
  discount_amount: z.number().nonnegative().optional(), // NOT NULL with default 0
  late_fee_amount: z.number().nonnegative().optional(), // NOT NULL with default 0
  preferred_payment_method: z.enum(["Cash", "Card", "Online", "BankTransfer"]).optional(),
  advance_payment: z.number().nonnegative().optional(), // NOT NULL with default 0
  // Group booking fields
  is_group_booking: z.boolean().optional(),
  group_name: z.string().optional(),
  room_type_id: z.number().int().positive().optional(),
  room_quantity: z.number().int().positive().optional(),
  // room_estimate is GENERATED - never accept from client
  // created_at has default now() - can be optional
}).refine(
  (data) => {
    // For group bookings, require room_type_id and room_quantity
    if (data.is_group_booking) {
      return data.room_type_id && data.room_quantity;
    }
    // For individual bookings, require room_id
    return data.room_id;
  },
  {
    message: "For group bookings, room_type_id and room_quantity are required. For individual bookings, room_id is required.",
    path: ["room_id", "room_type_id", "room_quantity"],
  }
);

const updateBookingStatusSchema = z.object({
  status: BookingStatus,
});

const createBookingWithPaymentSchema = createBookingSchema
  .extend({
    // if you pass advance_payment > 0, you can (optionally) pass method/reference/paid_at
    method: z.enum(["Cash", "Card", "Online", "BankTransfer"]).optional(),
    payment_reference: z.string().trim().min(1).max(100).optional(), // idempotency key (per-booking)
    paid_at: z.string().datetime().optional(), // ISO, optional; server will default NOW()
  })
  .refine(
    (v) => {
      // if advance_payment > 0, method must be present
      if ((v.advance_payment ?? 0) > 0) return !!v.method;
      return true;
    },
    {
      message: "method is required when advance_payment > 0",
      path: ["method"],
    },
  );

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
  createBookingWithPaymentSchema,
};
