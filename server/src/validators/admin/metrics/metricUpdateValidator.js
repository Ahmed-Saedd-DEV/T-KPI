"use strict";

const AppError = require("../../../utils/AppError");

const ALLOWED_FIELDS = new Set([
  "opsCR",
  "dispatchTime",
  "prepTime",
  "assignmentTime",
  "recordedAt",
]);

function isValidIsoDateTime(value) {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateMetricUpdate(req, res, next) {
  const { body } = req;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(new AppError("Update payload is required", 400, true));
  }

  const keys = Object.keys(body);

  if (keys.length === 0) {
    return next(new AppError("Update payload is required", 400, true));
  }

  const unknownFields = keys.filter((key) => !ALLOWED_FIELDS.has(key));
  if (unknownFields.length > 0) {
    return next(new AppError("Invalid fields in update payload", 400, true));
  }

  for (const field of keys) {
    const value = body[field];

    if (field === "recordedAt") {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      if (!isValidIsoDateTime(value)) {
        return next(
          new AppError(
            "recordedAt must be a valid ISO 8601 datetime",
            400,
            true,
          ),
        );
      }
      continue;
    }

    const num = Number(value);

    if (!Number.isFinite(num) || num <= 0) {
      return next(new AppError(`Invalid value for ${field}`, 400, true));
    }
  }

  next();
}

module.exports = validateMetricUpdate;
