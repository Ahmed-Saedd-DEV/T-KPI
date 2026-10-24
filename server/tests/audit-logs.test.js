const test = require("node:test");
const assert = require("node:assert/strict");
const auditListValidator = require("../src/validators/admin/audit/auditListValidator");

function buildReq(query) {
  return { query };
}

test("auditListValidator accepts valid entityType and date range", () => {
  const req = buildReq({
    entityType: "Employee",
    action: "CREATE",
    from: "2026-10-01",
    to: "2026-10-31",
    limit: "10",
  });
  const res = {};
  let nextCalled = false;
  const next = (error) => {
    nextCalled = true;
    assert.equal(error, undefined);
  };

  auditListValidator(req, res, next);
  assert.equal(nextCalled, true);
});

test("auditListValidator rejects invalid entityType", () => {
  const req = buildReq({ entityType: "InvalidType" });
  const res = {};
  let error;
  const next = (err) => {
    error = err;
  };

  auditListValidator(req, res, next);
  assert.ok(error);
  assert.equal(error.message, "Invalid entityType value");
});
