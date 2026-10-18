"use strict";

module.exports = {
  "/admin/import/employees": {
    post: {
      tags: ["Admin - Import"],
      summary: "Import employees from Excel file",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Import completed" },
        400: { description: "Invalid file" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
  "/admin/import/batches": {
    get: {
      tags: ["Admin - Import"],
      summary: "List all import batches",
      responses: {
        200: {
          description: "List of import batches",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/ImportBatch" },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
  "/admin/import/batches/{id}": {
    delete: {
      tags: ["Admin - Import"],
      summary: "Delete an import batch and its performance records",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        204: { description: "Batch deleted" },
        400: { description: "Invalid batch id" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Batch not found" },
      },
    },
  },
};
