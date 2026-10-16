const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");

async function getEmployees() {
  return prisma.employee.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getEmployeeById(id) {
  const employee = await prisma.employee.findUnique({
    where: {
      id,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found", 404, true);
  }

  return employee;
}

async function getEmployeeByCode(employeeCode) {
  const employee = await prisma.employee.findUnique({
    where: {
      employeeCode,
    },
  });

  if (!employee) {
    throw new AppError("Employee not found", 404, true);
  }

  return employee;
}

async function createEmployee(data = {}) {
  const employeeCode =
    typeof data.employeeCode === "string" ? data.employeeCode.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (!employeeCode || !name) {
    throw new AppError("Employee code and name are required", 400, true);
  }

  try {
    return await prisma.employee.create({
      data: {
        employeeCode,
        name,
      },
    });
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError("Employee code already exists", 409, true);
    }

    throw error;
  }
}

async function updateEmployee(id, data = {}) {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(data, "employeeCode")) {
    const employeeCode =
      typeof data.employeeCode === "string" ? data.employeeCode.trim() : "";

    if (!employeeCode) {
      throw new AppError("Employee code is required", 400, true);
    }

    updates.employeeCode = employeeCode;
  }

  if (Object.prototype.hasOwnProperty.call(data, "name")) {
    const name = typeof data.name === "string" ? data.name.trim() : "";

    if (!name) {
      throw new AppError("Employee name is required", 400, true);
    }

    updates.name = name;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("Employee update payload is required", 400, true);
  }

  const existingEmployee = await prisma.employee.findUnique({
    where: {
      id,
    },
  });

  if (!existingEmployee) {
    throw new AppError("Employee not found", 404, true);
  }

  if (
    updates.employeeCode &&
    updates.employeeCode !== existingEmployee.employeeCode
  ) {
    const duplicateEmployee = await prisma.employee.findUnique({
      where: {
        employeeCode: updates.employeeCode,
      },
    });

    if (duplicateEmployee && duplicateEmployee.id !== id) {
      throw new AppError("Employee code already exists", 409, true);
    }
  }

  try {
    return await prisma.employee.update({
      where: {
        id,
      },
      data: updates,
    });
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError("Employee code already exists", 409, true);
    }

    throw error;
  }
}

async function deleteEmployee(id, actor = null) {
  const existingEmployee = await prisma.employee.findUnique({
    where: {
      id,
    },
  });

  if (!existingEmployee) {
    throw new AppError("Employee not found", 404, true);
  }

  const actorSnapshot =
    actor && typeof actor === "object"
      ? {
          id: actor.id || null,
          email: actor.email || null,
          role: actor.role || null,
        }
      : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.employeePerformance.deleteMany({
        where: {
          employeeId: id,
        },
      });

      await tx.employee.delete({
        where: {
          id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entityType: "Employee",
          entityId: id,
          beforeData: existingEmployee,
          actorUserId: actor && actor.id ? actor.id : null,
          actorSnapshot: actorSnapshot,
        },
      });
    });

    return null;
  } catch (error) {
    if (error && error.code === "P2025") {
      throw new AppError("Employee not found", 404, true);
    }

    throw error;
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  getEmployeeByCode,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
