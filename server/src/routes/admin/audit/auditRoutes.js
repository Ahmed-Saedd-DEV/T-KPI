"use strict";

const express = require("express");
const auth = require("../../../middleware/auth/auth");
const authorize = require("../../../middleware/auth/authorize");
const auditController = require("../../../controllers/admin/audit/auditController");
const auditListValidator = require("../../../validators/admin/audit/auditListValidator");

const router = express.Router();

router.get(
  "/",
  auth,
  authorize("ADMIN"),
  auditListValidator,
  auditController.getAuditLogs,
);

module.exports = router;
