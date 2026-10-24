"use strict";

const AppError = require("../../../utils/AppError");

const VALID_STATUSES = ["PROCESSING", "COMPLETED", "FAILED"];

function validateBatchList(req, res, next) {
  const { status, limit } = req.query || {};

  if (status !== undefined) {
    const normalized = String(status).toUpperCase();
    if (!VALID_STATUSES.includes(normalized)) {
      return next(new AppError("Invalid status value", 400, true));
    }
    req.query.status = normalized;
  }

  if (limit !== undefined) {
    const normalizedLimit = Number(limit);
    if (
      !Number.isInteger(normalizedLimit) ||
      normalizedLimit < 1 ||
      normalizedLimit > 100
    ) {
      return next(new AppError("Invalid limit value", 400, true));
    }
  }

  return next();
}

module.exports = validateBatchList;
