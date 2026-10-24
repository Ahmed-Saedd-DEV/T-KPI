"use strict";

const prisma = require("../prisma/prismaClient");

function createBatch(data) {
  return prisma.importBatch.create({ data });
}

function updateBatch(id, data) {
  return prisma.importBatch.update({ where: { id }, data });
}

function findAllBatches(filter = {}, options = {}) {
  const { take, ...restOptions } = options;

  return prisma.importBatch.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
    ...(take !== undefined ? { take } : {}),
    ...restOptions,
    include: {
      uploadedBy: {
        select: { id: true, email: true, role: true },
      },
    },
  });
}

function findBatchById(id) {
  return prisma.importBatch.findUnique({ where: { id } });
}

function deleteBatch(id, tx) {
  return tx.importBatch.delete({ where: { id } });
}

function findEmployeeByCode(employeeCode) {
  return prisma.employee.findUnique({ where: { employeeCode } });
}

function createEmployee(data) {
  return prisma.employee.create({ data });
}

function createPerformance(data, tx = prisma) {
  return tx.employeePerformance.create({ data });
}

module.exports = {
  createBatch,
  updateBatch,
  findAllBatches,
  findBatchById,
  deleteBatch,
  findEmployeeByCode,
  createEmployee,
  createPerformance,
};
