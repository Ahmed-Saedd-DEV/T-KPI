const express = require("express");
const authController = require("../../controllers/auth/authController");
const loginValidator = require("../../validators/auth/loginValidator");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", loginValidator, authController.login);
router.post("/logout", authController.logout);

module.exports = router;
