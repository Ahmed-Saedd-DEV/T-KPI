const express = require("express");
const auth = require("../../middleware/auth/auth");
const authController = require("../../controllers/auth/authController");
const loginValidator = require("../../validators/auth/loginValidator");
const registerValidator = require("../../validators/auth/registerValidator");

const router = express.Router();

router.post("/register", registerValidator, authController.register);
router.post("/login", loginValidator, authController.login);
router.get("/me", auth, authController.getMe);

module.exports = router;
