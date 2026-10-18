const test = require("node:test");
const assert = require("node:assert/strict");

const validateRegister = require("../src/validators/auth/registerValidator");
const swaggerSpec = require("../src/docs/swagger");

test("register validator accepts a password that satisfies the project policy", (t) => {
  const req = {
    body: {
      email: "user@example.com",
      password: "StrongPass!2026",
    },
  };

  let called = false;
  let receivedError = null;

  validateRegister(req, {}, (error) => {
    called = true;
    receivedError = error;
  });

  assert.equal(called, true);
  assert.equal(receivedError, undefined);
});

test("register validator rejects a password missing an uppercase letter", () => {
  const req = {
    body: {
      email: "user@example.com",
      password: "strongpass!2026",
    },
  };

  let error;
  validateRegister(req, {}, (nextError) => {
    error = nextError;
  });

  assert.ok(error);
  assert.equal(error.statusCode, 400);
  assert.match(error.message, /uppercase/i);
});

test("register validator rejects a password missing a lowercase letter", () => {
  const req = {
    body: {
      email: "user@example.com",
      password: "STRONGPASS!2026",
    },
  };

  let error;
  validateRegister(req, {}, (nextError) => {
    error = nextError;
  });

  assert.ok(error);
  assert.equal(error.statusCode, 400);
  assert.match(error.message, /lowercase/i);
});

test("register validator rejects a password missing a number", () => {
  const req = {
    body: {
      email: "user@example.com",
      password: "StrongPass!Alpha",
    },
  };

  let error;
  validateRegister(req, {}, (nextError) => {
    error = nextError;
  });

  assert.ok(error);
  assert.equal(error.statusCode, 400);
  assert.match(error.message, /number/i);
});

test("register validator rejects a password missing a special character", () => {
  const req = {
    body: {
      email: "user@example.com",
      password: "StrongPass2026",
    },
  };

  let error;
  validateRegister(req, {}, (nextError) => {
    error = nextError;
  });

  assert.ok(error);
  assert.equal(error.statusCode, 400);
  assert.match(error.message, /special/i);
});

test("Swagger exposes a bearer auth scheme for the protected me endpoint", () => {
  const scheme = swaggerSpec.components?.securitySchemes?.bearerAuth;
  assert.ok(scheme);
  assert.equal(scheme.type, "http");
  assert.equal(scheme.scheme, "bearer");
  assert.equal(scheme.bearerFormat, "JWT");

  const meSecurity = swaggerSpec.paths["/auth/me"]?.get?.security;
  assert.deepEqual(meSecurity, [{ bearerAuth: [] }]);
});
