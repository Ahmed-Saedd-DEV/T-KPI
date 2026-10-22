"use strict";

const importBatchService = require("../../../services/admin/import/importBatchService");

async function getImportBatches(req, res, next) {
  try {
    const batches = await importBatchService.getImportBatches();
    res.status(200).json(batches);
  } catch (error) {
    next(error);
  }
}

async function deleteImportBatch(req, res, next) {
  try {
    await importBatchService.deleteImportBatch(req.params.id, req.user);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { getImportBatches, deleteImportBatch };
