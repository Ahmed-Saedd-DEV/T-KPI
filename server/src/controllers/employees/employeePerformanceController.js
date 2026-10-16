"use strict";

const employeePerformanceService = require("../../services/employees/employeePerformanceService");

async function getEmployeePerformance(req, res, next) {
  try {
    const result = await employeePerformanceService.getEmployeePerformance(
      req.params.id,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getEmployeePerformance };
