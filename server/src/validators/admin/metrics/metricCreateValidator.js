"use strict";

const AppError = require("../../../utils/AppError");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value) {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) {
    return false;
  }

  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime());
}

function isValidIsoDateTime(value) {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
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

  const {
    metricDate,
    recordedAt,
    opsCR,
    dispatchTime,
    prepTime,
    assignmentTime,
    orderCount,
    atVendorTime,
    adjustTime,
  } = body;

  if (!isValidDateString(metricDate)) {
    return next(
      new AppError(
        "Invalid or missing metricDate (expected YYYY-MM-DD)",
        400,
        true,
      ),
    );
  }

  if (recordedAt !== undefined && recordedAt !== null && recordedAt !== "") {
    if (!isValidIsoDateTime(recordedAt)) {
      return next(
        new AppError("recordedAt must be a valid ISO 8601 datetime", 400, true),
      );
    }

    const recordedDate = new Date(recordedAt);
    const metricDatePart = new Date(metricDate + "T00:00:00.000Z");
    if (
      recordedDate.getUTCFullYear() !== metricDatePart.getUTCFullYear() ||
      recordedDate.getUTCMonth() !== metricDatePart.getUTCMonth() ||
      recordedDate.getUTCDate() !== metricDatePart.getUTCDate()
    ) {
      return next(
        new AppError("recordedAt date must match metricDate", 400, true),
      );
    }
  }

  const optional = [
    ["opsCR", opsCR],
    ["dispatchTime", dispatchTime],
    ["prepTime", prepTime],
    ["assignmentTime", assignmentTime],
    ["orderCount", orderCount],
    ["atVendorTime", atVendorTime],
    ["adjustTime", adjustTime],
  ];

  for (const [field, value] of optional) {
    if (value === undefined || value === null || value === "") continue;

    const num = Number(value);
    const allowsAnyFiniteNumber = [
      "orderCount",
      "atVendorTime",
      "adjustTime",
    ].includes(field);

    if (!Number.isFinite(num) || (!allowsAnyFiniteNumber && num <= 0)) {
      return next(new AppError(`Invalid value for ${field}`, 400, true));
    }
  }

  next();
}

module.exports = validateMetricCreate;
