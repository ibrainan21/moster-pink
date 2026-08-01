import { Router } from "express";
import UserController from "./user.controller.js";
import {
  listUsersValidation,
  userIdParamValidation,
  setActiveValidation,
  updateRoleValidation,
  updateProfileValidation,
} from "./user.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Cualquier usuario autenticado puede editar su propio perfil.
router.patch("/me", verifyAuth, updateProfileValidation, validate, UserController.updateMe);

// El resto (RF-004) es exclusivo del Administrador.
router.use(verifyAuth, authorize("Administrador"));

router.get("/", listUsersValidation, validate, UserController.list);
router.get("/:id", userIdParamValidation, validate, UserController.getOne);
router.patch("/:id/status", setActiveValidation, validate, UserController.setActive);
router.patch("/:id/role", updateRoleValidation, validate, UserController.updateRole);

export default router;
