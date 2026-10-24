"use strict";

const employeeRepository = require("../../repositories/employeeRepository");
const AppError = require("../../utils/AppError");
const { calculateKpiScore } = require("../../domain/kpi/kpiCalculator");

function isValidUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

async function getEmployeePerformance(id) {
  if (!isValidUuid(id)) {
    throw new AppError("Invalid employee id", 400, true);
  }

  const employee = await employeeRepository.findById(id);

  if (!employee) {
    throw new AppError("Employee not found", 404, true);
  }

  const records =
    await employeeRepository.findPerformanceRecordsByEmployeeId(id);

  const performance = records.map((record) => {
    const metrics = {
      opsCR: Number(record.opsCR),
      dispatchTime: Number(record.dispatchTime),
      pickingTime: Number(record.pickingTime),
      assignmentTime: Number(record.assignmentTime),
      prepTime: Number(record.prepTime),
    };

    const kpi = calculateKpiScore(metrics);

    return {
      batchId: record.importBatch.id,
      fileName: record.importBatch.fileName,
      importedAt: record.importBatch.createdAt,
      orders: record.orders,
      metrics,
      kpi,
    };
  });

  return {
    employee: {
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
    },
    performance,
  };
}

module.exports = { getEmployeePerformance };
