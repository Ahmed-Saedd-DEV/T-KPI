"use strict";

const prisma = require("../prisma/prismaClient");

async function createAuditLog(data) {
  return prisma.auditLog.create({ data });
}

async function findAuditLogs(filter = {}, options = {}) {
  return prisma.auditLog.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
    ...(options.take ? { take: options.take } : {}),
    include: {
      actorUser: {
        select: { id: true, email: true, role: true },
      },
    },
  });
}

module.exports = { createAuditLog, findAuditLogs };
