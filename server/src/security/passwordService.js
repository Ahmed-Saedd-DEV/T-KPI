const bcrypt = require("bcryptjs");

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12);
}

async function comparePassword(plainPassword, passwordHash) {
  if (typeof plainPassword !== "string" || typeof passwordHash !== "string") {
    return false;
  }

  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = {
  hashPassword,
  comparePassword,
};