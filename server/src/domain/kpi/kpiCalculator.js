"use strict";

const KPI_TARGETS = {
  opsCR: 1,
  dispatchTime: 7,
  prepTime: 2,
};

function convertOpsCrForScoring(storedOpsCR) {
  if (!Number.isFinite(storedOpsCR) || storedOpsCR < 0) {
    return null;
  }

  return storedOpsCR * 100;
}

function calculateMetricScore(target, actualValue) {
  if (!Number.isFinite(actualValue) || actualValue < 0) {
    return null;
  }

  if (!Number.isFinite(target) || target <= 0) {
    return null;
  }

  const score = (100 * (4 * target)) / (4 * target + actualValue);

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }

  return score;
}

function calculateKpiScore(metrics) {
  const scores = {
    opsCR: null,
    dispatchTime: null,
    pickingTime: null,
    assignmentTime: null,
    prepTime: null,
  };

  if (!metrics || typeof metrics !== "object") {
    return {
      scores,
      overallScore: null,
    };
  }

  const opsCRValue = convertOpsCrForScoring(metrics.opsCR);
  const dispatchValue = Number(metrics.dispatchTime);
  const prepValue = Number(metrics.prepTime);

  scores.opsCR = calculateMetricScore(KPI_TARGETS.opsCR, opsCRValue);
  scores.dispatchTime = calculateMetricScore(
    KPI_TARGETS.dispatchTime,
    dispatchValue,
  );
  scores.prepTime = calculateMetricScore(KPI_TARGETS.prepTime, prepValue);

  const requiredMetrics = [scores.opsCR, scores.dispatchTime, scores.prepTime];

  if (requiredMetrics.some((score) => score === null)) {
    return {
      scores,
      overallScore: null,
    };
  }

  const overallScore =
    (scores.opsCR + scores.dispatchTime + scores.prepTime) / 3;

  return {
    scores,
    overallScore: Number(overallScore.toFixed(2)),
  };
}

module.exports = {
  calculateKpiScore,
  KPI_TARGETS,
  convertOpsCrForScoring,
};
