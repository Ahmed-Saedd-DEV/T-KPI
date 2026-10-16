const AppError = require("../../utils/AppError");

function authorize(...allowedRoles) {
  const roles = allowedRoles.flat();

  if (!roles.length) {
    throw new AppError("Authorization configuration error", 500, true);
  }

  const normalizedRoles = roles.map((role) =>
    String(role).trim().toUpperCase(),
  );

  if (normalizedRoles.some((role) => !role)) {
    throw new AppError("Authorization configuration error", 500, true);
  }

  return function authorizeRole(req, res, next) {
    const user = req && req.user;

    if (!user || typeof user !== "object") {
      next(new AppError("Unauthorized", 401, true));
      return;
    }

    const userRole =
      typeof user.role === "string" ? user.role.trim().toUpperCase() : "";

    if (!userRole || !normalizedRoles.includes(userRole)) {
      next(new AppError("Forbidden", 403, true));
      return;
    }

    next();
  };
}

module.exports = authorize;
