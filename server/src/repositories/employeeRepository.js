"use strict";

const prisma = require("../prisma/prismaClient");

function findById(id) {
  return prisma.employee.findUnique({ where: { id } });
}

function findByCode(employeeCode) {
  return prisma.employee.findUnique({ where: { employeeCode } });
}

function findAll() {
  return prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });
}

function create(data) {
  return prisma.employee.create({ data });
}

function update(id, data) {
  return prisma.employee.update({ where: { id }, data });
}

function deleteById(id, tx = prisma) {
  return tx.employee.delete({ where: { id } });
}

function deletePerformancesByEmployeeId(employeeId, tx) {
  return tx.employeePerformance.deleteMany({ where: { employeeId } });
}

module.exports = {
  findById,
  findByCode,
  findAll,
  create,
  update,
  deleteById,
  deletePerformancesByEmployeeId,
};
