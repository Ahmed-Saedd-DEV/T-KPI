"use strict";

const employeeRepository = require("../../repositories/employeeRepository");
const { calculateKpiScore } = require("../../domain/kpi/kpiCalculator");
const { buildSearchFilter } = require("../../utils/query/buildSearchFilter");
const { buildScoreFilter } = require("../../utils/query/buildScoreFilter");
const { passesScoreFilter } = require("../../utils/query/passesScoreFilter");
const {
  buildSortComparator,
} = require("../../utils/query/buildSortComparator");

async function getEmployeeList(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const skip = (page - 1) * limit;
  const searchFilter = buildSearchFilter(query.search);
  const scoreFilter = buildScoreFilter(query);
  const sortBy =
    query.sortBy === undefined
      ? "score"
      : String(query.sortBy).trim().toLowerCase();
  const order =
    query.order === undefined
      ? "desc"
      : String(query.order).trim().toLowerCase();

  const employees =
    await employeeRepository.getEmployeesWithLatestPerformance(searchFilter);

  const scored = [];

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
        scored.push(entry);
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

    scored.push({
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      orders: latestPerformance.orders,
      metrics,
      kpi,
    });
  }

  scored.sort(buildSortComparator(sortBy, order));

  const paginated = scored.slice(skip, skip + limit);

  return {
    data: paginated,
    pagination: {
      total: scored.length,
      page,
      limit,
      totalPages: Math.ceil(scored.length / limit),
    },
  };
}

async function getTopEmployees() {
  const employees =
    await employeeRepository.getTopEmployeesWithLatestPerformance();

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
        orders: latestPerformance.orders,
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
