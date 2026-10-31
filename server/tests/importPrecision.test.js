const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ExcelJS = require("exceljs");
const Module = require("node:module");

function loadImportServiceWithStubbedRepository(fakeRepo) {
  const originalLoad = Module._load;
  const importServicePath =
    require.resolve("../src/services/admin/import/importService.js");

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "../../../repositories/importRepository") {
      return fakeRepo;
    }

    return originalLoad.apply(this, arguments);
  };

  delete require.cache[importServicePath];
  const service = require(importServicePath);
  Module._load = originalLoad;

  return service;
}

async function writeWorkbookForImport(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pickers");

  sheet.addRow([
    "Picker Rooster ID",
    "Name",
    "Successful Orders",
    "Averge Picking Time (m)",
    "Averge assignment_time (m)",
    "prep time",
    "Average Store Dispatch Time (m)",
    "cr",
  ]);

  for (const row of rows) {
    sheet.addRow(row);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "talabat-kpi-import-"));
  const filePath = path.join(tmpDir, "test-import.xlsx");
  await workbook.xlsx.writeFile(filePath);

  return {
    filePath,
    cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
  };
}

test("import parsing preserves 0.0175 and 0.00001 without backend changes", async () => {
  const seen = [];
  const fakeRepo = {
    createBatch: async (data) => ({ id: "batch-1", ...data }),
    updateBatch: async () => {},
    findEmployeeByCode: async () => null,
    createEmployee: async ({ employeeCode, name }) => ({
      id: `emp-${employeeCode}`,
      employeeCode,
      name,
    }),
    createPerformance: async (data) => {
      seen.push(data);
      return data;
    },
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepository(fakeRepo);
  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Emp 33174", 10, 2.5, 1.2, 3.3, 4.4, 0.0175],
    [33175, "Emp 33175", 11, 2.6, 1.3, 3.4, 4.5, 0.00001],
  ]);

  try {
    const result = await importEmployeesFromExcel(
      filePath,
      "test.xlsx",
      "user-1",
    );

    assert.equal(result.successCount, 2);
    assert.equal(result.failedCount, 0);
    assert.equal(seen[0].opsCR, 0.0175);
    assert.equal(seen[1].opsCR, 0.00001);
  } finally {
    cleanup();
  }
});

test("import validation rejects zero and invalid CR values using production parsing rules", async () => {
  const seen = [];
  const fakeRepo = {
    createBatch: async (data) => ({ id: "batch-1", ...data }),
    updateBatch: async () => {},
    findEmployeeByCode: async () => null,
    createEmployee: async ({ employeeCode, name }) => ({
      id: `emp-${employeeCode}`,
      employeeCode,
      name,
    }),
    createPerformance: async (data) => {
      seen.push(data);
      return data;
    },
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepository(fakeRepo);
  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Zero CR", 10, 2.5, 1.2, 3.3, 4.4, 0],
    [33175, "Invalid CR", 11, 2.6, 1.3, 3.4, 4.5, "bad-value"],
    [33176, "Valid CR", 12, 2.7, 1.4, 3.5, 4.6, 0.0001],
  ]);

  try {
    const result = await importEmployeesFromExcel(
      filePath,
      "invalid.xlsx",
      "user-1",
    );

    assert.equal(result.successCount, 1);
    assert.equal(result.failedCount, 2);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].opsCR, 0.0001);
    assert.equal(result.errors.length, 2);
  } finally {
    cleanup();
  }
});
