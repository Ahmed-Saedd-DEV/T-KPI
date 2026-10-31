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
  const client = tx || prisma;
  return client.employee.delete({ where: { id } });
}

function deletePerformancesByEmployeeId(employeeId, tx = prisma) {
  const client = tx || prisma;
  return client.employeePerformance.deleteMany({ where: { employeeId } });
}

function getEmployeesWithLatestPerformance(searchFilter) {
  return prisma.employee.findMany({
    where: searchFilter || undefined,
    orderBy: { createdAt: "desc" },
    include: {
      performances: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          importBatch: {
            select: {
              id: true,
              fileName: true,
              createdAt: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

function getEmployeesWithCompletedPerformance(searchFilter, options = {}) {
  const { take } = options;

  return prisma.employee.findMany({
    where: searchFilter || undefined,
    orderBy: { createdAt: "desc" },
    include: {
      performances: {
        where: {
          importBatch: {
            status: "COMPLETED",
          },
        },
        orderBy: { createdAt: "desc" },
        ...(take !== undefined ? { take } : {}),
        include: {
          importBatch: {
            select: {
              id: true,
              fileName: true,
              createdAt: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

function getTopEmployeesWithLatestPerformance() {
  return prisma.employee.findMany({
    include: {
      performances: {
        orderBy: { periodStart: "desc" },
        take: 1,
      },
    },
  });
}

function findPerformanceRecordsByEmployeeId(employeeId) {
  return prisma.employeePerformance.findMany({
    where: { employeeId },
    include: {
      importBatch: {
        select: {
          id: true,
          fileName: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  findById,
  findByCode,
  findAll,
  create,
  update,
  deleteById,
  deletePerformancesByEmployeeId,
  getEmployeesWithLatestPerformance,
  getEmployeesWithCompletedPerformance,
  getTopEmployeesWithLatestPerformance,
  findPerformanceRecordsByEmployeeId,
};
