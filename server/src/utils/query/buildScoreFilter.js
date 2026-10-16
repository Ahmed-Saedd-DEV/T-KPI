"use strict";

const SCORE_FILTER_KEYS = [
  "minScore",
  "maxScore",
  "minOpsCR",
  "maxOpsCR",
  "minDispatchTime",
  "maxDispatchTime",
  "minPickingTime",
  "maxPickingTime",
  "minAssignmentTime",
  "maxAssignmentTime",
  "minPrepTime",
  "maxPrepTime",
];

function parseScoreParam(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 100) return null;
  return num;
}

function buildScoreFilter(query) {
  const filters = {};

  for (const key of SCORE_FILTER_KEYS) {
    const parsed = parseScoreParam(query[key]);
    if (parsed !== null) {
      filters[key] = parsed;
    }
  }

  return filters;
}

module.exports = { buildScoreFilter, SCORE_FILTER_KEYS };
