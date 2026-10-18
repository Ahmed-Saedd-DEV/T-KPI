"use strict";

const AppError = require("../../utils/AppError");

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 12 characters and contain uppercase, lowercase, number, and special character.";

function validatePasswordPolicy(password) {
  if (typeof password !== "string") {
    return false;
  }

  const hasMinLength = password.length >= 12;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSymbol;
}

function validateRegister(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Invalid registration data", 400, true));
  }

  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return next(new AppError("Invalid registration data", 400, true));
  }

  if (!validatePasswordPolicy(password)) {
    return next(new AppError(PASSWORD_POLICY_MESSAGE, 400, true));
  }

  next();
}

module.exports = validateRegister;
module.exports.validatePasswordPolicy = validatePasswordPolicy;
module.exports.PASSWORD_POLICY_MESSAGE = PASSWORD_POLICY_MESSAGE;
