const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < 32) {
    throw new AppError("Authentication is not configured", 500, true);
  }

  return secret;
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "8h",
  });
}

function verifyToken(token) {
  if (typeof token !== "string" || token.trim() === "") {
    throw new AppError("Unauthorized", 401, true);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (!payload || !payload.sub) {
      throw new AppError("Unauthorized", 401, true);
    }

    return payload;
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      throw new AppError("Unauthorized", 401, true);
    }

    throw error;
  }
}

module.exports = {
  getJwtSecret,
  signToken,
  verifyToken,
};
