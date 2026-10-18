"use strict";

module.exports = {
  "/employees": {
    get: {
      tags: ["Employees"],
      summary: "List all employees with latest KPI scores",
      parameters: [
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Search by name or employee code",
        },
        {
          name: "minScore",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "maxScore",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "minOpsCR",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "maxOpsCR",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "minDispatchTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "maxDispatchTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "minPickingTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "maxPickingTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "minAssignmentTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "maxAssignmentTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "minPrepTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
        {
          name: "maxPrepTime",
          in: "query",
          schema: { type: "number", minimum: 0, maximum: 100 },
        },
      ],
      responses: {
        200: {
          description: "List of employees",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/EmployeeWithKpi" },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/employees/top": {
    get: {
      tags: ["Employees"],
      summary: "Get top 3 employees by KPI score",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Top 3 employees ranked by KPI score",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "integer", example: 1 },
                        employeeId: {
                          type: "string",
                          format: "uuid",
                          example: "550e8400-e29b-41d4-a716-446655440000",
                        },
                        employeeCode: { type: "string", example: "40011" },
                        name: { type: "string", example: "Ahmed Ramadan" },
                        overallScore: { type: "number", example: 100 },
                        scores: {
                          type: "object",
                          properties: {
                            opsCR: { type: "number", example: 100 },
                            dispatchTime: { type: "number", example: 100 },
                            pickingTime: { type: "number", example: 100 },
                            assignmentTime: { type: "number", example: 100 },
                            prepTime: { type: "number", example: 100 },
                          },
                        },
                        lastPeriod: { type: "string", example: "2026-10-15" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/employees/top": {
    get: {
      tags: ["Employees"],
      summary: "Get top 3 employees by KPI score",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Top 3 employees ranked by KPI score",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "integer", example: 1 },
                        employeeId: {
                          type: "string",
                          format: "uuid",
                          example: "550e8400-e29b-41d4-a716-446655440000",
                        },
                        employeeCode: { type: "string", example: "40011" },
                        name: { type: "string", example: "Ahmed Ramadan" },
                        overallScore: { type: "number", example: 100 },
                        scores: {
                          type: "object",
                          properties: {
                            opsCR: { type: "number", example: 100 },
                            dispatchTime: { type: "number", example: 100 },
                            pickingTime: { type: "number", example: 100 },
                            assignmentTime: { type: "number", example: 100 },
                            prepTime: { type: "number", example: 100 },
                          },
                        },
                        lastPeriod: { type: "string", example: "2026-10-15" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/employees/{id}": {
    get: {
      tags: ["Employees"],
      summary: "Get employee by ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: {
          description: "Employee found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Employee" },
            },
          },
        },
        400: { description: "Invalid employee id" },
        404: { description: "Employee not found" },
      },
    },
  },
  "/employees/code/{employeeCode}": {
    get: {
      tags: ["Employees"],
      summary: "Get employee by code",
      parameters: [
        {
          name: "employeeCode",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Employee found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Employee" },
            },
          },
        },
        404: { description: "Employee not found" },
      },
    },
  },
  "/employees/{id}/performance": {
    get: {
      tags: ["Employees"],
      summary: "Get employee performance history with KPI scores",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Employee performance history" },
        400: { description: "Invalid employee id" },
        404: { description: "Employee not found" },
      },
    },
  },
};
