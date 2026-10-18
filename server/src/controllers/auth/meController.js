"use strict";

const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");
const { verifyToken } = require("../../security/tokenService");

async function getMe(req, res, next) {
  try {
    let currentUser = req.user;

    if (!currentUser) {
      const authHeader = req.headers.authorization || "";

      if (!authHeader.startsWith("Bearer ")) {
        throw new AppError("Unauthorized", 401, true);
      }

      const token = authHeader.slice("Bearer ".length).trim();
      const payload = verifyToken(token);

      currentUser = await prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          employeeId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!currentUser || !currentUser.isActive) {
        throw new AppError("Unauthorized", 401, true);
      }
    }

    res.status(200).json({
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      isActive: currentUser.isActive,
      employeeId: currentUser.employeeId,
      createdAt: currentUser.createdAt,
      updatedAt: currentUser.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMe };
