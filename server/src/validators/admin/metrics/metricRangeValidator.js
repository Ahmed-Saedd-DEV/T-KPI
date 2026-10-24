"use strict";

const AppError = require("../../../utils/AppError");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateRangeDate(value, label) {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) {
    throw new AppError(
      `Invalid ${label} date (expected YYYY-MM-DD)`,
      400,
      true,
    );
  }

  const parsed = new Date(value + "T00:00:00.000Z");

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(
      `Invalid ${label} date (expected YYYY-MM-DD)`,
      400,
      true,
    );
  }
}

function validateMetricRange(req, res, next) {
  const { from, to } = req.query || {};

  if (from === undefined && to === undefined) {
    return next();
  }

  try {
    if (from !== undefined) validateRangeDate(from, "from");
    if (to !== undefined) validateRangeDate(to, "to");

    if (
      from &&
      to &&
      new Date(from + "T00:00:00.000Z") > new Date(to + "T00:00:00.000Z")
    ) {
      return next(
        new AppError("from date must not be after to date", 400, true),
      );
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = validateMetricRange;
