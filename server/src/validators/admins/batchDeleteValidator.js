"use strict";

const AppError = require("../../utils/AppError");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateBatchDelete(req, res, next) {
  const { id } = req.params || {};

  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    return next(new AppError("Invalid batch id", 400, true));
  }

  next();
}

module.exports = validateBatchDelete;
