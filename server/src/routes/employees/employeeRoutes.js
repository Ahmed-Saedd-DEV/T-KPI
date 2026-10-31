const express = require("express");
const employeeController = require("../../controllers/employees/employeeController");
const employeePerformanceController = require("../../controllers/employees/employeePerformanceController");
const auth = require("../../middleware/auth/auth");
const employeeListValidator = require("../../validators/employees/employeeListValidator");
const employeeIdValidator = require("../../validators/employees/employeeIdValidator");
const employeePerformanceValidator = require("../../validators/employees/employeePerformanceValidator");

const router = express.Router();

// Public routes — no auth required
router.get("/", employeeListValidator, employeeController.getEmployees);
router.get("/available-dates", employeeController.getAvailableDates);
router.get("/top", employeeController.getTopEmployees);

// Protected routes — auth required
router.get("/code/:employeeCode", auth, employeeController.getEmployeeByCode);
router.get(
  "/:id/performance",
  auth,
  employeePerformanceValidator,
  employeePerformanceController.getEmployeePerformance,
);
router.get(
  "/:id",
  auth,
  employeeIdValidator,
  employeeController.getEmployeeById,
);

module.exports = router;
