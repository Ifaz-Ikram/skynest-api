const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../utils/roles");
const {
  listUsers,
  createUser,
  createEmployee,
  getAllowedRoles,
  updateUserRole,
  deleteUser,
  createService,
  updateService,
  deleteService,
} = require("../controllers/admin.controller");

const router = express.Router();

// Employee Management - Role-based access
// Admin can create: Admin, Manager, Receptionist, Accountant
// Manager can create: Receptionist, Accountant, Customer
// Receptionist cannot create employees
router.post("/employees", requireAuth, requireRole("Admin", "Manager"), createEmployee);
router.get("/allowed-roles", requireAuth, getAllowedRoles);

// Users (Admin and Manager can view users)
router.get("/users", requireAuth, requireRole("Admin", "Manager"), listUsers);
router.post("/users", requireAuth, requireRole("Admin"), createUser);
router.patch("/users/:id/role", requireAuth, requireRole("Admin"), updateUserRole);
router.patch("/users/:id/password", requireAuth, requireRole("Admin"), require("express").json(), (req,res,next)=> require("../controllers/admin.controller").updateUserPassword(req,res,next));
router.delete("/users/:id", requireAuth, requireRole("Admin"), deleteUser);

// Service Catalog CRUD
router.post("/service-catalog", requireAuth, requireRole("Admin"), createService);
router.patch("/service-catalog/:id", requireAuth, requireRole("Admin"), updateService);
router.delete("/service-catalog/:id", requireAuth, requireRole("Admin"), deleteService);

module.exports = router;
