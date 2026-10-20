"use strict";

const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(dateStr) {
  if (!dateStr || !DATE_REGEX.test(dateStr)) return null;
  const d = new Date(dateStr + "T00:00:00.000Z");
  if (isNaN(d.getTime())) return null;
  return d;
}

async function createDailyMetric(data, actor) {
  const metricDate = parseDate(data.metricDate);
  const recordedAt = data.recordedAt ? new Date(data.recordedAt) : undefined;

  try {
    const metric = await prisma.branchDailyMetric.create({
      data: {
        metricDate,
        ...(recordedAt ? { recordedAt } : {}),
        opsCR: Number(data.opsCR),
        dispatchTime: Number(data.dispatchTime),
        prepTime: Number(data.prepTime),
        assignmentTime: Number(data.assignmentTime),
        createdById: actor.id,
      },
    });

    return {
      ...metric,
      opsCR: Number(metric.opsCR),
      dispatchTime: Number(metric.dispatchTime),
      prepTime: Number(metric.prepTime),
      assignmentTime: Number(metric.assignmentTime),
    };
  } catch (error) {
    if (error && error.code === "P2002") {
      throw new AppError(
        "A metric record already exists for this date",
        409,
        true,
      );
    }
    throw error;
  }
}

async function getDailyMetrics(query = {}) {
  const where = {};

  const from = parseDate(query.from);
  const to = parseDate(query.to);

  if (from || to) {
    where.metricDate = {};
    if (from) where.metricDate.gte = from;
    if (to) where.metricDate.lte = to;
  }

  const metrics = await prisma.branchDailyMetric.findMany({
    where,
    orderBy: { metricDate: "desc" },
    include: {
      createdBy: { select: { id: true, email: true, role: true } },
      updatedBy: { select: { id: true, email: true, role: true } },
    },
  });

  return metrics.map((metric) => ({
    ...metric,
    opsCR: Number(metric.opsCR),
    dispatchTime: Number(metric.dispatchTime),
    prepTime: Number(metric.prepTime),
    assignmentTime: Number(metric.assignmentTime),
  }));
}

async function getDailyMetricByDate(dateStr) {
  const metricDate = parseDate(dateStr);

  const metric = await prisma.branchDailyMetric.findUnique({
    where: { metricDate },
    include: {
      createdBy: { select: { id: true, email: true, role: true } },
      updatedBy: { select: { id: true, email: true, role: true } },
    },
  });

  if (!metric) {
    throw new AppError("No metric record found for this date", 404, true);
  }

  return {
    ...metric,
    opsCR: Number(metric.opsCR),
    dispatchTime: Number(metric.dispatchTime),
    prepTime: Number(metric.prepTime),
    assignmentTime: Number(metric.assignmentTime),
  };
}

async function updateDailyMetric(dateStr, data, actor) {
  const metricDate = parseDate(dateStr);
  const keys = Object.keys(data || {});

  const existing = await prisma.branchDailyMetric.findUnique({
    where: { metricDate },
  });

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

  const metric = await prisma.branchDailyMetric.update({
    where: { metricDate },
    data: updates,
    include: {
      createdBy: { select: { id: true, email: true, role: true } },
      updatedBy: { select: { id: true, email: true, role: true } },
    },
  });

  return {
    ...metric,
    opsCR: Number(metric.opsCR),
    dispatchTime: Number(metric.dispatchTime),
    prepTime: Number(metric.prepTime),
    assignmentTime: Number(metric.assignmentTime),
  };
}

async function deleteDailyMetric(dateStr, actor) {
  const metricDate = parseDate(dateStr);

  const existing = await prisma.branchDailyMetric.findUnique({
    where: { metricDate },
  });

  if (!existing) {
    throw new AppError("No metric record found for this date", 404, true);
  }

  const actorSnapshot =
    actor && typeof actor === "object"
      ? {
          id: actor.id || null,
          email: actor.email || null,
          role: actor.role || null,
        }
      : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.branchDailyMetric.delete({ where: { metricDate } });

      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entityType: "BranchDailyMetric",
          entityId: existing.id,
          beforeData: existing,
          actorUserId: actor && actor.id ? actor.id : null,
          actorSnapshot,
        },
      });
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
  const records = await prisma.branchDailyMetric.findMany({
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
