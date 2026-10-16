const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateKpiScore } = require("../src/services/kpi/kpiService");

test("كل metric score = 100 لما الأرقام أحسن من الـ target", () => {
  const result = calculateKpiScore({
    opsCR: 0.0159,
    dispatchTime: 3.56,
    pickingTime: 1.53,
    assignmentTime: 0.12,
    prepTime: 1.65,
  });

  assert.deepEqual(result.scores, {
    opsCR: 100,
    dispatchTime: 100,
    pickingTime: 100,
    assignmentTime: 100,
    prepTime: 100,
  });
  assert.equal(result.overallScore, 100);
});

test("كل score أقل من 100 لما الأرقام أسوأ من الـ target في كل metric", () => {
  const result = calculateKpiScore({
    opsCR: 2,
    dispatchTime: 14,
    pickingTime: 3.4,
    assignmentTime: 0.6,
    prepTime: 4,
  });

  assert.equal(result.scores.opsCR, 50);
  assert.equal(result.scores.dispatchTime, 50);
  assert.equal(result.scores.pickingTime, 50);
  assert.equal(result.scores.assignmentTime, 50);
  assert.equal(result.scores.prepTime, 50);
  assert.equal(result.overallScore, 50);
});

test("القيمة صفر في metric واحد تتعامل كـ null وتستبعد من المتوسط", () => {
  const result = calculateKpiScore({
    opsCR: 0.5,
    dispatchTime: 0,
    pickingTime: 1.7,
    assignmentTime: 0.3,
    prepTime: 2,
  });

  assert.equal(result.scores.dispatchTime, null);
  assert.equal(result.overallScore, 100);
});

test("القيمة السالبة في metric واحد تتعامل كـ null وتستبعد من المتوسط", () => {
  const result = calculateKpiScore({
    opsCR: 1,
    dispatchTime: -1,
    pickingTime: 1.7,
    assignmentTime: 0.3,
    prepTime: 2,
  });

  assert.equal(result.scores.dispatchTime, null);
  assert.equal(result.overallScore, 100);
});

test("لو كل القيم invalid فـ overallScore = null", () => {
  const result = calculateKpiScore({
    opsCR: 0,
    dispatchTime: -5,
    pickingTime: NaN,
    assignmentTime: null,
    prepTime: undefined,
  });

  assert.deepEqual(result.scores, {
    opsCR: null,
    dispatchTime: null,
    pickingTime: null,
    assignmentTime: null,
    prepTime: null,
  });
  assert.equal(result.overallScore, null);
});

test("overallScore يقرّب لرقمين عشريين", () => {
  const result = calculateKpiScore({
    opsCR: 1,
    dispatchTime: 10,
    pickingTime: 2,
    assignmentTime: 1,
    prepTime: 3,
  });

  assert.equal(result.scores.opsCR, 100);
  assert.equal(result.scores.dispatchTime, 70);
  assert.equal(result.scores.pickingTime, 85);
  assert.equal(result.scores.assignmentTime, 30);
  assert.equal(result.scores.prepTime, 66.66666666666666);

  const expectedAverage = (100 + 70 + 85 + 30 + 66.66666666666666) / 5;
  assert.equal(result.overallScore, Math.round(expectedAverage * 100) / 100);
});
