const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");
const { signToken } = require("../../security/tokenService");
const { comparePassword } = require("../../security/passwordService");

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

async function register({ email, password }) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const plainPassword = typeof password === "string" ? password : "";
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!isValidEmail.test(normalizedEmail) || plainPassword.length === 0) {
    throw new AppError("Invalid credentials", 401, true);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });
  if (user) {
    throw new AppError("User already exists", 409, true);
  }

  const hashedPassword = await hashPassword(plainPassword);

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      role: "USER",
      isActive: true,
    },
  });

  return sanitizeUser(newUser);
}

async function login({ email, password }) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const plainPassword = typeof password === "string" ? password : "";
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!isValidEmail.test(normalizedEmail) || plainPassword.length === 0) {
    throw new AppError("Invalid credentials", 401, true);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("Invalid credentials", 401, true);
  }

  const isPasswordValid = await comparePassword(
    plainPassword,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401, true);
  }

  const token = signToken(user.id);

  return {
    token,
    user: sanitizeUser(user),
  };
}

async function logout(user) {
  if (!user || !user.id) {
    throw new AppError("Invalid user", 400, true);
  }
}

async function findUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("Unauthorized", 401, true);
  }

  return sanitizeUser(user);
}

module.exports = {
  register,
  login,
  logout,
  findUserById,
};
