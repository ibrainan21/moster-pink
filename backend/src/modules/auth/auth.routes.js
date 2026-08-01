import { Router } from "express";
import rateLimit from "express-rate-limit";

import AuthController from "./auth.controller.js";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from "./auth.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// RNF-010: protección contra fuerza bruta en login/recuperación.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
  },
});

router.post("/register", registerValidation, validate, AuthController.register);
router.post("/login", authLimiter, loginValidation, validate, AuthController.login);
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidation,
  validate,
  AuthController.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidation,
  validate,
  AuthController.resetPassword
);

router.get("/me", verifyAuth, AuthController.me);
router.post(
  "/change-password",
  verifyAuth,
  changePasswordValidation,
  validate,
  AuthController.changePassword
);

export default router;
