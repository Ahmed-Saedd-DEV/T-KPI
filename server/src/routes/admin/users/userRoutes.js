"use strict";

const express = require("express");
const auth = require("../../../middleware/auth/auth");
const authorize = require("../../../middleware/auth/authorize");
const userController = require("../../../controllers/admin/users/userController");

const router = express.Router();

router.get("/", auth, authorize("ADMIN"), userController.getUsers);
router.get("/:id", auth, authorize("ADMIN"), userController.getUserById);
router.patch("/:id", auth, authorize("ADMIN"), userController.updateUser);
router.delete("/:id", auth, authorize("ADMIN"), userController.deleteUser);

module.exports = router;
