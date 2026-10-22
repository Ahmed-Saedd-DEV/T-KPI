"use strict";

const ExcelJS = require("exceljs");
const importRepository = require("../../../repositories/importRepository");
const AppError = require("../../../utils/AppError");

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

const COLUMN_MAP = {
  "Picker Rooster ID": "employeeCode",
  Name: "name",
  "Successful Orders": "orders",
  "Averge Picking Time (m)": "pickingTime",
  "Averge assignment_time (m)": "assignmentTime",
  "prep time": "prepTime",
  "Average Store Dispatch Time (m)": "dispatchTime",
  cr: "opsCR",
};

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

async function importEmployeesFromExcel(
  filePath,
  originalFileName,
  uploadedById,
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

  const batch = await importRepository.createBatch({
    fileName: originalFileName,
    periodStart: new Date(),
    periodEnd: new Date(),
    status: "PROCESSING",
    uploadedById,
  });

  let successCount = 0;
  let totalRows = 0;
  const errors = [];

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

    try {
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
        throw new Error("Invalid row data");
      }

      let employee = await importRepository.findEmployeeByCode(
        String(employeeCode),
      );

      if (!employee) {
        employee = await importRepository.createEmployee({
          employeeCode: String(employeeCode),
          name: String(name),
        });
      }

      await importRepository.createPerformance({
        employeeId: employee.id,
        importBatchId: batch.id,
        periodStart: batch.periodStart,
        periodEnd: batch.periodEnd,
        orders: Number(orders),
        opsCR: Number(opsCR),
        dispatchTime: Number(dispatchTime),
        pickingTime: Number(pickingTime),
        assignmentTime: Number(assignmentTime),
        prepTime: Number(prepTime),
      });

      successCount += 1;
    } catch (error) {
      errors.push({
        row: rowNumber,
        reason: error && error.message ? error.message : "Unknown error",
      });
    }
  }

  const finalStatus = successCount > 0 ? "COMPLETED" : "FAILED";

  await importRepository.updateBatch(batch.id, { status: finalStatus });

  return {
    batchId: batch.id,
    status: finalStatus,
    totalRows,
    successCount,
    failedCount: totalRows - successCount,
    errors,
  };
}

module.exports = { importEmployeesFromExcel };
