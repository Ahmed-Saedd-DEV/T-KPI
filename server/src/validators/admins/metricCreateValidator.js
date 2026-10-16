"use strict";

const AppError = require("../../utils/AppError");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value) {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) {
    return false;
  }

  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime());
}

function validateMetricCreate(req, res, next) {
  const { body } = req;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(
      new AppError(
        "Invalid or missing metricDate (expected YYYY-MM-DD)",
        400,
        true,
      ),
    );
  }

  const { metricDate, opsCR, dispatchTime, prepTime, assignmentTime } = body;

  if (!isValidDateString(metricDate)) {
    return next(
      new AppError(
        "Invalid or missing metricDate (expected YYYY-MM-DD)",
        400,
        true,
      ),
    );
  }

  const required = [
    ["opsCR", opsCR],
    ["dispatchTime", dispatchTime],
    ["prepTime", prepTime],
    ["assignmentTime", assignmentTime],
  ];

  for (const [field, value] of required) {
    if (value === undefined || value === null || value === "") {
      return next(new AppError(`${field} is required`, 400, true));
    }

    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return next(new AppError(`Invalid value for ${field}`, 400, true));
    }
  }

  next();
}

module.exports = validateMetricCreate;
