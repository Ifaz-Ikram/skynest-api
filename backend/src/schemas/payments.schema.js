// src/schemas/payments.schema.js
const { z } = require("zod");

const id = z.coerce.number().int().positive();
const money = z.coerce.number().finite().positive();
// Schema enum values: 'Cash', 'Card', 'Online', 'BankTransfer'
const PaymentMethod = z.enum(["Cash", "Card", "Online", "BankTransfer"]);

// Schema column: paid_at (timestamp with time zone, NOT NULL, DEFAULT now())
// Schema column: payment_reference (varchar(100), nullable)
// Note: 'note' field does NOT exist in schema - removed
const createPaymentSchema = z.object({
  booking_id: id,
  amount: money,
  method: PaymentMethod.optional(), // Schema allows null

  // paid_at is optional; controller will default to NOW() if not provided
  paid_at: z.string().datetime({ offset: true }).optional(), // e.g. "2025-11-11T10:30:00Z"

  payment_reference: z.string().max(100).optional(),
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
