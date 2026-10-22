"use strict";

const AppError = require("../../../utils/AppError");

function validateImportFile(req, res, next) {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400, true));
  }

  if (!/\.xlsx$/i.test(req.file.originalname || "")) {
    return next(new AppError("Only .xlsx files are allowed", 400, true));
  }

  next();
}

module.exports = validateImportFile;
