const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");
const { verifyToken } = require("../../security/tokenService");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401, true);
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("Unauthorized", 401, true);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;
