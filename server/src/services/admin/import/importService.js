"use strict";

const ExcelJS = require("exceljs");
const prisma = require("../../../prisma/prismaClient");
const importRepository = require("../../../repositories/importRepository");
const AppError = require("../../../utils/AppError");
const { createAuditLog } = require("../../../utils/audit/createAuditLog");

const REQUIRED_COLUMNS = [
  "Picker Rooster ID",
  "Name",
  "Successful Orders",
  "Averge Picking Time (m)",
  "Averge assignment_time (m)",
  "prep time",
  "Average Store Dispatch Time (m)",
  "cr",
];

function toTrimmedString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function parsePositiveInteger(value) {
  const stringValue = toTrimmedString(value);

  if (stringValue === "") {
    return null;
  }

  const numericValue = Number(stringValue);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function parseNonNegativeInteger(value) {
  const stringValue = toTrimmedString(value);

  if (stringValue === "") {
    return null;
  }

  const numericValue = Number(stringValue);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
}

function parsePositiveFiniteNumber(value) {
  const stringValue = toTrimmedString(value);

  if (stringValue === "") {
    return null;
  }

  const numericValue = Number(stringValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function parseRowData(row, headerMap, rowNumber) {
  const employeeCodeRaw = row.getCell(headerMap["Picker Rooster ID"]).value;
  const nameRaw = row.getCell(headerMap["Name"]).value;
  const ordersRaw = row.getCell(headerMap["Successful Orders"]).value;
  const pickingTimeRaw = row.getCell(
    headerMap["Averge Picking Time (m)"],
  ).value;
  const assignmentTimeRaw = row.getCell(
    headerMap["Averge assignment_time (m)"],
  ).value;
  const prepTimeRaw = row.getCell(headerMap["prep time"]).value;
  const dispatchTimeRaw = row.getCell(
    headerMap["Average Store Dispatch Time (m)"],
  ).value;
  const opsCRRaw = row.getCell(headerMap["cr"]).value;

  const employeeCode = parsePositiveInteger(employeeCodeRaw);
  const name = toTrimmedString(nameRaw);
  const orders = parseNonNegativeInteger(ordersRaw);
  const pickingTime = parsePositiveFiniteNumber(pickingTimeRaw);
  const assignmentTime = parsePositiveFiniteNumber(assignmentTimeRaw);
  const prepTime = parsePositiveFiniteNumber(prepTimeRaw);
  const dispatchTime = parsePositiveFiniteNumber(dispatchTimeRaw);
  const opsCR = parsePositiveFiniteNumber(opsCRRaw);

  if (
    employeeCode === null ||
    name === "" ||
    orders === null ||
    pickingTime === null ||
    assignmentTime === null ||
    prepTime === null ||
    dispatchTime === null ||
    opsCR === null
  ) {
    throw new AppError(
      `Invalid row data at row ${rowNumber}: required fields are missing or malformed`,
      400,
      true,
    );
  }

  return {
    employeeCode,
    name,
    orders,
    pickingTime,
    assignmentTime,
    prepTime,
    dispatchTime,
    opsCR,
  };
}

async function markFailedImport(batchId, error, actor = null) {
  try {
    await importRepository.updateBatch(batchId, { status: "FAILED" });
  } catch (statusError) {
    console.error("Failed import status update failed", {
      batchId,
      originalError: error && error.message ? error.message : String(error),
      statusError:
        statusError && statusError.message
          ? statusError.message
          : String(statusError),
    });
  }

  try {
    await createAuditLog({
      action: "IMPORT",
      entityType: "ImportBatch",
      entityId: batchId,
      beforeData: null,
      afterData: {
        status: "FAILED",
        error: error && error.message ? error.message : "Import failed",
      },
      actor,
    });
  } catch (auditError) {
    console.error("Failed import audit logging failed", {
      batchId,
      auditError:
        auditError && auditError.message
          ? auditError.message
          : String(auditError),
    });
  }
}

async function importEmployeesFromExcel(
  filePath,
  originalFileName,
  uploadedById,
  actor = null,
) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet("Pickers");

  if (!worksheet) {
    throw new AppError(
      "Invalid file: worksheet 'Pickers' not found",
      400,
      true,
    );
  }

  const headerRow = worksheet.getRow(1);
  const headerMap = {};

  for (let col = 1; col <= headerRow.cellCount; col += 1) {
    const cellValue = headerRow.getCell(col).value;
    const headerName = toTrimmedString(cellValue);

    if (headerName) {
      headerMap[headerName] = col;
    }
  }

  const hasAllColumns = REQUIRED_COLUMNS.every((columnName) =>
    Object.prototype.hasOwnProperty.call(headerMap, columnName),
  );

  if (!hasAllColumns) {
    throw new AppError("Invalid file: missing required columns", 400, true);
  }

  const importRows = [];
  let totalRows = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    let hasAnyValue = false;

    for (let col = 1; col <= row.cellCount; col += 1) {
      const cellValue = row.getCell(col).value;
      const normalized = toTrimmedString(cellValue);

      if (normalized !== "") {
        hasAnyValue = true;
        break;
      }
    }

    if (!hasAnyValue) {
      continue;
    }

    totalRows += 1;
    importRows.push(parseRowData(row, headerMap, rowNumber));
  }

  const batch = await importRepository.createBatch({
    fileName: originalFileName,
    periodStart: new Date(),
    periodEnd: new Date(),
    status: "PROCESSING",
    uploadedById,
  });

  try {
    await prisma.$transaction(async (tx) => {
      let successCount = 0;

      for (const record of importRows) {
        let employee = await importRepository.findEmployeeByCode(
          String(record.employeeCode),
          tx,
        );

        if (!employee) {
          employee = await importRepository.createEmployee(
            {
              employeeCode: String(record.employeeCode),
              name: String(record.name),
            },
            tx,
          );
        }

        await importRepository.createPerformance(
          {
            employeeId: employee.id,
            importBatchId: batch.id,
            periodStart: batch.periodStart,
            periodEnd: batch.periodEnd,
            orders: Number(record.orders),
            opsCR: Number(record.opsCR),
            dispatchTime: Number(record.dispatchTime),
            pickingTime: Number(record.pickingTime),
            assignmentTime: Number(record.assignmentTime),
            prepTime: Number(record.prepTime),
          },
          tx,
        );

        successCount += 1;
      }

      await importRepository.updateBatch(batch.id, { status: "COMPLETED" }, tx);

      await createAuditLog({
        action: "IMPORT",
        entityType: "ImportBatch",
        entityId: batch.id,
        beforeData: null,
        afterData: {
          fileName: batch.fileName,
          totalRows,
          successCount,
          errorCount: totalRows - successCount,
        },
        actor,
        tx,
      });
    });

    return {
      batchId: batch.id,
      status: "COMPLETED",
      totalRows,
      successCount: totalRows,
      failedCount: 0,
      errors: [],
    };
  } catch (error) {
    await markFailedImport(batch.id, error, actor);
    throw error;
  }
}

module.exports = { importEmployeesFromExcel };
