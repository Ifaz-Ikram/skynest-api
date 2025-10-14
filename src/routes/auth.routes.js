// src/routes/auth.routes.js
const express = require("express");
const { login, me, logout, register } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const { validate } = require("../middleware/validate");
const { loginSchema } = require("../schemas/auth.schema");

const router = express.Router();

// POST /auth/register
router.post("/register", register);

// POST /auth/login
router.post("/login", validate(loginSchema), login);

// GET /auth/me (reads cookie or Bearer token)
router.get("/me", requireAuth, me);

// POST /auth/logout (clears cookie if present)
router.post("/logout", logout);

module.exports = router;

