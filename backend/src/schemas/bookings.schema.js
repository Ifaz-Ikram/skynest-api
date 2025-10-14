const { z } = require("zod");

const BookingStatus = z.enum([
  "Booked",
  "Checked-In",
  "Checked-Out",
  "Cancelled",
]);

const createBookingSchema = z.object({
  guest_id: z.number().int().positive(),
  room_id: z.number().int().positive(),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  booked_rate: z.number(),
  tax_rate_percent: z.number().optional(),
  status: BookingStatus.optional(),
  advance_payment: z.number().nonnegative().optional(),
});

const updateBookingStatusSchema = z.object({
  status: BookingStatus,
});

const createBookingWithPaymentSchema = createBookingSchema
  .extend({
    // if you pass advance_payment > 0, you can (optionally) pass method/reference/paid_at
    method: z.enum(["Cash", "Card", "Online"]).optional(),
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
