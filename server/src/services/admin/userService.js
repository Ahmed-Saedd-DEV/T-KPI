"use strict";

const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");

function isValidUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    employeeId: user.employeeId ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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
  return users.map(sanitizeUser);
}

async function getUserById(id) {
  if (!isValidUuid(id)) {
    throw new AppError("Invalid user id", 400, true);
  }

  const user = await prisma.user.findUnique({
    where: { id },
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

  if (!user) {
    throw new AppError("User not found", 404, true);
  }

  return sanitizeUser(user);
}

async function updateUser(id, data = {}) {
  if (!isValidUuid(id)) {
    throw new AppError("Invalid user id", 400, true);
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError("User not found", 404, true);
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(data, "email")) {
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Invalid email", 400, true);
    }
    updates.email = email;
  }

  if (Object.prototype.hasOwnProperty.call(data, "role")) {
    if (!["ADMIN", "USER"].includes(data.role)) {
      throw new AppError("Invalid role", 400, true);
    }
    updates.role = data.role;
  }

  if (Object.prototype.hasOwnProperty.call(data, "isActive")) {
    if (typeof data.isActive !== "boolean") {
      throw new AppError("isActive must be a boolean", 400, true);
    }
    updates.isActive = data.isActive;
  }

  if (Object.prototype.hasOwnProperty.call(data, "employeeId")) {
    if (data.employeeId === null) {
      updates.employeeId = null;
    } else {
      if (!isValidUuid(data.employeeId)) {
        throw new AppError("Invalid employee id", 400, true);
      }
      const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
      });
      if (!employee) {
        throw new AppError("Employee not found", 404, true);
      }
      const alreadyLinked = await prisma.user.findFirst({
        where: {
          employeeId: data.employeeId,
          id: { not: id },
        },
      });
      if (alreadyLinked) {
        throw new AppError(
          "Employee is already linked to another user",
          409,
          true,
        );
      }
      updates.employeeId = data.employeeId;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("Update payload is required", 400, true);
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updates,
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
    return sanitizeUser(updated);
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError("Email already in use", 409, true);
    }
    throw error;
  }
}

async function deleteUser(id) {
  if (!isValidUuid(id)) {
    throw new AppError("Invalid user id", 400, true);
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError("User not found", 404, true);
  }

  try {
    await prisma.user.delete({ where: { id } });
    return null;
  } catch (error) {
    if (error && error.code === "P2025") {
      throw new AppError("User not found", 404, true);
    }
    throw error;
  }
}

module.exports = { getUsers, getUserById, updateUser, deleteUser };
