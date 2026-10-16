"use strict";
const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../../middleware/auth/auth");
const authorize = require("../../middleware/auth/authorize");
const importController = require("../../controllers/import/importController");
const importBatchController = require("../../controllers/import/importBatchController");
const importValidator = require("../../validators/admins/importValidator");
const batchDeleteValidator = require("../../validators/admins/batchDeleteValidator");

const upload = multer({
  dest: path.join(__dirname, "../../../uploads/"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.originalname.endsWith(".xlsx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx files are allowed"), false);
    }
  },
});

const router = express.Router();

router.post(
  "/employees",
  auth,
  authorize("ADMIN"),
  upload.single("file"),
  importValidator,
  importController.importEmployees,
);

router.get(
  "/batches",
  auth,
  authorize("ADMIN"),
  importBatchController.getImportBatches,
);

router.delete(
  "/batches/:id",
  auth,
  authorize("ADMIN"),
  batchDeleteValidator,
  importBatchController.deleteImportBatch,
);

module.exports = router;
