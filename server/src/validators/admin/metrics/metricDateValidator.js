"use strict";

const AppError = require("../../../utils/AppError");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateMetricDate(req, res, next) {
  const { date } = req.params || {};

  if (typeof date !== "string" || !DATE_REGEX.test(date)) {
    return next(
      new AppError("Invalid date format (expected YYYY-MM-DD)", 400, true),
    );
  }

  const parsed = new Date(date + "T00:00:00.000Z");

  if (Number.isNaN(parsed.getTime())) {
    return next(
      new AppError("Invalid date format (expected YYYY-MM-DD)", 400, true),
    );
  }

  next();
}

module.exports = validateMetricDate;
