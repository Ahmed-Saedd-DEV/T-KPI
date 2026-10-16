const employeeService = require("../../services/employees/employeeService");

async function createEmployee(req, res, next) {
  try {
    const employee = await employeeService.createEmployee(req.body || {});
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const employee = await employeeService.updateEmployee(
      req.params.id,
      req.body || {},
    );
    res.status(200).json(employee);
  } catch (error) {
    next(error);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    await employeeService.deleteEmployee(req.params.id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
