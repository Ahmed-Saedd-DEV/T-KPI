"use strict";

const auditService = require("../../../services/admin/audit/auditService");

async function getAuditLogs(req, res, next) {
  try {
    const logs = await auditService.getAuditLogs(req.query);
    res.status(200).json({ status: "success", data: logs });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAuditLogs };
