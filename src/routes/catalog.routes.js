const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const { listServices } = require("../controllers/service.controller");

const router = express.Router();

// GET /service-catalog
router.get("/", requireAuth, requireRole("Admin", "Manager", "Receptionist", "Accountant"), listServices);

module.exports = router;

