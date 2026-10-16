"use strict";

const AppError = require("../../utils/AppError");

const SCORE_KEYS = [
  "minScore",
  "maxScore",
  "minOpsCR",
  "maxOpsCR",
  "minDispatchTime",
  "maxDispatchTime",
  "minPickingTime",
  "maxPickingTime",
  "minAssignmentTime",
  "maxAssignmentTime",
  "minPrepTime",
  "maxPrepTime",
];

function isValidScoreValue(value) {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && num <= 100;
}

function validateEmployeeList(req, res, next) {
  const { query } = req;

  if (query.search !== undefined && typeof query.search !== "string") {
    return next(new AppError("Invalid filter parameters", 400, true));
  }

  for (const key of SCORE_KEYS) {
    if (query[key] !== undefined && !isValidScoreValue(query[key])) {
      return next(new AppError("Invalid filter parameters", 400, true));
    }
  }

  next();
}

module.exports = validateEmployeeList;
