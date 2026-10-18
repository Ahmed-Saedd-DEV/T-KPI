"use strict";

const prisma = require("../../prisma/prismaClient");
const { calculateKpiScore } = require("../kpi/kpiService");
const { buildSearchFilter } = require("../../utils/query/buildSearchFilter");
const { buildScoreFilter } = require("../../utils/query/buildScoreFilter");

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

async function getEmployeeList(query = {}) {
  const searchFilter = buildSearchFilter(query.search);
  const scoreFilter = buildScoreFilter(query);

  const employees = await prisma.employee.findMany({
    where: searchFilter || undefined,
    orderBy: { createdAt: "desc" },
    include: {
      performances: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          importBatch: {
            select: { id: true, fileName: true, createdAt: true },
          },
        },
      },
    },
  });

  const results = [];

  for (const employee of employees) {
    const latestPerformance = employee.performances[0] || null;

    if (!latestPerformance) {
      const entry = {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        orders: null,
        metrics: null,
        kpi: null,
      };
      if (Object.keys(scoreFilter).length === 0) {
        results.push(entry);
      }
      continue;
    }

    const metrics = {
      opsCR: Number(latestPerformance.opsCR),
      dispatchTime: Number(latestPerformance.dispatchTime),
      pickingTime: Number(latestPerformance.pickingTime),
      assignmentTime: Number(latestPerformance.assignmentTime),
      prepTime: Number(latestPerformance.prepTime),
    };

    const kpi = calculateKpiScore(metrics);

    if (!passesScoreFilter(kpi, scoreFilter)) continue;

    results.push({
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      orders: latestPerformance.orders,
      metrics,
      kpi,
    });
  }

  return results;
}

async function getTopEmployees() {
  const employees = await prisma.employee.findMany({
    include: {
      performances: {
        orderBy: { periodStart: "desc" },
        take: 1,
      },
    },
  });

  const rankedEmployees = employees
    .map((employee) => {
      const latestPerformance = employee.performances[0];

      if (!latestPerformance) {
        return null;
      }

      const metrics = {
        opsCR: Number(latestPerformance.opsCR),
        dispatchTime: Number(latestPerformance.dispatchTime),
        pickingTime: Number(latestPerformance.pickingTime),
        assignmentTime: Number(latestPerformance.assignmentTime),
        prepTime: Number(latestPerformance.prepTime),
      };

      const kpi = calculateKpiScore(metrics);

      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        overallScore: kpi.overallScore,
        scores: kpi.scores,
        lastPeriod: new Date(latestPerformance.periodStart)
          .toISOString()
          .slice(0, 10),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        (Number(b.overallScore) || -Infinity) -
        (Number(a.overallScore) || -Infinity),
    )
    .slice(0, 3)
    .map((employee, index) => ({
      rank: index + 1,
      ...employee,
    }));

  return {
    status: "success",
    data: rankedEmployees,
  };
}

module.exports = { getEmployeeList, getTopEmployees };
