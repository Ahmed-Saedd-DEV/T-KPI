const employeeRepository = require("../../repositories/employeeRepository");
const AppError = require("../../utils/AppError");
const { createAuditLog } = require("../../utils/audit/createAuditLog");

async function getEmployees() {
  return employeeRepository.findAll();
}

async function getEmployeeById(id) {
  const employee = await employeeRepository.findById(id);

  if (!employee) {
    throw new AppError("Employee not found", 404, true);
  }

  return employee;
}

async function getEmployeeByCode(employeeCode) {
  const employee = await employeeRepository.findByCode(employeeCode);

  if (!employee) {
    throw new AppError("Employee not found", 404, true);
  }

  return employee;
}

async function createEmployee(data = {}, actor = null) {
  const employeeCode =
    typeof data.employeeCode === "string" ? data.employeeCode.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (!employeeCode || !name) {
    throw new AppError("Employee code and name are required", 400, true);
  }

  try {
    const created = await employeeRepository.create({ employeeCode, name });

    await createAuditLog({
      action: "CREATE",
      entityType: "Employee",
      entityId: created.id,
      beforeData: null,
      afterData: {
        id: created.id,
        employeeCode: created.employeeCode,
        name: created.name,
      },
      actor,
    });

    return created;
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError("Employee code already exists", 409, true);
    }

    throw error;
  }
}

async function updateEmployee(id, data = {}, actor = null) {
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

  const existingEmployee = await employeeRepository.findById(id);

  if (!existingEmployee) {
    throw new AppError("Employee not found", 404, true);
  }

  if (
    updates.employeeCode &&
    updates.employeeCode !== existingEmployee.employeeCode
  ) {
    const duplicateEmployee = await employeeRepository.findByCode(
      updates.employeeCode,
    );

    if (duplicateEmployee && duplicateEmployee.id !== id) {
      throw new AppError("Employee code already exists", 409, true);
    }
  }

  try {
    const updated = await employeeRepository.update(id, updates);

    await createAuditLog({
      action: "UPDATE",
      entityType: "Employee",
      entityId: id,
      beforeData: {
        id: existingEmployee.id,
        employeeCode: existingEmployee.employeeCode,
        name: existingEmployee.name,
      },
      afterData: {
        id: updated.id,
        employeeCode: updated.employeeCode,
        name: updated.name,
      },
      actor,
    });

    return updated;
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError("Employee code already exists", 409, true);
    }

    throw error;
  }
}

async function deleteEmployee(id, actor = null) {
  const existingEmployee = await employeeRepository.findById(id);

  if (!existingEmployee) {
    throw new AppError("Employee not found", 404, true);
  }

  try {
    await require("../../prisma/prismaClient").$transaction(async (tx) => {
      await employeeRepository.deletePerformancesByEmployeeId(id, tx);
      await employeeRepository.deleteById(id, tx);

      await createAuditLog({
        action: "DELETE",
        entityType: "Employee",
        entityId: id,
        beforeData: {
          id: existingEmployee.id,
          employeeCode: existingEmployee.employeeCode,
          name: existingEmployee.name,
        },
        afterData: null,
        actor,
        tx,
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
