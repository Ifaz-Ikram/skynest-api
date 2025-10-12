const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().min(1, "username required"),
  password: z.string().min(1, "password required"),
});

module.exports = { loginSchema };
