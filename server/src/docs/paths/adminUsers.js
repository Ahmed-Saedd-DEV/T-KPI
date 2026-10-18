"use strict";

module.exports = {
  "/admin/users": {
    get: {
      tags: ["Admin - Users"],
      summary: "List all users",
      responses: {
        200: {
          description: "List of users",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
  "/admin/users/{id}": {
    get: {
      tags: ["Admin - Users"],
      summary: "Get user by ID",
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
          description: "User found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        400: { description: "Invalid user id" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "User not found" },
      },
    },
    patch: {
      tags: ["Admin - Users"],
      summary: "Update user",
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
                email: { type: "string", format: "email" },
                role: { type: "string", enum: ["ADMIN", "USER"] },
                isActive: { type: "boolean" },
                employeeId: { type: "string", format: "uuid", nullable: true },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        400: { description: "Invalid data" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "User not found" },
        409: { description: "Email already in use or employee already linked" },
      },
    },
    delete: {
      tags: ["Admin - Users"],
      summary: "Delete user",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        204: { description: "User deleted" },
        400: { description: "Invalid user id" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "User not found" },
      },
    },
  },
};
