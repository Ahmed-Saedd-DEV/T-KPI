"use strict";

const swaggerJsdoc = require("swagger-jsdoc");
const schemas = require("./schemas/index");
const authPaths = require("./paths/auth");
const employeesPaths = require("./paths/employees");
const adminEmployeesPaths = require("./paths/adminEmployees");
const adminImportPaths = require("./paths/adminImport");
const adminMetricsPaths = require("./paths/adminMetrics");
const adminUsersPaths = require("./paths/adminUsers");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Talabat KPI API",
      version: "1.0.0",
      description: "API documentation for the Talabat KPI Dashboard backend",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas,
    },
    security: [{ bearerAuth: [] }],
    paths: {
      ...authPaths,
      ...employeesPaths,
      ...adminEmployeesPaths,
      ...adminImportPaths,
      ...adminMetricsPaths,
      ...adminUsersPaths,
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
