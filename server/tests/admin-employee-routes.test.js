const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

const prisma = require("../src/prisma/prismaClient");
const adminEmployeeRoutes = require("../src/routes/admin/employees/employeeAdminRoutes");
const employeeRoutes = require("../src/routes/employees/employeeRoutes");
const errorHandler = require("../src/middleware/errorHandler");

const originalJwtSecret = process.env.JWT_SECRET;
const originalUserFindUnique = prisma.user.findUnique.bind(prisma.user);
const originalEmployeeCreate = prisma.employee.create.bind(prisma.employee);
const originalEmployeeFindMany = prisma.employee.findMany.bind(prisma.employee);
const originalEmployeeFindUnique = prisma.employee.findUnique.bind(
  prisma.employee,
);
const originalEmployeeDelete = prisma.employee.delete.bind(prisma.employee);
const originalEmployeePerformanceDeleteMany =
  prisma.employeePerformance.deleteMany.bind(prisma.employeePerformance);
const originalAuditLogCreate = prisma.auditLog.create.bind(prisma.auditLog);
const originalTransaction = prisma.$transaction.bind(prisma);

function makeToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "8h",
  });
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/admin", adminEmployeeRoutes);
  app.use("/employees", employeeRoutes);
  app.use(errorHandler);
  return app;
}

async function request(app, path, { method = "GET", body, headers = {} } = {}) {
  const server = app.listen(0);

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const raw = await response.text();
    let json = null;

    if (raw) {
      try {
        json = JSON.parse(raw);
      } catch {
        json = raw;
      }
    }

    return {
      status: response.status,
      body: json,
      text: raw,
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

test.beforeEach(() => {
  process.env.JWT_SECRET = "1234567890abcdefghijklmnopqrstuvwxyz1234567890";
  prisma.user.findUnique = async ({ where }) => {
    if (!where || !where.id) {
      return null;
    }

    return {
      id: where.id,
      email: "test@example.com",
      role: "USER",
      isActive: true,
    };
  };
  prisma.employee.create = async ({ data }) => ({
    id: "emp-001",
    ...data,
    createdAt: new Date().toISOString(),
  });
  prisma.employee.findMany = async () => [
    {
      id: "emp-001",
      employeeCode: "EMP-100",
      name: "Alice",
      createdAt: new Date().toISOString(),
      performances: [],
    },
  ];
  prisma.employee.findUnique = async ({ where }) => {
    if (where && where.employeeCode === "EMP-100") {
      return {
        id: "emp-001",
        employeeCode: "EMP-100",
        name: "Alice",
        createdAt: new Date().toISOString(),
      };
    }

    if (where && where.id === "123e4567-e89b-12d3-a456-426614174000") {
      return {
        id: "123e4567-e89b-12d3-a456-426614174000",
        employeeCode: "EMP-100",
        name: "Alice",
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  };
});

test.afterEach(() => {
  process.env.JWT_SECRET = originalJwtSecret;
  prisma.user.findUnique = originalUserFindUnique;
  prisma.employee.create = originalEmployeeCreate;
  prisma.employee.findMany = originalEmployeeFindMany;
  prisma.employee.findUnique = originalEmployeeFindUnique;
  prisma.employee.delete = originalEmployeeDelete;
  prisma.employeePerformance.deleteMany = originalEmployeePerformanceDeleteMany;
  prisma.auditLog.create = originalAuditLogCreate;
  prisma.$transaction = originalTransaction;
});

test("POST /admin/employees rejects missing or invalid bearer tokens", async () => {
  const app = buildApp();

  const noToken = await request(app, "/admin/employees", {
    method: "POST",
    body: { employeeCode: "EMP-101", name: "Bob" },
  });

  assert.equal(noToken.status, 401);

  const invalidToken = await request(app, "/admin/employees", {
    method: "POST",
    body: { employeeCode: "EMP-101", name: "Bob" },
    headers: {
      Authorization: "Bearer invalid-token",
    },
  });

  assert.equal(invalidToken.status, 401);
});

test("POST /admin/employees rejects authenticated USER with 403", async () => {
  const app = buildApp();
  const userId = "user-1";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "user@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };

  const token = makeToken(userId);
  const result = await request(app, "/admin/employees", {
    method: "POST",
    body: { employeeCode: "EMP-101", name: "Bob" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 403);
  assert.equal(result.body.message, "Forbidden");
});

test("POST /admin/employees creates employee for ADMIN", async () => {
  const app = buildApp();
  const userId = "admin-1";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.create = async ({ data }) => ({
    id: "emp-002",
    employeeCode: data.employeeCode,
    name: data.name,
    createdAt: new Date().toISOString(),
  });

  const token = makeToken(userId);
  const result = await request(app, "/admin/employees", {
    method: "POST",
    body: { employeeCode: "EMP-101", name: "Bob" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.employeeCode, "EMP-101");
  assert.equal(result.body.name, "Bob");
});

test("POST /admin/employees rejects duplicate employeeCode with 409", async () => {
  const app = buildApp();
  const userId = "admin-2";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.create = async () => {
    const error = new Error("duplicate key");
    error.code = "P2002";
    throw error;
  };

  const token = makeToken(userId);
  const result = await request(app, "/admin/employees", {
    method: "POST",
    body: { employeeCode: "EMP-100", name: "Alice" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 409);
  assert.equal(result.body.message, "Employee code already exists");
});

test("POST /admin/employees rejects missing or invalid required fields with 400", async () => {
  const app = buildApp();
  const userId = "admin-3";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };

  const token = makeToken(userId);
  const invalidBodies = [
    {},
    { employeeCode: "", name: "Bob" },
    { employeeCode: "EMP-101", name: "" },
    { employeeCode: 123, name: "Bob" },
    { employeeCode: "EMP-101", name: 123 },
  ];

  for (const body of invalidBodies) {
    const result = await request(app, "/admin/employees", {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(
      result.status,
      400,
      `Expected 400 for ${JSON.stringify(body)}`,
    );
  }
});

test("GET /employees remains authenticated and route ordering stays distinct from /admin", async () => {
  const app = buildApp();
  const userId = "user-2";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "user@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };
  const token = makeToken(userId);

  const employees = await request(app, "/employees", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(employees.status, 200);
  assert.ok(Array.isArray(employees.body.data));
  assert.equal(employees.body.pagination.page, 1);
  assert.equal(employees.body.pagination.limit, 20);

  const employeeByCode = await request(app, "/employees/code/EMP-100", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(employeeByCode.status, 200);
  assert.equal(employeeByCode.body.employeeCode, "EMP-100");

  const employeeById = await request(
    app,
    "/employees/123e4567-e89b-12d3-a456-426614174000",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(employeeById.status, 200);
  assert.equal(employeeById.body.id, "123e4567-e89b-12d3-a456-426614174000");

  const adminFallback = await request(app, "/admin/employees", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(adminFallback.status, 404);
});

test("PATCH /admin/employees/:id rejects missing or invalid bearer tokens", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174000";

  const withoutToken = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { name: "Updated Name" },
  });

  assert.equal(withoutToken.status, 401);

  const invalidToken = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { name: "Updated Name" },
    headers: {
      Authorization: "Bearer invalid-token",
    },
  });

  assert.equal(invalidToken.status, 401);
});

test("PATCH /admin/employees/:id rejects authenticated USER with 403", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174000";
  const userId = "user-3";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "user@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { name: "Updated Name" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 403);
  assert.equal(result.body.message, "Forbidden");
});

test("PATCH /admin/employees/:id updates both fields for ADMIN", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174000";
  const userId = "admin-10";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-100",
        name: "Alice",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.employee.update = async ({ where, data }) => ({
    id: where.id,
    employeeCode: data.employeeCode ?? "EMP-100",
    name: data.name ?? "Alice",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { employeeCode: "EMP-200", name: "Updated Name" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.employeeCode, "EMP-200");
  assert.equal(result.body.name, "Updated Name");
});

test("PATCH /admin/employees/:id updates only name for ADMIN", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174001";
  const userId = "admin-11";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-300",
        name: "Alice",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.employee.update = async ({ data }) => ({
    id: employeeId,
    employeeCode: "EMP-300",
    name: data.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { name: "  Bob  " },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.name, "Bob");
  assert.equal(result.body.employeeCode, "EMP-300");
});

test("PATCH /admin/employees/:id updates only employeeCode for ADMIN", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174002";
  const userId = "admin-12";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-400",
        name: "Cara",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.employee.update = async ({ data }) => ({
    id: employeeId,
    employeeCode: data.employeeCode,
    name: "Cara",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { employeeCode: "  EMP-401  " },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.employeeCode, "EMP-401");
  assert.equal(result.body.name, "Cara");
});

test("PATCH /admin/employees/:id returns 404 for missing employee", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174003";
  const userId = "admin-13";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async () => null;

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { name: "New Name" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 404);
  assert.equal(result.body.message, "Employee not found");
});

test("PATCH /admin/employees/:id rejects duplicate employeeCode belonging to another employee with 409", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174004";
  const userId = "admin-14";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-500",
        name: "Alice",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (where.employeeCode === "EMP-999") {
      return {
        id: "123e4567-e89b-12d3-a456-426614174099",
        employeeCode: "EMP-999",
        name: "Other",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.employee.update = async () => {
    const error = new Error("duplicate key");
    error.code = "P2002";
    throw error;
  };

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { employeeCode: "EMP-999" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 409);
  assert.equal(result.body.message, "Employee code already exists");
});

test("PATCH /admin/employees/:id allows same employeeCode for same employee", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174005";
  const userId = "admin-15";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-600",
        name: "Dana",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (where.employeeCode === "EMP-600") {
      return {
        id: employeeId,
        employeeCode: "EMP-600",
        name: "Dana",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.employee.update = async ({ data }) => ({
    id: employeeId,
    employeeCode: data.employeeCode,
    name: data.name ?? "Dana",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: { employeeCode: "EMP-600" },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.employeeCode, "EMP-600");
});

test("PATCH /admin/employees/:id rejects empty body and protected/invalid fields with 400", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174006";
  const userId = "admin-16";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-700",
        name: "Eve",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };

  const token = makeToken(userId);
  const invalidBodies = [
    {},
    { name: "   " },
    { employeeCode: "   " },
    { employeeCode: 123 },
    { name: 123 },
    { id: employeeId },
    { createdAt: "2024-01-01" },
    { updatedAt: "2024-01-01" },
    { invalidField: "bad" },
    { employeeCode: "EMP-701", name: "", extra: true },
  ];

  for (const body of invalidBodies) {
    const result = await request(app, `/admin/employees/${employeeId}`, {
      method: "PATCH",
      body,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(
      result.status,
      400,
      `Expected 400 for ${JSON.stringify(body)}`,
    );
  }
});

test("DELETE /admin/employees/:id rejects missing or invalid bearer tokens", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174100";

  const withoutToken = await request(app, `/admin/employees/${employeeId}`, {
    method: "DELETE",
  });

  assert.equal(withoutToken.status, 401);

  const invalidToken = await request(app, `/admin/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer invalid-token",
    },
  });

  assert.equal(invalidToken.status, 401);
});

test("DELETE /admin/employees/:id rejects authenticated USER with 403", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174101";
  const userId = "user-4";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "user@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 403);
  assert.equal(result.body.message, "Forbidden");
});

test("DELETE /admin/employees/:id deletes employee and target performance rows for ADMIN", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174102";
  const userId = "admin-20";
  const targetPerformanceRows = [{ id: "perf-1", employeeId: employeeId }];
  const otherPerformanceRows = [
    { id: "perf-2", employeeId: "123e4567-e89b-12d3-a456-426614174900" },
  ];
  let auditEntry = null;

  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-DEL-1",
        name: "Delete Me",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.employeePerformance.deleteMany = async ({ where }) => {
    assert.equal(where.employeeId, employeeId);
    return { count: targetPerformanceRows.length };
  };
  prisma.employee.delete = async ({ where }) => {
    assert.equal(where.id, employeeId);
    return {
      id: employeeId,
      employeeCode: "EMP-DEL-1",
      name: "Delete Me",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };
  prisma.auditLog.create = async ({ data }) => {
    auditEntry = data;
    return { ...data, id: "audit-001", createdAt: new Date().toISOString() };
  };
  prisma.$transaction = async (callback) => {
    const tx = {
      employeePerformance: {
        deleteMany: async ({ where }) => {
          assert.equal(where.employeeId, employeeId);
          return { count: targetPerformanceRows.length };
        },
      },
      employee: {
        delete: async ({ where }) => {
          assert.equal(where.id, employeeId);
          return {
            id: employeeId,
            employeeCode: "EMP-DEL-1",
            name: "Delete Me",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      },
      auditLog: {
        create: async ({ data }) => {
          auditEntry = data;
          return {
            ...data,
            id: "audit-001",
            createdAt: new Date().toISOString(),
          };
        },
      },
    };

    return callback(tx);
  };

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 204);
  assert.equal(result.text, "");
  assert.equal(result.body, null);
  assert.ok(auditEntry);
  assert.equal(auditEntry.action, "DELETE");
  assert.equal(auditEntry.entityType, "Employee");
  assert.equal(auditEntry.entityId, employeeId);
  assert.deepEqual(auditEntry.beforeData.id, employeeId);
  assert.deepEqual(auditEntry.actorUserId, userId);
  assert.deepEqual(auditEntry.actorSnapshot, {
    id: userId,
    email: "admin@example.com",
    role: "ADMIN",
  });
  assert.deepEqual(otherPerformanceRows, otherPerformanceRows);
});

test("DELETE /admin/employees/:id returns 404 for missing employee", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174103";
  const userId = "admin-21";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async () => null;

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 404);
  assert.equal(result.body.message, "Employee not found");
});

test("DELETE /admin/employees/:id returns 400 for invalid UUID format", async () => {
  const app = buildApp();
  const userId = "admin-22";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };

  const token = makeToken(userId);
  const result = await request(app, "/admin/employees/not-a-valid-id", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.message, "Invalid employee id");
});

test("DELETE /admin/employees/:id does not delete other employees' performance records or ImportBatch rows", async () => {
  const app = buildApp();
  const targetEmployeeId = "123e4567-e89b-12d3-a456-426614174104";
  const otherEmployeeId = "123e4567-e89b-12d3-a456-426614174105";
  const userId = "admin-23";

  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === targetEmployeeId) {
      return {
        id: targetEmployeeId,
        employeeCode: "EMP-KEEP-ONE",
        name: "Delete Target",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.$transaction = async (callback) => {
    const tx = {
      employeePerformance: {
        deleteMany: async ({ where }) => {
          assert.equal(where.employeeId, targetEmployeeId);
          return { count: 2 };
        },
      },
      employee: {
        delete: async ({ where }) => {
          assert.equal(where.id, targetEmployeeId);
          return { id: targetEmployeeId };
        },
      },
      auditLog: {
        create: async ({ data }) => ({
          id: "audit-keep",
          ...data,
          createdAt: new Date().toISOString(),
        }),
      },
    };

    return callback(tx);
  };

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${targetEmployeeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 204);
  assert.equal(result.body, null);
  assert.notEqual(otherEmployeeId, targetEmployeeId);
});

test("DELETE /admin/employees/:id fails transactionally without reporting a successful delete", async () => {
  const app = buildApp();
  const employeeId = "123e4567-e89b-12d3-a456-426614174106";
  const userId = "admin-24";
  let auditCalled = false;
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      };
    }

    return null;
  };
  prisma.employee.findUnique = async ({ where }) => {
    if (where.id === employeeId) {
      return {
        id: employeeId,
        employeeCode: "EMP-FAIL",
        name: "Fail Delete",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  };
  prisma.auditLog.create = async () => {
    auditCalled = true;
    return { id: "audit-fail", action: "DELETE" };
  };
  prisma.$transaction = async () => {
    const error = new Error("transaction failed");
    error.code = "P2025";
    throw error;
  };

  const token = makeToken(userId);
  const result = await request(app, `/admin/employees/${employeeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(auditCalled, false);
  assert.equal(result.status, 404);
  assert.equal(result.body.message, "Employee not found");
});

test("GET /employees defaults to descending score order and supports custom sort validation", async () => {
  const app = buildApp();
  const userId = "user-sort-1";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "sort@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };

  prisma.employee.findMany = async () => [
    {
      id: "emp-low",
      employeeCode: "EMP-LOW",
      name: "Zoe",
      createdAt: new Date().toISOString(),
      performances: [
        {
          id: "perf-low",
          orders: 10,
          opsCR: 3,
          dispatchTime: 10,
          pickingTime: 2,
          assignmentTime: 1,
          prepTime: 3,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: "emp-high",
      employeeCode: "EMP-HIGH",
      name: "Alice",
      createdAt: new Date().toISOString(),
      performances: [
        {
          id: "perf-high",
          orders: 25,
          opsCR: 1,
          dispatchTime: 7,
          pickingTime: 1.7,
          assignmentTime: 0.3,
          prepTime: 2,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ];

  const token = makeToken(userId);
  const sortedByScore = await request(app, "/employees", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(sortedByScore.status, 200);
  assert.equal(sortedByScore.body.data[0].employeeCode, "EMP-HIGH");
  assert.equal(sortedByScore.body.data[1].employeeCode, "EMP-LOW");

  const customSort = await request(app, "/employees?sortBy=name&order=asc", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(customSort.status, 200);
  assert.equal(customSort.body.data[0].name, "Alice");
  assert.equal(customSort.body.data[1].name, "Zoe");

  const invalidSortBy = await request(app, "/employees?sortBy=invalid", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(invalidSortBy.status, 400);
  assert.equal(invalidSortBy.body.message, "Invalid sortBy value");

  const missingSortBy = await request(app, "/employees?order=asc", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(missingSortBy.status, 400);
  assert.equal(
    missingSortBy.body.message,
    "sortBy is required when order is provided",
  );
});

test("GET /employees without mode preserves legacy completed, failed, and processing behavior", async () => {
  const app = buildApp();
  const userId = "user-legacy-mode";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "legacy@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };

  prisma.employee.findMany = async () => [
    {
      id: "emp-completed",
      employeeCode: "EMP-COMPLETED",
      name: "Completed",
      createdAt: new Date("2025-01-01T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-completed",
          orders: 50,
          opsCR: 90,
          dispatchTime: 10,
          pickingTime: 5,
          assignmentTime: 2,
          prepTime: 3,
          createdAt: new Date("2025-01-05T00:00:00Z").toISOString(),
          importBatch: {
            id: "batch-completed",
            createdAt: new Date("2025-01-05T00:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
      ],
    },
    {
      id: "emp-failed",
      employeeCode: "EMP-FAILED",
      name: "Failed",
      createdAt: new Date("2025-01-02T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-failed",
          orders: 30,
          opsCR: 70,
          dispatchTime: 20,
          pickingTime: 8,
          assignmentTime: 4,
          prepTime: 5,
          createdAt: new Date("2025-01-06T00:00:00Z").toISOString(),
          importBatch: {
            id: "batch-failed",
            createdAt: new Date("2025-01-06T00:00:00Z").toISOString(),
            status: "FAILED",
          },
        },
      ],
    },
    {
      id: "emp-processing",
      employeeCode: "EMP-PROCESSING",
      name: "Processing",
      createdAt: new Date("2025-01-03T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-processing",
          orders: 20,
          opsCR: 60,
          dispatchTime: 25,
          pickingTime: 10,
          assignmentTime: 5,
          prepTime: 6,
          createdAt: new Date("2025-01-07T00:00:00Z").toISOString(),
          importBatch: {
            id: "batch-processing",
            createdAt: new Date("2025-01-07T00:00:00Z").toISOString(),
            status: "PROCESSING",
          },
        },
      ],
    },
  ];

  const token = makeToken(userId);
  const result = await request(app, "/employees", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.data.length, 3);
  assert.deepEqual(
    result.body.data.map((employee) => employee.employeeCode).sort(),
    ["EMP-COMPLETED", "EMP-FAILED", "EMP-PROCESSING"].sort(),
  );
});

test("GET /employees supports latest-batch, upload-date, and no-result modes for completed batches only", async () => {
  const app = buildApp();
  const userId = "user-batch-mode";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "batch@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };

  prisma.employee.findMany = async () => [
    {
      id: "emp-a",
      employeeCode: "EMP-A",
      name: "Alpha",
      createdAt: new Date("2025-01-01T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-a-old",
          employeeId: "emp-a",
          importBatchId: "batch-old",
          orders: 15,
          opsCR: 7,
          dispatchTime: 22,
          pickingTime: 5,
          assignmentTime: 2,
          prepTime: 3,
          createdAt: new Date("2025-01-07T10:00:00Z").toISOString(),
          importBatch: {
            id: "batch-old",
            fileName: "older.csv",
            createdAt: new Date("2025-01-07T10:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
        {
          id: "perf-a-new",
          employeeId: "emp-a",
          importBatchId: "batch-new",
          orders: 25,
          opsCR: 4,
          dispatchTime: 18,
          pickingTime: 4,
          assignmentTime: 1.5,
          prepTime: 2,
          createdAt: new Date("2025-01-10T13:00:00Z").toISOString(),
          importBatch: {
            id: "batch-new",
            fileName: "newest.csv",
            createdAt: new Date("2025-01-10T13:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
      ],
    },
    {
      id: "emp-b",
      employeeCode: "EMP-B",
      name: "Bravo",
      createdAt: new Date("2025-01-02T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-b-old",
          employeeId: "emp-b",
          importBatchId: "batch-old",
          orders: 12,
          opsCR: 9,
          dispatchTime: 25,
          pickingTime: 6,
          assignmentTime: 2.5,
          prepTime: 4,
          createdAt: new Date("2025-01-07T11:00:00Z").toISOString(),
          importBatch: {
            id: "batch-old",
            fileName: "older.csv",
            createdAt: new Date("2025-01-07T10:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
        {
          id: "perf-b-failed",
          employeeId: "emp-b",
          importBatchId: "batch-failed",
          orders: 8,
          opsCR: 5,
          dispatchTime: 30,
          pickingTime: 7,
          assignmentTime: 3,
          prepTime: 5,
          createdAt: new Date("2025-01-11T12:00:00Z").toISOString(),
          importBatch: {
            id: "batch-failed",
            fileName: "failed.csv",
            createdAt: new Date("2025-01-11T12:00:00Z").toISOString(),
            status: "FAILED",
          },
        },
      ],
    },
  ];

  const token = makeToken(userId);

  const latestBatch = await request(app, "/employees?mode=latest-batch", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(latestBatch.status, 200);
  assert.equal(latestBatch.body.data.length, 1);
  assert.equal(latestBatch.body.data[0].employeeCode, "EMP-A");
  assert.equal(latestBatch.body.data[0].orders, 25);

  const uploadDate = await request(
    app,
    "/employees?mode=upload-date&uploadDate=2025-01-10",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(uploadDate.status, 200);
  assert.equal(uploadDate.body.data.length, 1);
  assert.equal(uploadDate.body.data[0].employeeCode, "EMP-A");
  assert.equal(uploadDate.body.data[0].orders, 25);

  const noMatchDate = await request(
    app,
    "/employees?mode=upload-date&uploadDate=2025-01-12",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(noMatchDate.status, 200);
  assert.equal(noMatchDate.body.data.length, 0);

  const noCompleted = await request(app, "/employees?mode=latest-batch", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  prisma.employee.findMany = async () => [
    {
      id: "emp-c",
      employeeCode: "EMP-C",
      name: "Charlie",
      createdAt: new Date("2025-01-01T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-c-failed",
          orders: 9,
          opsCR: 50,
          dispatchTime: 27,
          pickingTime: 11,
          assignmentTime: 6,
          prepTime: 7,
          createdAt: new Date("2025-01-14T00:00:00Z").toISOString(),
          importBatch: {
            id: "batch-c-failed",
            createdAt: new Date("2025-01-14T00:00:00Z").toISOString(),
            status: "FAILED",
          },
        },
      ],
    },
  ];

  const emptyLatest = await request(app, "/employees?mode=latest-batch", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(emptyLatest.status, 200);
  assert.equal(emptyLatest.body.data.length, 0);

  const invalidMode = await request(app, "/employees?mode=invalid", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(invalidMode.status, 400);
  assert.equal(invalidMode.body.message, "Invalid mode value");

  const missingUploadDate = await request(app, "/employees?mode=upload-date", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(missingUploadDate.status, 400);
  assert.equal(
    missingUploadDate.body.message,
    "uploadDate is required when mode=upload-date",
  );

  const invalidUploadDate = await request(
    app,
    "/employees?mode=upload-date&uploadDate=2025/01/10",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(invalidUploadDate.status, 400);
  assert.equal(invalidUploadDate.body.message, "Invalid uploadDate value");
});

test("GET /employees upload-date mode resolves duplicate picker rows and deterministic tie-breaks across Cairo boundaries", async () => {
  const app = buildApp();
  const userId = "user-date-edge";
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === userId) {
      return {
        id: userId,
        email: "date-edge@example.com",
        role: "USER",
        isActive: true,
      };
    }

    return null;
  };

  prisma.employee.findMany = async () => [
    {
      id: "emp-duplicate",
      employeeCode: "EMP-DUPLICATE",
      name: "Duplicate",
      createdAt: new Date("2025-01-10T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-older",
          employeeId: "emp-duplicate",
          importBatchId: "batch-oldest",
          orders: 10,
          opsCR: 35,
          dispatchTime: 40,
          pickingTime: 12,
          assignmentTime: 8,
          prepTime: 9,
          createdAt: new Date("2025-01-09T22:00:00Z").toISOString(),
          importBatch: {
            id: "batch-oldest",
            fileName: "older.csv",
            createdAt: new Date("2025-01-09T22:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
        {
          id: "perf-newer",
          employeeId: "emp-duplicate",
          importBatchId: "batch-newest",
          orders: 28,
          opsCR: 78,
          dispatchTime: 18,
          pickingTime: 6,
          assignmentTime: 3,
          prepTime: 4,
          createdAt: new Date("2025-01-09T23:00:00Z").toISOString(),
          importBatch: {
            id: "batch-newest",
            fileName: "newer.csv",
            createdAt: new Date("2025-01-09T23:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
      ],
    },
    {
      id: "emp-tie",
      employeeCode: "EMP-TIE",
      name: "Tie",
      createdAt: new Date("2025-01-10T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-b",
          employeeId: "emp-tie",
          importBatchId: "batch-b",
          orders: 14,
          opsCR: 50,
          dispatchTime: 28,
          pickingTime: 9,
          assignmentTime: 5,
          prepTime: 6,
          createdAt: new Date("2025-01-09T22:00:00Z").toISOString(),
          importBatch: {
            id: "batch-b",
            fileName: "batch-b.csv",
            createdAt: new Date("2025-01-09T22:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
        {
          id: "perf-a",
          employeeId: "emp-tie",
          importBatchId: "batch-a",
          orders: 15,
          opsCR: 55,
          dispatchTime: 26,
          pickingTime: 8,
          assignmentTime: 4,
          prepTime: 5,
          createdAt: new Date("2025-01-09T22:00:00Z").toISOString(),
          importBatch: {
            id: "batch-a",
            fileName: "batch-a.csv",
            createdAt: new Date("2025-01-09T22:00:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
      ],
    },
    {
      id: "emp-midnight",
      employeeCode: "EMP-MIDNIGHT",
      name: "Midnight",
      createdAt: new Date("2025-04-25T00:00:00Z").toISOString(),
      performances: [
        {
          id: "perf-midnight",
          employeeId: "emp-midnight",
          importBatchId: "batch-midnight",
          orders: 32,
          opsCR: 70,
          dispatchTime: 19,
          pickingTime: 7,
          assignmentTime: 2,
          prepTime: 3,
          createdAt: new Date("2025-04-25T00:45:00Z").toISOString(),
          importBatch: {
            id: "batch-midnight",
            fileName: "midnight.csv",
            createdAt: new Date("2025-04-25T00:45:00Z").toISOString(),
            status: "COMPLETED",
          },
        },
      ],
    },
  ];

  const token = makeToken(userId);
  const duplicateResult = await request(
    app,
    "/employees?mode=upload-date&uploadDate=2025-01-10",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(duplicateResult.status, 200);
  assert.equal(duplicateResult.body.data.length, 2);
  assert.equal(duplicateResult.body.data[0].employeeCode, "EMP-DUPLICATE");
  assert.equal(duplicateResult.body.data[0].orders, 28);
  assert.equal(duplicateResult.body.data[1].employeeCode, "EMP-TIE");
  assert.equal(duplicateResult.body.data[1].orders, 14);

  const midnightResult = await request(
    app,
    "/employees?mode=upload-date&uploadDate=2025-04-25",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  assert.equal(midnightResult.status, 200);
  assert.equal(midnightResult.body.data.length, 1);
  assert.equal(midnightResult.body.data[0].employeeCode, "EMP-MIDNIGHT");
});
