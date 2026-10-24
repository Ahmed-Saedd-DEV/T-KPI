"use strict";

const auditRepository = require("../../../repositories/auditRepository");

async function getAuditLogs(query = {}) {
  const filter = {};
  const options = {};

  if (query.entityType) filter.entityType = query.entityType;
  if (query.action) filter.action = query.action;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) {
      filter.createdAt.gte = new Date(query.from + "T00:00:00.000Z");
    }
    if (query.to) {
      filter.createdAt.lte = new Date(query.to + "T23:59:59.999Z");
    }
  }

  const limit = Number(query.limit ?? 50);
  if (Number.isFinite(limit) && limit > 0) {
    options.take = Math.min(limit, 200);
  }

  return auditRepository.findAuditLogs(filter, options);
}

module.exports = { getAuditLogs };
