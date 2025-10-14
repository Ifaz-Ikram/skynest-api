// src/schemas/services.schema.js
const { z } = require("zod");

// Coercions let you send numbers as strings and still pass validation
const id = z.coerce.number().int().positive();
const count = z.coerce.number().int().positive();
const _money = z.coerce.number().finite().positive();

// POST /services/usage  body schema
// API fields: booking_id, service_id, quantity, unit_price? (optional), used_on? (YYYY-MM-DD)
const addServiceUsageSchema = z.object({
  booking_id: id,
  service_id: id,
  quantity: count, // <-- matches your controller's pickUsage()
  unit_price: z.coerce.number().finite().positive().optional(), // optional
  used_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // "YYYY-MM-DD"
});

module.exports = { addServiceUsageSchema };
