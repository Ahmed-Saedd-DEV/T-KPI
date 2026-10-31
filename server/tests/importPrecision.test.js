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
  const calls = {
    createBatch: 0,
    createEmployee: 0,
    createPerformance: 0,
    updateBatch: 0,
  };

  const fakeRepo = {
    createBatch: async (data) => {
      calls.createBatch += 1;
      return { id: "batch-1", ...data };
    },
    updateBatch: async () => {
      calls.updateBatch += 1;
      return {};
    },
    findEmployeeByCode: async () => null,
    createEmployee: async ({ employeeCode, name }) => {
      calls.createEmployee += 1;
      return { id: `emp-${employeeCode}`, employeeCode, name };
    },
    createPerformance: async (data) => {
      calls.createPerformance += 1;
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
    await assert.rejects(
      () => importEmployeesFromExcel(filePath, "invalid.xlsx", "user-1"),
      /Invalid row data/i,
    );

    assert.equal(calls.createBatch, 0);
    assert.equal(calls.createEmployee, 0);
    assert.equal(calls.createPerformance, 0);
    assert.equal(calls.updateBatch, 0);
  } finally {
    cleanup();
  }
});

test("import rejects any invalid required row before creating any performance data", async () => {
  const calls = {
    createBatch: 0,
    createEmployee: 0,
    createPerformance: 0,
    updateBatch: 0,
  };

  const fakeRepo = {
    createBatch: async (data) => {
      calls.createBatch += 1;
      return { id: "batch-1", ...data };
    },
    updateBatch: async () => {
      calls.updateBatch += 1;
      return {};
    },
    findEmployeeByCode: async () => null,
    createEmployee: async ({ employeeCode, name }) => {
      calls.createEmployee += 1;
      return { id: `emp-${employeeCode}`, employeeCode, name };
    },
    createPerformance: async (data) => {
      calls.createPerformance += 1;
      return data;
    },
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepository(fakeRepo);
  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Valid Row", 10, 2.5, 1.2, 3.3, 4.4, 0.0175],
    [33175, "Bad Row", 11, 2.6, 1.3, 3.4, 4.5, 0],
    [33176, "Another Valid Row", 12, 2.7, 1.4, 3.5, 4.6, 0.0001],
  ]);

  try {
    await assert.rejects(
      () => importEmployeesFromExcel(filePath, "strict.xlsx", "user-1"),
      /Invalid row data/i,
    );

    assert.equal(calls.createBatch, 0);
    assert.equal(calls.createEmployee, 0);
    assert.equal(calls.createPerformance, 0);
    assert.equal(calls.updateBatch, 0);
  } finally {
    cleanup();
  }
});

function withMockTransaction(tx, callback) {
  const prisma = require("../src/prisma/prismaClient");
  const originalTransaction = prisma.$transaction;
  prisma.$transaction = async (transactionCallback) => transactionCallback(tx);

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      prisma.$transaction = originalTransaction;
    });
}

function loadImportServiceWithStubbedRepositoryAndAudit(
  fakeRepo,
  fakeAuditLogger,
) {
  const originalLoad = Module._load;
  const importServicePath =
    require.resolve("../src/services/admin/import/importService.js");

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "../../../repositories/importRepository") {
      return fakeRepo;
    }

    if (request === "../../../utils/audit/createAuditLog") {
      return { createAuditLog: fakeAuditLogger };
    }

    return originalLoad.apply(this, arguments);
  };

  delete require.cache[importServicePath];
  const service = require(importServicePath);
  Module._load = originalLoad;

  return service;
}

test("successful import uses the transaction client for mandatory writes and success audit logging", async () => {
  const tx = {
    importBatch: {
      create: async ({ data }) => ({ id: "batch-1", ...data }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    employee: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: `emp-${data.employeeCode}`, ...data }),
    },
    employeePerformance: {
      create: async ({ data }) => ({ id: `perf-${data.employeeId}`, ...data }),
    },
    auditLog: {
      create: async ({ data }) => ({ id: `audit-${data.entityId}`, ...data }),
    },
  };

  const auditCalls = [];
  const fakeRepo = {
    createBatch: async (data) => ({ id: "batch-1", ...data }),
    updateBatch: async (id, data, txArg) => {
      assert.equal(txArg, tx);
      return { id, ...data };
    },
    findEmployeeByCode: async (employeeCode, txArg) => {
      assert.equal(txArg, tx);
      return null;
    },
    createEmployee: async (payload, txArg) => {
      assert.equal(txArg, tx);
      return { id: `emp-${payload.employeeCode}`, ...payload };
    },
    createPerformance: async (payload, txArg) => {
      assert.equal(txArg, tx);
      return { id: `perf-${payload.employeeId}`, ...payload };
    },
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepositoryAndAudit(
      fakeRepo,
      async (payload) => {
        auditCalls.push(payload);
        assert.equal(payload.tx, tx);
        return null;
      },
    );

  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Emp 33174", 10, 2.5, 1.2, 3.3, 4.4, 0.0175],
    [33175, "Emp 33175", 11, 2.6, 1.3, 3.4, 4.5, 0.00001],
  ]);

  try {
    await withMockTransaction(tx, async () => {
      const result = await importEmployeesFromExcel(
        filePath,
        "success.xlsx",
        "user-1",
      );

      assert.equal(result.status, "COMPLETED");
      assert.equal(result.successCount, 2);
      assert.equal(auditCalls.length, 1);
      assert.equal(auditCalls[0].tx, tx);
      assert.equal(auditCalls[0].afterData.totalRows, 2);
    });
  } finally {
    cleanup();
  }
});

test("validation failure happens before any database writes or transactional callback", async () => {
  const tx = {
    importBatch: { create: async () => ({ id: "batch-1" }) },
    employee: {
      findUnique: async () => null,
      create: async () => ({ id: "emp-1" }),
    },
    employeePerformance: { create: async () => ({ id: "perf-1" }) },
    auditLog: { create: async () => ({ id: "audit-1" }) },
  };

  const repoCalls = {
    createBatch: 0,
    updateBatch: 0,
    createEmployee: 0,
    createPerformance: 0,
  };

  const fakeRepo = {
    createBatch: async () => {
      repoCalls.createBatch += 1;
      return { id: "batch-1" };
    },
    updateBatch: async () => {
      repoCalls.updateBatch += 1;
      return {};
    },
    findEmployeeByCode: async () => null,
    createEmployee: async () => {
      repoCalls.createEmployee += 1;
      return { id: "emp-1" };
    },
    createPerformance: async () => {
      repoCalls.createPerformance += 1;
      return { id: "perf-1" };
    },
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepositoryAndAudit(fakeRepo, async () => null);
  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Bad Row", 10, 2.5, 1.2, 3.3, 4.4, 0],
  ]);

  try {
    await withMockTransaction(tx, async () => {
      await assert.rejects(
        () => importEmployeesFromExcel(filePath, "bad-row.xlsx", "user-1"),
        /Invalid row data/i,
      );
    });

    assert.equal(repoCalls.createBatch, 0);
    assert.equal(repoCalls.createEmployee, 0);
    assert.equal(repoCalls.createPerformance, 0);
    assert.equal(repoCalls.updateBatch, 0);
  } finally {
    cleanup();
  }
});

test("employee creation failure triggers FAILED tracking and preserves the original error", async () => {
  const tx = {
    importBatch: {
      create: async ({ data }) => ({ id: "batch-1", ...data }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    employee: {
      findUnique: async () => null,
      create: async () => {
        throw new Error("employee create failed");
      },
    },
    employeePerformance: { create: async () => ({ id: "perf-1" }) },
    auditLog: { create: async () => ({ id: "audit-1" }) },
  };

  const updateCalls = [];
  const auditCalls = [];
  const fakeRepo = {
    createBatch: async (data) => ({ id: "batch-1", ...data }),
    updateBatch: async (id, data, txArg) => {
      updateCalls.push({ id, data, txArg });
      return { id, ...data };
    },
    findEmployeeByCode: async () => null,
    createEmployee: async () => {
      throw new Error("employee create failed");
    },
    createPerformance: async () => ({ id: "perf-1" }),
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepositoryAndAudit(
      fakeRepo,
      async (payload) => {
        auditCalls.push(payload);
        return null;
      },
    );

  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Emp 33174", 10, 2.5, 1.2, 3.3, 4.4, 0.0175],
  ]);

  try {
    await withMockTransaction(tx, async () => {
      await assert.rejects(
        () =>
          importEmployeesFromExcel(filePath, "employee-fail.xlsx", "user-1"),
        /employee create failed/i,
      );
    });

    assert.equal(updateCalls.length, 1);
    assert.deepEqual(updateCalls[0].data, { status: "FAILED" });
    assert.equal(auditCalls[0].afterData.error, "employee create failed");
  } finally {
    cleanup();
  }
});

test("performance insertion failure never advances the batch to COMPLETED and preserves the original error", async () => {
  const tx = {
    importBatch: {
      create: async ({ data }) => ({ id: "batch-1", ...data }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    employee: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: `emp-${data.employeeCode}`, ...data }),
    },
    employeePerformance: {
      create: async () => {
        throw new Error("performance insert failed");
      },
    },
    auditLog: { create: async () => ({ id: "audit-1" }) },
  };

  const updateCalls = [];
  const fakeRepo = {
    createBatch: async (data) => ({ id: "batch-1", ...data }),
    updateBatch: async (id, data, txArg) => {
      updateCalls.push({ id, data, txArg });
      return { id, ...data };
    },
    findEmployeeByCode: async () => null,
    createEmployee: async ({ employeeCode, name }) => ({
      id: `emp-${employeeCode}`,
      employeeCode,
      name,
    }),
    createPerformance: async () => {
      throw new Error("performance insert failed");
    },
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepositoryAndAudit(
      fakeRepo,
      async (payload) => payload,
    );

  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Emp 33174", 10, 2.5, 1.2, 3.3, 4.4, 0.0175],
  ]);

  try {
    await withMockTransaction(tx, async () => {
      await assert.rejects(
        () =>
          importEmployeesFromExcel(filePath, "performance-fail.xlsx", "user-1"),
        /performance insert failed/i,
      );
    });

    assert.deepEqual(
      updateCalls.map((entry) => entry.data),
      [{ status: "FAILED" }],
    );
  } finally {
    cleanup();
  }
});

test("completion update failure in the transaction still ends in FAILED tracking with the original error", async () => {
  const tx = {
    importBatch: {
      create: async ({ data }) => ({ id: "batch-1", ...data }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    employee: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: `emp-${data.employeeCode}`, ...data }),
    },
    employeePerformance: {
      create: async ({ data }) => ({ id: `perf-${data.employeeId}`, ...data }),
    },
    auditLog: { create: async () => ({ id: "audit-1" }) },
  };

  const updateCalls = [];
  const auditCalls = [];
  const fakeRepo = {
    createBatch: async (data) => ({ id: "batch-1", ...data }),
    updateBatch: async (id, data, txArg) => {
      updateCalls.push({ id, data, txArg });
      if (data && data.status === "COMPLETED") {
        throw new Error("completion update failed");
      }
      return { id, ...data };
    },
    findEmployeeByCode: async () => null,
    createEmployee: async ({ employeeCode, name }) => ({
      id: `emp-${employeeCode}`,
      employeeCode,
      name,
    }),
    createPerformance: async (payload) => ({
      id: `perf-${payload.employeeId}`,
      ...payload,
    }),
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepositoryAndAudit(
      fakeRepo,
      async (payload) => {
        auditCalls.push(payload);
        return null;
      },
    );

  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Emp 33174", 10, 2.5, 1.2, 3.3, 4.4, 0.0175],
  ]);

  try {
    await withMockTransaction(tx, async () => {
      await assert.rejects(
        () =>
          importEmployeesFromExcel(filePath, "completion-fail.xlsx", "user-1"),
        /completion update failed/i,
      );
    });

    assert.equal(updateCalls.length, 2);
    assert.deepEqual(updateCalls[0].data, { status: "COMPLETED" });
    assert.deepEqual(updateCalls[1].data, { status: "FAILED" });
    assert.equal(auditCalls[0].afterData.error, "completion update failed");
  } finally {
    cleanup();
  }
});

test("failed-import audit logging failure does not replace the original import error", async () => {
  const tx = {
    importBatch: {
      create: async ({ data }) => ({ id: "batch-1", ...data }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    employee: {
      findUnique: async () => null,
      create: async () => {
        throw new Error("employee create failed");
      },
    },
    employeePerformance: { create: async () => ({ id: "perf-1" }) },
    auditLog: { create: async () => ({ id: "audit-1" }) },
  };

  const fakeRepo = {
    createBatch: async (data) => ({ id: "batch-1", ...data }),
    updateBatch: async (id, data) => ({ id, ...data }),
    findEmployeeByCode: async () => null,
    createEmployee: async () => {
      throw new Error("employee create failed");
    },
    createPerformance: async () => ({ id: "perf-1" }),
  };

  const { importEmployeesFromExcel } =
    loadImportServiceWithStubbedRepositoryAndAudit(
      fakeRepo,
      async (payload) => {
        if (payload.afterData && payload.afterData.status === "FAILED") {
          throw new Error("audit log failed");
        }
        return null;
      },
    );

  const { filePath, cleanup } = await writeWorkbookForImport([
    [33174, "Emp 33174", 10, 2.5, 1.2, 3.3, 4.4, 0.0175],
  ]);

  try {
    await withMockTransaction(tx, async () => {
      await assert.rejects(
        () => importEmployeesFromExcel(filePath, "audit-fail.xlsx", "user-1"),
        /employee create failed/i,
      );
    });
  } finally {
    cleanup();
  }
});
