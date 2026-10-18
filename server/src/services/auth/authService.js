const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");
const { signToken, verifyToken } = require("../../security/tokenService");
const {
  hashPassword,
  comparePassword,
} = require("../../security/passwordService");
const {
  validatePasswordPolicy,
  PASSWORD_POLICY_MESSAGE,
} = require("../../validators/auth/registerValidator");

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

  if (!isValidEmail.test(normalizedEmail)) {
    throw new AppError("Invalid registration data", 400, true);
  }

  if (!validatePasswordPolicy(plainPassword)) {
    throw new AppError(PASSWORD_POLICY_MESSAGE, 400, true);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409, true);
  }

  const passwordHash = await hashPassword(plainPassword);

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role: "USER",
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  const token = signToken(newUser.id);

  return {
    token,
    user: sanitizeUser(newUser),
  };
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

async function getMe({ authHeader, currentUser }) {
  let user = currentUser;

  if (!user) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401, true);
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyToken(token);

    user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("Unauthorized", 401, true);
    }
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    employeeId: user.employeeId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = {
  register,
  login,
  findUserById,
  getMe,
};
