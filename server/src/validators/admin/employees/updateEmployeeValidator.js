"use strict";

const AppError = require("../../../utils/AppError");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUpdateEmployee(req, res, next) {
  const { id } = req.params || {};

  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    return next(new AppError("Invalid employee id", 400, true));
  }

  const { body } = req;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(new AppError("Invalid employee update payload", 400, true));
  }

  const keys = Object.keys(body);

  if (keys.length === 0) {
    return next(new AppError("Invalid employee update payload", 400, true));
  }

  const allowed = new Set(["employeeCode", "name"]);
  const invalidKeys = keys.filter((key) => !allowed.has(key));

  if (invalidKeys.length > 0) {
    return next(new AppError("Invalid employee update payload", 400, true));
  }

  if (Object.prototype.hasOwnProperty.call(body, "employeeCode")) {
    if (typeof body.employeeCode !== "string" || !body.employeeCode.trim()) {
      return next(new AppError("Invalid employee update payload", 400, true));
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return next(new AppError("Invalid employee update payload", 400, true));
    }
  }

  next();
}

module.exports = validateUpdateEmployee;
