// src/schemas/payments.schema.js
const { z } = require("zod");

const id = z.coerce.number().int().positive();
const money = z.coerce.number().finite().positive();
const PaymentMethod = z.enum(["CASH", "CARD", "ONLINE"]);

// Accepts either ISO datetime in `paid_at` OR date-only in `paid_on` (both optional).
// Transforms to controller-friendly snake_case with `paid_at` only.
const createPaymentSchema = z
  .object({
    booking_id: id,
    amount: money,
    method: PaymentMethod,

    // Optional time fields (client may send none; controller will default to NOW())
    paid_at: z.string().datetime({ offset: true }).optional(), // e.g. "2025-11-11T10:30:00Z"
    paid_on: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(), // e.g. "2025-11-11"

    payment_reference: z.string().max(100).optional(),
    note: z.string().max(500).optional(),
  })
  .transform((d) => {
    const paid_at =
      d.paid_at ?? (d.paid_on ? `${d.paid_on}T00:00:00Z` : undefined); // normalize date-only to midnight UTC

    return {
      booking_id: d.booking_id,
      amount: d.amount,
      method: d.method,
      paid_at, // controller uses this; may be undefined → DB will use NOW()
      payment_reference: d.payment_reference ?? null,
      note: d.note ?? null,
    };
  });

const createPaymentAdjustmentSchema = z.object({
  booking_id: id,
  // 👇 accept 'amount' in the request (can be + or -; just not zero)
  amount: z.coerce
    .number()
    .finite()
    .refine((v) => v !== 0, "Cannot be zero"),
  reason: z.string().max(200).optional(),
  // keep your enum labels exactly as in DB
  type: z.enum(["refund", "chargeback", "manual_adjustment"]).optional(),
});

module.exports = {
  createPaymentSchema,
  createPaymentAdjustmentSchema,
  PaymentMethod,
};
