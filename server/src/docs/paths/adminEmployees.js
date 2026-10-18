"use strict";

module.exports = {
  "/admin/employees": {
    post: {
      tags: ["Admin - Employees"],
      summary: "Create a new employee",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["employeeCode", "name"],
              properties: {
                employeeCode: { type: "string" },
                name: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Employee created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Employee" },
            },
          },
        },
        400: { description: "Invalid data" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        409: { description: "Employee code already exists" },
      },
    },
  },
  "/admin/employees/{id}": {
    patch: {
      tags: ["Admin - Employees"],
      summary: "Update an employee",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                employeeCode: { type: "string" },
                name: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Employee updated" },
        400: { description: "Invalid data" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Employee not found" },
        409: { description: "Employee code already exists" },
      },
    },
    delete: {
      tags: ["Admin - Employees"],
      summary: "Delete an employee",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        204: { description: "Employee deleted" },
        400: { description: "Invalid employee id" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Employee not found" },
      },
    },
  },
};
