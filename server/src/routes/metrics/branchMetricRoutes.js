"use strict";

const express = require("express");
const auth = require("../../middleware/auth/auth");
const authorize = require("../../middleware/auth/authorize");
const branchMetricController = require("../../controllers/metrics/branchMetricController");
const metricCreateValidator = require("../../validators/admins/metricCreateValidator");
const metricUpdateValidator = require("../../validators/admins/metricUpdateValidator");
const metricDateValidator = require("../../validators/admins/metricDateValidator");

const router = express.Router();

router.post(
  "/",
  auth,
  authorize("ADMIN"),
  metricCreateValidator,
  branchMetricController.createDailyMetric,
);

router.get(
  "/",
  auth,
  authorize("ADMIN"),
  branchMetricController.getDailyMetrics,
);

router.get(
  "/:date",
  auth,
  authorize("ADMIN"),
  metricDateValidator,
  branchMetricController.getDailyMetricByDate,
);

router.patch(
  "/:date",
  auth,
  authorize("ADMIN"),
  metricDateValidator,
  metricUpdateValidator,
  branchMetricController.updateDailyMetric,
);

router.delete(
  "/:date",
  auth,
  authorize("ADMIN"),
  metricDateValidator,
  branchMetricController.deleteDailyMetric,
);

module.exports = router;
