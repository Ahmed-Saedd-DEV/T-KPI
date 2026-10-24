"use strict";

function passesScoreFilter(kpi, scoreFilter) {
  if (Object.keys(scoreFilter).length === 0) return true;

  const { overallScore, scores } = kpi;

  if (
    scoreFilter.minScore !== undefined &&
    (overallScore === null || overallScore < scoreFilter.minScore)
  )
    return false;
  if (
    scoreFilter.maxScore !== undefined &&
    (overallScore === null || overallScore > scoreFilter.maxScore)
  )
    return false;
  if (
    scoreFilter.minOpsCR !== undefined &&
    (scores.opsCR === null || scores.opsCR < scoreFilter.minOpsCR)
  )
    return false;
  if (
    scoreFilter.maxOpsCR !== undefined &&
    (scores.opsCR === null || scores.opsCR > scoreFilter.maxOpsCR)
  )
    return false;
  if (
    scoreFilter.minDispatchTime !== undefined &&
    (scores.dispatchTime === null ||
      scores.dispatchTime < scoreFilter.minDispatchTime)
  )
    return false;
  if (
    scoreFilter.maxDispatchTime !== undefined &&
    (scores.dispatchTime === null ||
      scores.dispatchTime > scoreFilter.maxDispatchTime)
  )
    return false;
  if (
    scoreFilter.minPickingTime !== undefined &&
    (scores.pickingTime === null ||
      scores.pickingTime < scoreFilter.minPickingTime)
  )
    return false;
  if (
    scoreFilter.maxPickingTime !== undefined &&
    (scores.pickingTime === null ||
      scores.pickingTime > scoreFilter.maxPickingTime)
  )
    return false;
  if (
    scoreFilter.minAssignmentTime !== undefined &&
    (scores.assignmentTime === null ||
      scores.assignmentTime < scoreFilter.minAssignmentTime)
  )
    return false;
  if (
    scoreFilter.maxAssignmentTime !== undefined &&
    (scores.assignmentTime === null ||
      scores.assignmentTime > scoreFilter.maxAssignmentTime)
  )
    return false;
  if (
    scoreFilter.minPrepTime !== undefined &&
    (scores.prepTime === null || scores.prepTime < scoreFilter.minPrepTime)
  )
    return false;
  if (
    scoreFilter.maxPrepTime !== undefined &&
    (scores.prepTime === null || scores.prepTime > scoreFilter.maxPrepTime)
  )
    return false;

  return true;
}

module.exports = { passesScoreFilter };
