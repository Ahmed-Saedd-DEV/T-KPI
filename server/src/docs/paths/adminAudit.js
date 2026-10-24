"use strict";

module.exports = {
  "/admin/audit-logs": {
    get: {
      tags: ["Admin - Audit"],
      summary: "Get audit logs",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "entityType",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["Employee", "ImportBatch", "BranchDailyMetric", "User"],
          },
        },
        {
          name: "action",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["CREATE", "UPDATE", "DELETE", "IMPORT", "BATCH_DELETE"],
          },
        },
        {
          name: "from",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
      ],
      responses: {
        200: {
          description: "Audit logs retrieved successfully",
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
                        id: { type: "string", format: "uuid" },
                        action: {
                          type: "string",
                          enum: [
                            "CREATE",
                            "UPDATE",
                            "DELETE",
                            "IMPORT",
                            "BATCH_DELETE",
                          ],
                        },
                        entityType: { type: "string", example: "Employee" },
                        entityId: { type: "string", format: "uuid" },
                        beforeData: { nullable: true },
                        afterData: {
                          type: "object",
                          properties: {
                            employeeCode: { type: "string", example: "40011" },
                            name: { type: "string", example: "Ahmed" },
                          },
                          nullable: true,
                        },
                        actorUserId: {
                          type: "string",
                          format: "uuid",
                          nullable: true,
                        },
                        actorSnapshot: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            email: {
                              type: "string",
                              example: "admin@example.com",
                            },
                            role: { type: "string", example: "ADMIN" },
                          },
                          nullable: true,
                        },
                        actorUser: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            email: {
                              type: "string",
                              example: "admin@example.com",
                            },
                            role: { type: "string", example: "ADMIN" },
                          },
                          nullable: true,
                        },
                        createdAt: {
                          type: "string",
                          format: "date-time",
                          example: "2026-10-23T10:00:00.000Z",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description:
            "Invalid entityType value / Invalid action value / Invalid from date / Invalid to date / from date must not be after to date / Invalid limit value",
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
};
