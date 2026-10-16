const AppError = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const message =
    err instanceof AppError ? err.message : "Internal server error";

  if (statusCode >= 500) {
    console.error("Unhandled application error", {
      method: req.method,
      url: req.originalUrl,
      name: err?.name || "UnknownError",
      statusCode,
      isOperational,
    });
  } else {
    console.warn("Application error", {
      method: req.method,
      url: req.originalUrl,
      name: err?.name || "AppError",
      statusCode,
      isOperational,
    });
  }

  res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message,
  });
}

module.exports = errorHandler;
