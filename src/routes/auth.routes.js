// src/routes/auth.routes.js
const express = require("express");
const { login } = require("../controllers/auth.controller");

const { validate } = require("../middleware/validate"); // ✨ Zod validator
const { loginSchema } = require("../schemas/auth.schema"); // ✨ Zod schema

const router = express.Router();

// ✅ Optional debug log — useful to see if route file is loading
console.log("✅ auth.routes loaded");

// POST /auth/login
router.post(
  "/login",
  (req, res, next) => {
    console.log("➡️  POST /auth/login hit");
    next();
  },
  validate(loginSchema), // ✨ validate body with Zod
  login, // controller handles login logic
);

module.exports = router; // ✅ correct export
