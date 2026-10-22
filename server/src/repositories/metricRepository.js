"use strict";

const prisma = require("../prisma/prismaClient");

function findByDate(metricDate, options = {}) {
  return prisma.branchDailyMetric.findUnique({
    where: { metricDate },
    ...options,
  });
}

function findAll(filters = {}) {
  return prisma.branchDailyMetric.findMany(filters);
}

function create(data) {
  return prisma.branchDailyMetric.create({ data });
}

function update(metricDate, data, options = {}) {
  return prisma.branchDailyMetric.update({
    where: { metricDate },
    data,
    ...options,
  });
}

function deleteByDate(metricDate, tx = prisma) {
  return tx.branchDailyMetric.delete({ where: { metricDate } });
}

module.exports = { findByDate, findAll, create, update, deleteByDate };
