const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateKpiScore } = require("../src/services/kpi/kpiService");

test("uses exactly three metrics in the performance score", () => {
  const result = calculateKpiScore({
    opsCR: 0.0125,
    dispatchTime: 5,
    pickingTime: 1.8,
    assignmentTime: 0.4,
    prepTime: 1.5,
  });

  assert.equal(result.scores.opsCR, (100 * (4 * 1)) / (4 * 1 + 1.25));
  assert.equal(result.scores.dispatchTime, (100 * (4 * 7)) / (4 * 7 + 5));
  assert.equal(result.scores.prepTime, (100 * (4 * 2)) / (4 * 2 + 1.5));
  assert.equal(result.scores.pickingTime, null);
  assert.equal(result.scores.assignmentTime, null);
  assert.equal(
    result.overallScore,
    Number(
      (
        (result.scores.opsCR +
          result.scores.dispatchTime +
          result.scores.prepTime) /
        3
      ).toFixed(2),
    ),
  );
});

test("all three metrics have equal weight", () => {
  const result = calculateKpiScore({
    opsCR: 0.01,
    dispatchTime: 10,
    prepTime: 3,
  });

  const expected =
    (result.scores.opsCR +
      result.scores.dispatchTime +
      result.scores.prepTime) /
    3;
  assert.equal(result.overallScore, Number(expected.toFixed(2)));
});

test("actual equals target yields 80", () => {
  const result = calculateKpiScore({
    opsCR: 0.01,
    dispatchTime: 7,
    prepTime: 2,
  });

  assert.equal(result.scores.opsCR, 80);
  assert.equal(result.scores.dispatchTime, 80);
  assert.equal(result.scores.prepTime, 80);
  assert.equal(result.overallScore, 80);
});

test("actual below target yields a score above 80", () => {
  const result = calculateKpiScore({
    opsCR: 0.005,
    dispatchTime: 5,
    prepTime: 1,
  });

  assert.ok(result.scores.opsCR > 80);
  assert.ok(result.scores.dispatchTime > 80);
  assert.ok(result.scores.prepTime > 80);
  assert.ok(result.overallScore > 80);
});

test("actual above target yields a score below 80", () => {
  const result = calculateKpiScore({
    opsCR: 0.02,
    dispatchTime: 10,
    prepTime: 3,
  });

  assert.ok(result.scores.opsCR < 80);
  assert.ok(result.scores.dispatchTime < 80);
  assert.ok(result.scores.prepTime < 80);
  assert.ok(result.overallScore < 80);
});

test("actual zero yields 100 for valid metric", () => {
  const result = calculateKpiScore({
    opsCR: 0,
    dispatchTime: 0,
    prepTime: 0,
  });

  assert.equal(result.scores.opsCR, 100);
  assert.equal(result.scores.dispatchTime, 100);
  assert.equal(result.scores.prepTime, 100);
  assert.equal(result.overallScore, 100);
});

test("opsCR is converted from stored ratio to business-scale value once", () => {
  const result = calculateKpiScore({
    opsCR: 0.0175,
    dispatchTime: 7,
    prepTime: 2,
  });

  assert.equal(result.scores.opsCR, (100 * (4 * 1)) / (4 * 1 + 1.75));
  assert.equal(
    result.overallScore,
    Number(((result.scores.opsCR + 80 + 80) / 3).toFixed(2)),
  );
});

test("picking time does not affect the performance score", () => {
  const result = calculateKpiScore({
    opsCR: 0.01,
    dispatchTime: 7,
    pickingTime: 9.9,
    prepTime: 2,
  });

  assert.equal(result.scores.pickingTime, null);
  assert.equal(result.overallScore, 80);
});

test("assignment time does not affect the performance score", () => {
  const result = calculateKpiScore({
    opsCR: 0.01,
    dispatchTime: 7,
    assignmentTime: 99,
    prepTime: 2,
  });

  assert.equal(result.scores.assignmentTime, null);
  assert.equal(result.overallScore, 80);
});

test("orders count does not affect the performance score", () => {
  const result = calculateKpiScore({
    opsCR: 0.01,
    dispatchTime: 7,
    prepTime: 2,
    orders: 500,
  });

  assert.equal(result.overallScore, 80);
});

test("missing or invalid required metric makes the overall score null", () => {
  const missingResult = calculateKpiScore({
    dispatchTime: 7,
    prepTime: 2,
  });

  const invalidResult = calculateKpiScore({
    opsCR: -1,
    dispatchTime: 7,
    prepTime: 2,
  });

  assert.equal(missingResult.overallScore, null);
  assert.equal(invalidResult.overallScore, null);
  assert.equal(missingResult.scores.opsCR, null);
  assert.equal(invalidResult.scores.opsCR, null);
});

test("final score is rounded to two decimals", () => {
  const result = calculateKpiScore({
    opsCR: 0.0125,
    dispatchTime: 5,
    prepTime: 1.5,
  });

  const raw =
    (result.scores.opsCR +
      result.scores.dispatchTime +
      result.scores.prepTime) /
    3;
  assert.equal(result.overallScore, Number(raw.toFixed(2)));
});

test("scores remain within 0 to 100 for valid inputs", () => {
  const result = calculateKpiScore({
    opsCR: 0.2,
    dispatchTime: 30,
    prepTime: 10,
  });

  assert.ok(result.scores.opsCR >= 0 && result.scores.opsCR <= 100);
  assert.ok(
    result.scores.dispatchTime >= 0 && result.scores.dispatchTime <= 100,
  );
  assert.ok(result.scores.prepTime >= 0 && result.scores.prepTime <= 100);
  assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
});

test("better performance never produces a lower score", () => {
  const lower = calculateKpiScore({
    opsCR: 0.02,
    dispatchTime: 10,
    prepTime: 3,
  });
  const better = calculateKpiScore({
    opsCR: 0.01,
    dispatchTime: 7,
    prepTime: 2,
  });

  assert.ok(better.overallScore >= lower.overallScore);
});

test("regression example for employee 33174 matches the approved formula", () => {
  const employeeMetrics = {
    opsCR: 0.0175,
    dispatchTime: 5.75,
    prepTime: 1.75,
  };

  const result = calculateKpiScore(employeeMetrics);
  const expectedOpsCR = (100 * (4 * 1)) / (4 * 1 + 1.75);
  const expectedDispatch = (100 * (4 * 7)) / (4 * 7 + 5.75);
  const expectedPrep = (100 * (4 * 2)) / (4 * 2 + 1.75);
  const expectedOverall = Number(
    ((expectedOpsCR + expectedDispatch + expectedPrep) / 3).toFixed(2),
  );

  assert.ok(Math.abs(result.scores.opsCR - expectedOpsCR) < 1e-9);
  assert.ok(Math.abs(result.scores.dispatchTime - expectedDispatch) < 1e-9);
  assert.ok(Math.abs(result.scores.prepTime - expectedPrep) < 1e-9);
  assert.equal(result.overallScore, expectedOverall);
});
