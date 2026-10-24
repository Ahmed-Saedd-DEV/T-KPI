"use strict";

const AppError = require("../../../utils/AppError");

const VALID_ENTITY_TYPES = [
  "Employee",
  "ImportBatch",
  "BranchDailyMetric",
  "User",
];

const VALID_ACTIONS = ["CREATE", "UPDATE", "DELETE", "IMPORT", "BATCH_DELETE"];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(value, label) {
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

function validateAuditList(req, res, next) {
  const { entityType, action, from, to, limit } = req.query || {};

  try {
    if (entityType !== undefined && !VALID_ENTITY_TYPES.includes(entityType)) {
      return next(new AppError("Invalid entityType value", 400, true));
    }

    if (action !== undefined && !VALID_ACTIONS.includes(action)) {
      return next(new AppError("Invalid action value", 400, true));
    }

    if (from !== undefined) validateDate(from, "from");
    if (to !== undefined) validateDate(to, "to");

    if (from && to) {
      const fromDate = new Date(from + "T00:00:00.000Z");
      const toDate = new Date(to + "T00:00:00.000Z");

      if (fromDate > toDate) {
        return next(
          new AppError("from date must not be after to date", 400, true),
        );
      }
    }

    if (limit !== undefined) {
      const parsedLimit = Number(limit);
      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 200
      ) {
        return next(new AppError("Invalid limit value", 400, true));
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = validateAuditList;
