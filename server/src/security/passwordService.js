const bcrypt = require("bcryptjs");

async function comparePassword(plainPassword, passwordHash) {
  if (typeof plainPassword !== "string" || typeof passwordHash !== "string") {
    return false;
  }

  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = {
  comparePassword,
};
