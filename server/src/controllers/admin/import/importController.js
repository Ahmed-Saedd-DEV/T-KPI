"use strict";
const importService = require("../../../services/admin/import/importService");
const fs = require("fs");

async function importEmployees(req, res, next) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "fail", message: "No file uploaded" });
    }
    const result = await importService.importEmployeesFromExcel(
      req.file.path,
      req.file.originalname,
      req.user.id,
      req.user,
    );
    fs.unlink(req.file.path, () => {});
    res.status(200).json(result);
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
}

module.exports = { importEmployees };
