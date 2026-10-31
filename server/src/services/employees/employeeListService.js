"use strict";

const employeeRepository = require("../../repositories/employeeRepository");
const { calculateKpiScore } = require("../../domain/kpi/kpiCalculator");
const { buildSearchFilter } = require("../../utils/query/buildSearchFilter");
const { buildScoreFilter } = require("../../utils/query/buildScoreFilter");
const { passesScoreFilter } = require("../../utils/query/passesScoreFilter");
const {
  buildSortComparator,
} = require("../../utils/query/buildSortComparator");

function getCairoLocalParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function convertCairoLocalDateTimeToUtc(
  year,
  month,
  day,
  hour,
  minute,
  second = 0,
  ms = 0,
) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);

  for (let index = 0; index < 4; index += 1) {
    const local = getCairoLocalParts(new Date(utcMs));
    const localMs = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
      ms,
    );
    const targetMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);
    const nextUtcMs = utcMs + (targetMs - localMs);

    if (Math.abs(nextUtcMs - utcMs) < 1000) {
      return new Date(nextUtcMs);
    }

    utcMs = nextUtcMs;
  }

  return new Date(utcMs);
}

function getCairoDateRange(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const startUtc = convertCairoLocalDateTimeToUtc(year, month, day, 0, 0, 0, 0);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  const nextDayUtc = convertCairoLocalDateTimeToUtc(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
    0,
    0,
    0,
    0,
  );

  return {
    gte: startUtc,
    lt: nextDayUtc,
  };
}

function isWithinCairoDate(value, dateString) {
  const targetTime = new Date(value).getTime();
  const range = getCairoDateRange(dateString);
  if (!range || Number.isNaN(targetTime)) {
    return false;
  }

  return targetTime >= range.gte.getTime() && targetTime < range.lt.getTime();
}

function getLatestCompletedBatchId(performances) {
  const completed = (performances || []).filter(
    (performance) =>
      performance?.importBatch &&
      performance.importBatch.status === "COMPLETED",
  );

  if (completed.length === 0) {
    return null;
  }

  completed.sort((left, right) => {
    const leftTime = new Date(left.importBatch.createdAt).getTime();
    const rightTime = new Date(right.importBatch.createdAt).getTime();
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return String(right.importBatch.id).localeCompare(
      String(left.importBatch.id),
    );
  });

  return completed[0].importBatch.id;
}

function getLatestSelectedPerformance(
  performances,
  mode,
  uploadDate,
  latestBatchId,
) {
  const selected = (performances || []).filter((performance) => {
    if (!performance?.importBatch) {
      return false;
    }

    if (performance.importBatch.status !== "COMPLETED") {
      return false;
    }

    if (mode === "latest-batch") {
      return performance.importBatch.id === latestBatchId;
    }

    if (mode === "upload-date") {
      return isWithinCairoDate(performance.importBatch.createdAt, uploadDate);
    }

    return false;
  });

  if (selected.length === 0) {
    return null;
  }

  selected.sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return String(right.id).localeCompare(String(left.id));
  });

  return selected[0];
}

function normalizeAvailableDateList(values = []) {
  return Array.from(
    new Set(
      (values || [])
        .map((entry) => {
          const rawValue =
            typeof entry === "string"
              ? entry
              : entry && typeof entry === "object"
                ? (entry.date ?? entry.metricDate ?? entry.createdDate ?? "")
                : "";
          const normalized = String(rawValue).trim();
          return normalized.length >= 10 ? normalized.slice(0, 10) : "";
        })
        .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

async function getAvailableImportDates() {
  const rows = await employeeRepository.getAvailableImportDates();
  return normalizeAvailableDateList(rows);
}

async function getEmployeeList(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const skip = (page - 1) * limit;
  const searchFilter = buildSearchFilter(query.search);
  const scoreFilter = buildScoreFilter(query);
  const mode =
    query.mode === undefined ? null : String(query.mode).trim().toLowerCase();
  const uploadDate =
    query.uploadDate === undefined ? null : String(query.uploadDate).trim();
  const sortBy =
    query.sortBy === undefined
      ? "score"
      : String(query.sortBy).trim().toLowerCase();
  const order =
    query.order === undefined
      ? "desc"
      : String(query.order).trim().toLowerCase();

  const employees =
    mode === null
      ? await employeeRepository.getEmployeesWithLatestPerformance(searchFilter)
      : await employeeRepository.getEmployeesWithCompletedPerformance(
          searchFilter,
        );

  const latestBatchId =
    mode === "latest-batch"
      ? getLatestCompletedBatchId(
          employees.flatMap((employee) => employee.performances || []),
        )
      : null;

  const scored = [];

  for (const employee of employees) {
    const latestPerformance =
      mode === null
        ? employee.performances[0] || null
        : getLatestSelectedPerformance(
            employee.performances,
            mode,
            uploadDate,
            latestBatchId,
          );

    if (!latestPerformance) {
      if (mode === null) {
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

module.exports = {
  getEmployeeList,
  getTopEmployees,
  getAvailableImportDates,
  getLatestCompletedBatchId,
  getLatestSelectedPerformance,
  getCairoDateRange,
  isWithinCairoDate,
  convertCairoLocalDateTimeToUtc,
};
