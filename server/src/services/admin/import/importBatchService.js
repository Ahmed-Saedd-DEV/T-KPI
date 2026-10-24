"use strict";

const importRepository = require("../../../repositories/importRepository");
const AppError = require("../../../utils/AppError");
const { createAuditLog } = require("../../../utils/audit/createAuditLog");
const { buildBatchFilter } = require("../../../utils/query/buildBatchFilter");

function isValidUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

async function getImportBatches(query = {}) {
  const { filter, options } = buildBatchFilter(query);
  const batches = await importRepository.findAllBatches(filter, options);

  return batches.map((batch) => ({
    id: batch.id,
    fileName: batch.fileName,
    status: batch.status,
    periodStart: batch.periodStart,
    periodEnd: batch.periodEnd,
    importedAt: batch.createdAt,
    uploadedBy: {
      id: batch.uploadedBy.id,
      email: batch.uploadedBy.email,
      role: batch.uploadedBy.role,
    },
  }));
}

async function deleteImportBatch(id, actor = null) {
  if (!isValidUuid(id)) {
    throw new AppError("Invalid batch id", 400, true);
  }

  const existingBatch = await importRepository.findBatchById(id);

  if (!existingBatch) {
    throw new AppError("Import batch not found", 404, true);
  }

  try {
    await importRepository.deleteBatch(id);

    await createAuditLog({
      action: "BATCH_DELETE",
      entityType: "ImportBatch",
      entityId: id,
      beforeData: existingBatch,
      afterData: null,
      actor,
    });

    return null;
  } catch (error) {
    if (error && error.code === "P2025") {
      throw new AppError("Import batch not found", 404, true);
    }

    throw error;
  }
}

module.exports = { getImportBatches, deleteImportBatch };
