"use strict";

module.exports = {
  Employee: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      employeeCode: { type: "string" },
      name: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  User: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["ADMIN", "USER"] },
      isActive: { type: "boolean" },
      employeeId: { type: "string", format: "uuid", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  AuthResponse: {
    type: "object",
    properties: {
      token: { type: "string" },
      user: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "USER"] },
        },
      },
    },
  },
  ImportBatch: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      fileName: { type: "string" },
      status: { type: "string", enum: ["PROCESSING", "COMPLETED", "FAILED"] },
      periodStart: { type: "string", format: "date-time" },
      periodEnd: { type: "string", format: "date-time" },
      importedAt: { type: "string", format: "date-time" },
      uploadedBy: { $ref: "#/components/schemas/User" },
    },
  },
  BranchDailyMetric: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      metricDate: { type: "string", format: "date-time" },
      opsCR: { type: "number" },
      dispatchTime: { type: "number" },
      prepTime: { type: "number" },
      assignmentTime: { type: "number" },
      createdById: { type: "string", format: "uuid" },
      updatedById: { type: "string", format: "uuid", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  KpiScores: {
    type: "object",
    properties: {
      opsCR: { type: "number", nullable: true },
      dispatchTime: { type: "number", nullable: true },
      pickingTime: { type: "number", nullable: true },
      assignmentTime: { type: "number", nullable: true },
      prepTime: { type: "number", nullable: true },
    },
  },
  EmployeeWithKpi: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      employeeCode: { type: "string" },
      name: { type: "string" },
      orders: { type: "integer", nullable: true },
      metrics: {
        type: "object",
        nullable: true,
        properties: {
          opsCR: { type: "number" },
          dispatchTime: { type: "number" },
          pickingTime: { type: "number" },
          assignmentTime: { type: "number" },
          prepTime: { type: "number" },
        },
      },
      kpi: {
        type: "object",
        nullable: true,
        properties: {
          scores: { $ref: "#/components/schemas/KpiScores" },
          overallScore: { type: "number", nullable: true },
        },
      },
    },
  },
  Error: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["fail", "error"] },
      message: { type: "string" },
    },
  },
};
