//routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { registerValidator, loginValidator } = require("../utils/validators/authValidator");
const validatorMiddleware = require("../middleware/validatorMiddleware");


router.post("/register",              registerValidator,   authController.register);
router.post("/login",                 loginValidator,      authController.login);
router.get("/verify-email/:token",     authController.verifyEmail);
router.post("/logout",                 authController.logout);
router.post("/forgot-password",        authController.forgotPassword);
router.post("/reset-password/:token",  authController.resetPassword);
router.get("/protected",               authController.protected);

module.exports = router;