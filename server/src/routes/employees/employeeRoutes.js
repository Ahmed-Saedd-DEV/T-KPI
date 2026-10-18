const express = require("express");
const employeeController = require("../../controllers/employees/employeeController");
const employeePerformanceController = require("../../controllers/employees/employeePerformanceController");
const auth = require("../../middleware/auth/auth");
const employeeListValidator = require("../../validators/employees/employeeListValidator");
const employeeIdValidator = require("../../validators/employees/employeeIdValidator");
const employeePerformanceValidator = require("../../validators/employees/employeePerformanceValidator");

const router = express.Router();

router.get("/", auth, employeeListValidator, employeeController.getEmployees);
router.get("/top", auth, employeeController.getTopEmployees);
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
