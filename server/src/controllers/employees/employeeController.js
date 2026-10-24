const employeeService = require("../../services/employees/employeeService");
const employeeListService = require("../../services/employees/employeeListService");

async function getEmployees(req, res, next) {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await employeeListService.getEmployeeList({
      ...filters,
      page,
      limit,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getTopEmployees(req, res, next) {
  try {
    const result = await employeeListService.getTopEmployees();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.status(200).json(employee);
  } catch (error) {
    next(error);
  }
}

async function getEmployeeByCode(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeByCode(
      req.params.employeeCode,
    );
    res.status(200).json(employee);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEmployees,
  getTopEmployees,
  getEmployeeById,
  getEmployeeByCode,
};
