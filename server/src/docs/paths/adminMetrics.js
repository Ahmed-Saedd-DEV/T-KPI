"use strict";

module.exports = {
  "/admin/metrics/daily": {
    post: {
      tags: ["Admin - Metrics"],
      summary: "Create a daily branch metric",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "metricDate",
                "opsCR",
                "dispatchTime",
                "prepTime",
                "assignmentTime",
              ],
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
                },
                opsCR: { type: "number" },
                dispatchTime: { type: "number" },
                prepTime: { type: "number" },
                assignmentTime: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Metric created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BranchDailyMetric" },
            },
          },
        },
        400: { description: "Invalid data" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        409: { description: "Metric already exists for this date" },
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
          example: "2026-10-01",
        },
        {
          name: "to",
          in: "query",
          schema: { type: "string", format: "date" },
          example: "2026-10-31",
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
                  allOf: [
                    { $ref: "#/components/schemas/BranchDailyMetric" },
                    {
                      type: "object",
                      properties: {
                        recordedAt: {
                          type: "string",
                          format: "date-time",
                          nullable: true,
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
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
                      opsCR: { type: "number", example: 0.025 },
                      dispatchTime: { type: "number", example: 4.5 },
                      assignmentTime: { type: "number", example: 0.15 },
                      prepTime: { type: "number", example: 1.8 },
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
                allOf: [
                  { $ref: "#/components/schemas/BranchDailyMetric" },
                  {
                    type: "object",
                    properties: {
                      recordedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                      },
                    },
                  },
                ],
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
                },
                opsCR: { type: "number" },
                dispatchTime: { type: "number" },
                prepTime: { type: "number" },
                assignmentTime: { type: "number" },
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
