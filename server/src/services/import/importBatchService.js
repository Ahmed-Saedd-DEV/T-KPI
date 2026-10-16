"use strict";

const prisma = require("../../prisma/prismaClient");
const AppError = require("../../utils/AppError");

function isValidUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

async function getImportBatches() {
  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

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

  const existingBatch = await prisma.importBatch.findUnique({
    where: { id },
  });

  if (!existingBatch) {
    throw new AppError("Import batch not found", 404, true);
  }

  const actorSnapshot =
    actor && typeof actor === "object"
      ? {
          id: actor.id || null,
          email: actor.email || null,
          role: actor.role || null,
        }
      : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.importBatch.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          action: "BATCH_DELETE",
          entityType: "ImportBatch",
          entityId: id,
          beforeData: existingBatch,
          actorUserId: actor && actor.id ? actor.id : null,
          actorSnapshot,
        },
      });
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
