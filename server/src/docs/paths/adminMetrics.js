"use strict";

module.exports = {
  "/admin/metrics/daily": {
    post: {
      tags: ["Admin - Metrics"],
      summary: "Create or update a daily branch metric",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["metricDate"],
              properties: {
                metricDate: {
                  type: "string",
                  format: "date",
                  example: "2026-10-16",
                },
                recordedAt: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-16T14:30:00.000Z",
                  nullable: true,
                },
                opsCR: { type: "number", nullable: true },
                dispatchTime: { type: "number", nullable: true },
                prepTime: { type: "number", nullable: true },
                assignmentTime: { type: "number", nullable: true },
                orderCount: {
                  type: "number",
                  nullable: true,
                  description: "Daily order count",
                },
                atVendorTime: {
                  type: "number",
                  nullable: true,
                  description: "Average time at vendor in minutes",
                },
                adjustTime: {
                  type: "number",
                  nullable: true,
                  description: "Adjustment time in minutes",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "New metric record created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BranchDailyMetric" },
            },
          },
        },
        200: {
          description: "Existing metric record updated (null field was filled)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BranchDailyMetric" },
            },
          },
        },
        400: { description: "Invalid data" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        409: {
          description:
            "Field(s) already have a value: <fieldName>. Use PATCH to update.",
        },
      },
    },
    get: {
      tags: ["Admin - Metrics"],
      summary: "List daily branch metrics",
      parameters: [
        {
          name: "from",
          in: "query",
          schema: { type: "string", format: "date" },
          example: "2026-10-16",
        },
        {
          name: "to",
          in: "query",
          schema: { type: "string", format: "date" },
          example: "2026-10-22",
        },
      ],
      responses: {
        200: {
          description: "List of metrics",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    metricDate: { type: "string", format: "date" },
                    recordedAt: {
                      type: "string",
                      format: "date-time",
                      nullable: true,
                    },
                    opsCR: { type: "number", nullable: true },
                    dispatchTime: { type: "number", nullable: true },
                    prepTime: { type: "number", nullable: true },
                    assignmentTime: { type: "number", nullable: true },
                    orderCount: { type: "number", nullable: true },
                    atVendorTime: { type: "number", nullable: true },
                    adjustTime: { type: "number", nullable: true },
                    createdById: { type: "string", format: "uuid" },
                    updatedById: {
                      type: "string",
                      format: "uuid",
                      nullable: true,
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
        400: {
          description:
            "Invalid from date (expected YYYY-MM-DD) or from date must not be after to date",
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
  "/admin/metrics/daily/best": {
    get: {
      tags: ["Admin - Metrics"],
      summary: "Get the best performing day based on overall branch KPI score",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Best performing day found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  data: {
                    type: "object",
                    properties: {
                      metricDate: { type: "string", example: "2026-10-16" },
                      recordedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                        example: "2026-10-16T14:30:00.000Z",
                      },
                      opsCR: { type: "number", example: 0.025, nullable: true },
                      dispatchTime: {
                        type: "number",
                        example: 4.5,
                        nullable: true,
                      },
                      assignmentTime: {
                        type: "number",
                        example: 0.15,
                        nullable: true,
                      },
                      prepTime: {
                        type: "number",
                        example: 1.8,
                        nullable: true,
                      },
                      orderCount: {
                        type: "number",
                        nullable: true,
                        description: "Daily order count",
                      },
                      atVendorTime: {
                        type: "number",
                        nullable: true,
                        description: "Average time at vendor in minutes",
                      },
                      adjustTime: {
                        type: "number",
                        nullable: true,
                        description: "Adjustment time in minutes",
                      },
                      score: {
                        type: "object",
                        properties: {
                          overall: { type: "number", example: 100 },
                          opsCR: { type: "number", example: 100 },
                          dispatchTime: { type: "number", example: 100 },
                          assignmentTime: { type: "number", example: 100 },
                          prepTime: { type: "number", example: 100 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        404: { description: "No branch metrics found" },
      },
    },
  },
  "/admin/metrics/daily/{date}": {
    get: {
      tags: ["Admin - Metrics"],
      summary: "Get metric by date",
      parameters: [
        {
          name: "date",
          in: "path",
          required: true,
          schema: { type: "string", format: "date" },
          example: "2026-10-16",
        },
      ],
      responses: {
        200: {
          description: "Metric found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  metricDate: { type: "string", format: "date" },
                  recordedAt: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                  },
                  opsCR: { type: "number", nullable: true },
                  dispatchTime: { type: "number", nullable: true },
                  prepTime: { type: "number", nullable: true },
                  assignmentTime: { type: "number", nullable: true },
                  orderCount: { type: "number", nullable: true },
                  atVendorTime: { type: "number", nullable: true },
                  adjustTime: { type: "number", nullable: true },
                  createdById: { type: "string", format: "uuid" },
                  updatedById: {
                    type: "string",
                    format: "uuid",
                    nullable: true,
                  },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        400: { description: "Invalid date format" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Metric not found" },
      },
    },
    patch: {
      tags: ["Admin - Metrics"],
      summary: "Update metric by date",
      parameters: [
        {
          name: "date",
          in: "path",
          required: true,
          schema: { type: "string", format: "date" },
          example: "2026-10-16",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                recordedAt: {
                  type: "string",
                  format: "date-time",
                  example: "2026-10-16T14:30:00.000Z",
                  nullable: true,
                },
                opsCR: { type: "number", nullable: true },
                dispatchTime: { type: "number", nullable: true },
                prepTime: { type: "number", nullable: true },
                assignmentTime: { type: "number", nullable: true },
                orderCount: {
                  type: "number",
                  nullable: true,
                  description: "Daily order count",
                },
                atVendorTime: {
                  type: "number",
                  nullable: true,
                  description: "Average time at vendor in minutes",
                },
                adjustTime: {
                  type: "number",
                  nullable: true,
                  description: "Adjustment time in minutes",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Metric updated" },
        400: { description: "Invalid data" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Metric not found" },
      },
    },
    delete: {
      tags: ["Admin - Metrics"],
      summary: "Delete metric by date",
      parameters: [
        {
          name: "date",
          in: "path",
          required: true,
          schema: { type: "string", format: "date" },
          example: "2026-10-16",
        },
      ],
      responses: {
        204: { description: "Metric deleted" },
        400: { description: "Invalid date format" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Metric not found" },
      },
    },
  },
};
