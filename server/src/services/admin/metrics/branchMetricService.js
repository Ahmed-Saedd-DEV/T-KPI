"use strict";

const metricRepository = require("../../../repositories/metricRepository");
const AppError = require("../../../utils/AppError");
const { createAuditLog } = require("../../../utils/audit/createAuditLog");
const {
  buildDateRangeFilter,
} = require("../../../utils/query/buildDateRangeFilter");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(dateStr) {
  if (!dateStr || !DATE_REGEX.test(dateStr)) return null;
  const d = new Date(dateStr + "T00:00:00.000Z");
  if (isNaN(d.getTime())) return null;
  return d;
}

function serializeMetric(metric) {
  return {
    ...metric,
    opsCR: metric.opsCR !== null ? Number(metric.opsCR) : null,
    dispatchTime:
      metric.dispatchTime !== null ? Number(metric.dispatchTime) : null,
    prepTime: metric.prepTime !== null ? Number(metric.prepTime) : null,
    assignmentTime:
      metric.assignmentTime !== null ? Number(metric.assignmentTime) : null,
    orderCount: metric.orderCount !== null ? Number(metric.orderCount) : null,
    atVendorTime:
      metric.atVendorTime !== null ? Number(metric.atVendorTime) : null,
    adjustTime: metric.adjustTime !== null ? Number(metric.adjustTime) : null,
  };
}

async function createDailyMetric(data, actor) {
  const metricDate = parseDate(data.metricDate);
  const recordedAt = data.recordedAt ? new Date(data.recordedAt) : undefined;

  const incomingFields = {};
  if (data.opsCR !== undefined && data.opsCR !== null && data.opsCR !== "") {
    incomingFields.opsCR = Number(data.opsCR);
  }
  if (
    data.dispatchTime !== undefined &&
    data.dispatchTime !== null &&
    data.dispatchTime !== ""
  ) {
    incomingFields.dispatchTime = Number(data.dispatchTime);
  }
  if (
    data.prepTime !== undefined &&
    data.prepTime !== null &&
    data.prepTime !== ""
  ) {
    incomingFields.prepTime = Number(data.prepTime);
  }
  if (
    data.assignmentTime !== undefined &&
    data.assignmentTime !== null &&
    data.assignmentTime !== ""
  ) {
    incomingFields.assignmentTime = Number(data.assignmentTime);
  }
  if (
    data.orderCount !== undefined &&
    data.orderCount !== null &&
    data.orderCount !== ""
  ) {
    incomingFields.orderCount = Number(data.orderCount);
  }
  if (
    data.atVendorTime !== undefined &&
    data.atVendorTime !== null &&
    data.atVendorTime !== ""
  ) {
    incomingFields.atVendorTime = Number(data.atVendorTime);
  }
  if (
    data.adjustTime !== undefined &&
    data.adjustTime !== null &&
    data.adjustTime !== ""
  ) {
    incomingFields.adjustTime = Number(data.adjustTime);
  }
  if (recordedAt) {
    incomingFields.recordedAt = recordedAt;
  }

  const existing = await metricRepository.findByDate(metricDate);

  if (!existing) {
    const metric = await metricRepository.create({
      metricDate,
      ...incomingFields,
      createdById: actor.id,
    });

    await createAuditLog({
      action: "CREATE",
      entityType: "BranchDailyMetric",
      entityId: metric.id,
      beforeData: null,
      afterData: {
        metricDate: metric.metricDate,
        ...incomingFields,
      },
      actor,
    });

    return { metric: serializeMetric(metric), created: true };
  }

  const conflictFields = [];
  for (const key of Object.keys(incomingFields)) {
    if (key === "recordedAt") continue;
    if (existing[key] !== null) {
      conflictFields.push(key);
    }
  }

  if (conflictFields.length > 0) {
    throw new AppError(
      `Field(s) already have a value: ${conflictFields.join(", ")}. Use PATCH to update.`,
      409,
      true,
    );
  }

  const updateData = { ...incomingFields, updatedById: actor.id };
  const metric = await metricRepository.update(metricDate, updateData);

  await createAuditLog({
    action: "UPDATE",
    entityType: "BranchDailyMetric",
    entityId: metric.id,
    beforeData: { metricDate: existing.metricDate },
    afterData: {
      metricDate: metric.metricDate,
      ...incomingFields,
    },
    actor,
  });

  return { metric: serializeMetric(metric), created: false };
}

async function getDailyMetrics(query = {}) {
  const { from, to } = query;
  const dateRangeFilter = buildDateRangeFilter(from, to);

  const metrics = await metricRepository.findAll({
    dateRangeFilter,
    orderBy: { metricDate: "desc" },
    include: {
      createdBy: { select: { id: true, email: true, role: true } },
      updatedBy: { select: { id: true, email: true, role: true } },
    },
  });

  return metrics.map((metric) => serializeMetric(metric));
}

async function getDailyMetricByDate(dateStr) {
  const metricDate = parseDate(dateStr);

  const metric = await metricRepository.findByDate(metricDate, {
    include: {
      createdBy: { select: { id: true, email: true, role: true } },
      updatedBy: { select: { id: true, email: true, role: true } },
    },
  });

  if (!metric) {
    throw new AppError("No metric record found for this date", 404, true);
  }

  return serializeMetric(metric);
}

async function updateDailyMetric(dateStr, data, actor) {
  const metricDate = parseDate(dateStr);
  const keys = Object.keys(data || {});

  const existing = await metricRepository.findByDate(metricDate);

  if (!existing) {
    throw new AppError("No metric record found for this date", 404, true);
  }

  const updates = {};
  for (const key of keys) {
    if (key === "recordedAt") {
      if (
        data.recordedAt !== undefined &&
        data.recordedAt !== null &&
        data.recordedAt !== ""
      ) {
        updates.recordedAt = new Date(data.recordedAt);
      }
      continue;
    }

    updates[key] = Number(data[key]);
  }
  updates.updatedById = actor.id;

  const metric = await metricRepository.update(metricDate, updates, {
    include: {
      createdBy: { select: { id: true, email: true, role: true } },
      updatedBy: { select: { id: true, email: true, role: true } },
    },
  });

  await createAuditLog({
    action: "UPDATE",
    entityType: "BranchDailyMetric",
    entityId: metric.id,
    beforeData: { metricDate: existing.metricDate },
    afterData: {
      metricDate: metric.metricDate,
      ...updates,
    },
    actor,
  });

  return serializeMetric(metric);
}

async function deleteDailyMetric(dateStr, actor) {
  const metricDate = parseDate(dateStr);

  const existing = await metricRepository.findByDate(metricDate);

  if (!existing) {
    throw new AppError("No metric record found for this date", 404, true);
  }

  try {
    await metricRepository.deleteByDate(metricDate);

    await createAuditLog({
      action: "DELETE",
      entityType: "BranchDailyMetric",
      entityId: existing.id,
      beforeData: { metricDate: existing.metricDate },
      afterData: null,
      actor,
    });

    return null;
  } catch (error) {
    if (error && error.code === "P2025") {
      throw new AppError("No metric record found for this date", 404, true);
    }
    throw error;
  }
}

function calculateBestDayScore(record) {
  const targets = {
    opsCR: 1,
    dispatchTime: 7,
    assignmentTime: 0.3,
    prepTime: 2,
  };

  const score = {
    overall: 0,
    opsCR: 0,
    dispatchTime: 0,
    assignmentTime: 0,
    prepTime: 0,
  };

  const validScores = [];

  for (const [metric, target] of Object.entries(targets)) {
    const actual = Number(record[metric]);

    if (!Number.isFinite(actual) || actual <= 0) {
      continue;
    }

    const metricScore = Math.min(100, (target / actual) * 100);

    if (!Number.isFinite(metricScore) || metricScore < 0) {
      continue;
    }

    score[metric] = Number(metricScore.toFixed(2));
    validScores.push(score[metric]);
  }

  if (validScores.length === 0) {
    return score;
  }

  score.overall = Number(
    (
      validScores.reduce((sum, value) => sum + value, 0) / validScores.length
    ).toFixed(2),
  );

  return score;
}

async function getBestDay() {
  const records = await metricRepository.findAll({
    orderBy: { metricDate: "asc" },
  });

  if (!records || records.length === 0) {
    throw new AppError("No branch metrics found", 404, true);
  }

  let bestRecord = null;
  let bestScore = -Infinity;

  for (const record of records) {
    const normalizedRecord = {
      ...record,
      opsCR: Number(record.opsCR),
      dispatchTime: Number(record.dispatchTime),
      prepTime: Number(record.prepTime),
      assignmentTime: Number(record.assignmentTime),
    };

    const score = calculateBestDayScore(normalizedRecord);

    if (score.overall > bestScore) {
      bestRecord = normalizedRecord;
      bestScore = score.overall;
      bestRecord.score = score;
    }
  }

  if (!bestRecord) {
    throw new AppError("No branch metrics found", 404, true);
  }

  return {
    status: "success",
    data: {
      metricDate: new Date(bestRecord.metricDate).toISOString().slice(0, 10),
      opsCR: bestRecord.opsCR,
      dispatchTime: bestRecord.dispatchTime,
      assignmentTime: bestRecord.assignmentTime,
      prepTime: bestRecord.prepTime,
      score: bestRecord.score,
    },
  };
}

module.exports = {
  createDailyMetric,
  getDailyMetrics,
  getDailyMetricByDate,
  updateDailyMetric,
  deleteDailyMetric,
  getBestDay,
};
