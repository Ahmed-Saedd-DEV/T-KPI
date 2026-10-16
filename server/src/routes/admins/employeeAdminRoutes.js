const express = require("express");
const employeeController = require("../../controllers/admins/employeeAdminController");
const auth = require("../../middleware/auth/auth");
const authorize = require("../../middleware/auth/authorize");
const createEmployeeValidator = require("../../validators/admins/createEmployeeValidator");
const updateEmployeeValidator = require("../../validators/admins/updateEmployeeValidator");
const deleteEmployeeValidator = require("../../validators/admins/deleteEmployeeValidator");

const router = express.Router();

router.post(
  "/employees",
  auth,
  authorize("ADMIN"),
  createEmployeeValidator,
  employeeController.createEmployee,
);

router.patch(
  "/employees/:id",
  auth,
  authorize("ADMIN"),
  updateEmployeeValidator,
  employeeController.updateEmployee,
);

router.delete(
  "/employees/:id",
  auth,
  authorize("ADMIN"),
  deleteEmployeeValidator,
  employeeController.deleteEmployee,
);

module.exports = router;
