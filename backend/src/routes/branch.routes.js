const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const { listBranches } = require("../controllers/branch.controller");

const router = express.Router();

// GET /branches (read-only for staff; customers don't need this)
router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Manager", "Receptionist", "Accountant"),
  listBranches,
);

module.exports = router;

