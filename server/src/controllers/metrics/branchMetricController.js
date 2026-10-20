"use strict";

const branchMetricService = require("../../services/metrics/branchMetricService");

async function createDailyMetric(req, res, next) {
  try {
    const { recordedAt, ...rest } = req.body || {};
    const metric = await branchMetricService.createDailyMetric(
      {
        ...rest,
        recordedAt,
      },
      req.user,
    );
    res.status(201).json(metric);
  } catch (error) {
    next(error);
  }
}

async function getDailyMetrics(req, res, next) {
  try {
    const metrics = await branchMetricService.getDailyMetrics(req.query);
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
}

async function getBestDay(req, res, next) {
  try {
    const result = await branchMetricService.getBestDay();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getDailyMetricByDate(req, res, next) {
  try {
    const metric = await branchMetricService.getDailyMetricByDate(
      req.params.date,
    );
    res.status(200).json(metric);
  } catch (error) {
    next(error);
  }
}

async function updateDailyMetric(req, res, next) {
  try {
    const { recordedAt, ...rest } = req.body || {};
    const metric = await branchMetricService.updateDailyMetric(
      req.params.date,
      {
        ...rest,
        recordedAt,
      },
      req.user,
    );
    res.status(200).json(metric);
  } catch (error) {
    next(error);
  }
}

async function deleteDailyMetric(req, res, next) {
  try {
    await branchMetricService.deleteDailyMetric(req.params.date, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDailyMetric,
  getDailyMetrics,
  getBestDay,
  getDailyMetricByDate,
  updateDailyMetric,
  deleteDailyMetric,
};
