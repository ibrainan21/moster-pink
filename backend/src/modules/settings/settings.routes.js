import { Router } from "express";
import { body } from "express-validator";
import SettingsController from "./settings.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Único endpoint público del módulo: valores numéricos para que el
// carrito/checkout puedan estimar envío e impuesto sin sesión iniciada
// (RF-030). Va ANTES del verifyAuth de abajo a propósito.
router.get("/shipping", SettingsController.getShippingConfig);

// El resto de Configuración es información sensible del negocio (costos,
// catálogo completo, correo de alertas) -- aquí solo entra Administrador,
// ni siquiera Empleado.
router.use(verifyAuth, authorize("Administrador"));

router.get("/catalog", SettingsController.listCatalog);
router.get("/", SettingsController.getAll);
router.put(
  "/",
  [
    body("shipping_cost").optional().isFloat({ min: 0 }),
    body("free_shipping_threshold").optional().isFloat({ min: 0 }),
    body("tax_rate").optional().isFloat({ min: 0, max: 100 }),
    body("low_stock_notify_email").optional({ nullable: true }).isString(),
  ],
  validate,
  SettingsController.update
);

export default router;
