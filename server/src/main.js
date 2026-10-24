require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const prisma = require("./prisma/prismaClient");
const AppError = require("./utils/AppError");
const errorHandler = require("./middleware/errorHandler");
const swaggerSpec = require("./docs/swagger");
const authRoutes = require("./routes/auth/authRoutes");
const employeeRoutes = require("./routes/employees/employeeRoutes");
const importRoutes = require("./routes/admin/import/importRoutes");
const branchMetricRoutes = require("./routes/admin/metrics/branchMetricRoutes");
const adminEmployeeRoutes = require("./routes/admin/employees/employeeAdminRoutes");
const userRoutes = require("./routes/admin/users/userRoutes");
const auditRoutes = require("./routes/admin/audit/auditRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Talabat KPI API is running" });
});

app.get("/health", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    next(new AppError("Database unavailable", 503, false));
  }
});

app.use("/auth", authRoutes);
app.use("/admin/import", importRoutes);
app.use("/admin/metrics/daily", branchMetricRoutes);
app.use("/admin/users", userRoutes);
app.use("/admin", adminEmployeeRoutes);
app.use("/admin/audit-logs", auditRoutes);
app.use("/employees", employeeRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});