"use strict";

const AppError = require("../../utils/AppError");

function validateCreateEmployee(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Employee code and name are required", 400, true));
  }

  const { employeeCode, name } = req.body;

  if (employeeCode === undefined || employeeCode === null) {
    return next(new AppError("Employee code and name are required", 400, true));
  }

  if (typeof employeeCode !== "string") {
    return next(new AppError("Invalid employee data", 400, true));
  }

  if (!employeeCode.trim()) {
    return next(new AppError("Employee code and name are required", 400, true));
  }

  if (name === undefined || name === null) {
    return next(new AppError("Employee code and name are required", 400, true));
  }

  if (typeof name !== "string") {
    return next(new AppError("Invalid employee data", 400, true));
  }

  if (!name.trim()) {
    return next(new AppError("Employee code and name are required", 400, true));
  }

  next();
}

module.exports = validateCreateEmployee;
