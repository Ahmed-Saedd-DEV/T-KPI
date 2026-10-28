"use strict";

const SAFE_ZONE_TARGETS = {
  opsCR: 1,
  dispatchTime: 7,
  pickingTime: 1.7,
  assignmentTime: 0.3,
  prepTime: 2,
};

function calculateMetricScore(safeZone, actualValue) {
  if (!Number.isFinite(actualValue) || actualValue <= 0) {
    return null;
  }

  if (!Number.isFinite(safeZone) || safeZone < 0) {
    return null;
  }

  const score = (safeZone / actualValue) * 100;
  const cappedScore = Math.min(100, score);

  if (!Number.isFinite(cappedScore) || cappedScore < 0) {
    return null;
  }

  return cappedScore;
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

  const metricKeys = Object.keys(SAFE_ZONE_TARGETS);
  const validScores = [];

  for (const key of metricKeys) {
    const safeZone = SAFE_ZONE_TARGETS[key];
    const actualValue = metrics[key];

    const score = calculateMetricScore(safeZone, actualValue);
    scores[key] = score;

    if (score !== null) {
      validScores.push(score);
    }
  }

  if (validScores.length === 0) {
    return {
      scores,
      overallScore: null,
    };
  }

  const average =
    validScores.reduce((sum, value) => sum + value, 0) / validScores.length;
  const overallScore = Math.round(average * 100) / 100;

  return {
    scores,
    overallScore,
  };
}

module.exports = {
  calculateKpiScore,
};
