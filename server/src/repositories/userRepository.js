"use strict";

const prisma = require("../prisma/prismaClient");

function findByEmail(email, options = {}) {
  return prisma.user.findUnique({ where: { email }, ...options });
}

function findById(id, options = {}) {
  return prisma.user.findUnique({ where: { id }, ...options });
}

function findAll(options = {}) {
  return prisma.user.findMany(options);
}

function create(data, options = {}) {
  return prisma.user.create({ data, ...options });
}

function update(id, data, options = {}) {
  return prisma.user.update({ where: { id }, data, ...options });
}

function deleteById(id) {
  return prisma.user.delete({ where: { id } });
}

function findFirstByEmployeeId(employeeId, excludeUserId) {
  return prisma.user.findFirst({
    where: {
      employeeId,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

module.exports = {
  findByEmail,
  findById,
  findAll,
  create,
  update,
  deleteById,
  findFirstByEmployeeId,
};
