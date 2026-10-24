"use strict";

const auditRepository = require("../../repositories/auditRepository");

async function createAuditLog({
  action,
  entityType,
  entityId,
  beforeData,
  afterData,
  actor,
  tx = null,
}) {
  const actorSnapshot = actor
    ? { id: actor.id, email: actor.email, role: actor.role }
    : null;

  const payload = {
    action,
    entityType,
    entityId,
    beforeData: beforeData || null,
    afterData: afterData || null,
    actorUserId: actor?.id || null,
    actorSnapshot,
  };

  try {
    if (tx) {
      await tx.auditLog.create({ data: payload });
      return null;
    }

    await auditRepository.createAuditLog(payload);
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = { createAuditLog };
