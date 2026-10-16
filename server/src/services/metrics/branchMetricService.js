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

  try {
    const metric = await prisma.branchDailyMetric.create({
      data: {
        metricDate,
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

module.exports = {
  createDailyMetric,
  getDailyMetrics,
  getDailyMetricByDate,
  updateDailyMetric,
  deleteDailyMetric,
};
