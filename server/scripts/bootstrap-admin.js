require("dotenv").config();

const bcrypt = require("bcryptjs");
const readline = require("node:readline/promises");
const prisma = require("../src/prisma/prismaClient");

function validateEmail(email) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return isValidEmail.test(normalizedEmail) ? normalizedEmail : null;
}

function validatePassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  const hasMinLength = password.length >= 12;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSymbol;
}

async function promptHidden(promptText) {
  if (
    !process.stdin.isTTY ||
    !process.stdout.isTTY ||
    typeof process.stdin.setRawMode !== "function"
  ) {
    throw new Error(
      "Hidden password input is not supported in this terminal. Run the bootstrap script in an interactive TTY session to continue.",
    );
  }

  return new Promise((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    const onData = (chunk) => {
      const input = chunk.toString("utf8");

      for (const char of input) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Admin bootstrap cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
          }
          process.stdout.write("\b \b");
          continue;
        }

        value += char;
        process.stdout.write("*");
      }
    };

    process.stdin.on("data", onData);
    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdout.write(promptText);
  });
}

async function bootstrapAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const emailInput = await rl.question("Admin email: ");
    const email = validateEmail(emailInput);

    if (!email) {
      throw new Error(
        "Admin email is invalid. Please use a valid email address.",
      );
    }

    const password = await promptHidden("Admin password: ");

    if (!validatePassword(password)) {
      throw new Error(
        "Password must be at least 12 characters and contain uppercase, lowercase, number, and special character.",
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new Error(
        "A user with this email already exists. Aborting without modifying the existing account.",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("Initial admin account created successfully.");
  } catch (error) {
    console.error("Admin bootstrap failed:", error.message);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  bootstrapAdmin()
    .then(() => {
      process.exitCode = 0;
    })
    .catch(() => {
      process.exitCode = 1;
    });
}

module.exports = {
  validateEmail,
  validatePassword,
  promptHidden,
  bootstrapAdmin,
};
