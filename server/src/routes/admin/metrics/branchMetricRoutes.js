"use strict";

const express = require("express");
const auth = require("../../../middleware/auth/auth");
const authorize = require("../../../middleware/auth/authorize");
const branchMetricController = require("../../../controllers/admin/metrics/branchMetricController");
const metricCreateValidator = require("../../../validators/admin/metrics/metricCreateValidator");
const metricUpdateValidator = require("../../../validators/admin/metrics/metricUpdateValidator");
const metricDateValidator = require("../../../validators/admin/metrics/metricDateValidator");
const metricRangeValidator = require("../../../validators/admin/metrics/metricRangeValidator");

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
  metricRangeValidator,
  branchMetricController.getDailyMetrics,
);

router.get("/best", auth, branchMetricController.getBestDay);

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
