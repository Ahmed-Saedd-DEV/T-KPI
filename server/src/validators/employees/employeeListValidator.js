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

  if (
    query.page !== undefined &&
    (!/^\d+$/.test(String(query.page)) || Number(query.page) < 1)
  ) {
    return next(new AppError("Invalid page number", 400, true));
  }

  if (
    query.limit !== undefined &&
    (!/^\d+$/.test(String(query.limit)) ||
      Number(query.limit) < 1 ||
      Number(query.limit) > 100)
  ) {
    return next(new AppError("Invalid limit value", 400, true));
  }

  if (query.search !== undefined && typeof query.search !== "string") {
    return next(new AppError("Invalid filter parameters", 400, true));
  }

  const mode =
    query.mode === undefined
      ? undefined
      : String(query.mode).trim().toLowerCase();
  if (mode !== undefined && !["latest-batch", "upload-date"].includes(mode)) {
    return next(new AppError("Invalid mode value", 400, true));
  }

  if (
    query.uploadDate !== undefined &&
    (query.mode === undefined || query.mode !== "upload-date")
  ) {
    return next(
      new AppError("uploadDate requires mode=upload-date", 400, true),
    );
  }

  if (mode === "upload-date") {
    if (
      query.uploadDate === undefined ||
      query.uploadDate === null ||
      String(query.uploadDate).trim() === ""
    ) {
      return next(
        new AppError("uploadDate is required when mode=upload-date", 400, true),
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(query.uploadDate))) {
      return next(new AppError("Invalid uploadDate value", 400, true));
    }

    const dateValue = new Date(`${String(query.uploadDate)}T00:00:00.000Z`);
    if (Number.isNaN(dateValue.getTime())) {
      return next(new AppError("Invalid uploadDate value", 400, true));
    }
  }

  const sortBy =
    query.sortBy === undefined
      ? undefined
      : String(query.sortBy).trim().toLowerCase();
  const order =
    query.order === undefined
      ? undefined
      : String(query.order).trim().toLowerCase();

  if (
    sortBy !== undefined &&
    sortBy !== "" &&
    !["score", "name", "orders", "employeeCode"].includes(sortBy)
  ) {
    return next(new AppError("Invalid sortBy value", 400, true));
  }

  if (order !== undefined) {
    if (!["asc", "desc"].includes(order)) {
      return next(new AppError("Invalid order value", 400, true));
    }

    if (sortBy === undefined || sortBy === "") {
      return next(
        new AppError("sortBy is required when order is provided", 400, true),
      );
    }
  }

  for (const key of SCORE_KEYS) {
    if (query[key] !== undefined && !isValidScoreValue(query[key])) {
      return next(new AppError("Invalid filter parameters", 400, true));
    }
  }

  next();
}

module.exports = validateEmployeeList;
