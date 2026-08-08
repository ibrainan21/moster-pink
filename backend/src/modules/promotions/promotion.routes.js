import { Router } from "express";
import PromotionController from "./promotion.controller.js";
import {
  idParamValidation,
  productIdParamValidation,
  listValidation,
  setActiveValidation,
  createPromotionValidation,
  updatePromotionValidation,
  createSeasonValidation,
  updateSeasonValidation,
  addSeasonProductValidation,
  createCouponValidation,
  validateCouponValidation,
} from "./promotion.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// IMPORTANTE: todas las rutas GET "literales" (/seasons, /coupons, ...)
// se registran ANTES que la genérica "/:id", igual que en Inventario —
// si no, "/coupons" se interpretaría como "id = coupons".

// --- Lectura pública (tienda en línea) ---
router.get("/seasons", listValidation, validate, PromotionController.listSeasons);
router.get("/seasons/:id", idParamValidation, validate, PromotionController.getSeason);
router.post("/coupons/validate", validateCouponValidation, validate, PromotionController.validateCoupon);

// --- Lectura de cupones: interna (Administrador y Empleado) ---
router.get(
  "/coupons",
  verifyAuth,
  authorize("Administrador", "Empleado"),
  listValidation,
  validate,
  PromotionController.listCoupons
);

// --- Lectura pública de promociones (rutas genéricas al final) ---
router.get("/", listValidation, validate, PromotionController.listPromotions);
router.get("/:id", idParamValidation, validate, PromotionController.getPromotion);

// --- Todo lo que crea/modifica/elimina: solo Administrador ---
router.use(verifyAuth, authorize("Administrador"));

router.post("/", createPromotionValidation, validate, PromotionController.createPromotion);
router.put("/:id", updatePromotionValidation, validate, PromotionController.updatePromotion);
router.patch("/:id/status", setActiveValidation, validate, PromotionController.setPromotionActive);
router.delete("/:id", idParamValidation, validate, PromotionController.removePromotion);

router.post("/seasons", createSeasonValidation, validate, PromotionController.createSeason);
router.put("/seasons/:id", updateSeasonValidation, validate, PromotionController.updateSeason);
router.patch(
  "/seasons/:id/status",
  setActiveValidation,
  validate,
  PromotionController.setSeasonActive
);
router.delete("/seasons/:id", idParamValidation, validate, PromotionController.removeSeason);
router.post(
  "/seasons/:id/products",
  addSeasonProductValidation,
  validate,
  PromotionController.addSeasonProduct
);
router.delete(
  "/seasons/:id/products/:productId",
  productIdParamValidation,
  validate,
  PromotionController.removeSeasonProduct
);

router.post("/coupons", createCouponValidation, validate, PromotionController.createCoupon);
router.patch(
  "/coupons/:id/status",
  setActiveValidation,
  validate,
  PromotionController.setCouponActive
);

export default router;
