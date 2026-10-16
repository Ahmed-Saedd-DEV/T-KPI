"use strict";

const AppError = require("../../utils/AppError");

function validateLogin(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Invalid credentials", 401, true));
  }

  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return next(new AppError("Invalid credentials", 401, true));
  }

  if (typeof password !== "string" || !password.trim()) {
    return next(new AppError("Invalid credentials", 401, true));
  }

  next();
}

module.exports = validateLogin;
