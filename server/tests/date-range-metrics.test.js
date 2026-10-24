const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildDateRangeFilter,
} = require("../src/utils/query/buildDateRangeFilter");
const metricRangeValidator = require("../src/validators/admin/metrics/metricRangeValidator");

const next = (error) => error;

test("buildDateRangeFilter returns a Prisma-safe date range when from and to are provided", () => {
  const filter = buildDateRangeFilter("2025-01-10", "2025-01-20");

  assert.deepEqual(filter, {
    metricDate: {
      gte: new Date("2025-01-10T00:00:00.000Z"),
      lte: new Date("2025-01-20T23:59:59.999Z"),
    },
  });
});

test("buildDateRangeFilter is undefined when no range is supplied", () => {
  assert.equal(buildDateRangeFilter(undefined, undefined), undefined);
});

test("metricRangeValidator rejects invalid dates and reversed ranges", () => {
  const invalid = metricRangeValidator(
    { query: { from: "2025/01/10" } },
    null,
    next,
  );
  assert.equal(invalid.message, "Invalid from date (expected YYYY-MM-DD)");

  const reversed = metricRangeValidator(
    { query: { from: "2025-01-20", to: "2025-01-10" } },
    null,
    next,
  );
  assert.equal(reversed.message, "from date must not be after to date");
});

test("metricRangeValidator allows a valid date range", () => {
  let called = false;

  metricRangeValidator(
    { query: { from: "2025-01-10", to: "2025-01-20" } },
    null,
    () => {
      called = true;
    },
  );

  assert.equal(called, true);
});
