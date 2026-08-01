import { Router } from "express";
import ProductController from "./product.controller.js";
import {
  idParamValidation,
  slugParamValidation,
  listValidation,
  createProductValidation,
  updateProductValidation,
  updateStatusValidation,
  createVariantValidation,
  updateVariantValidation,
  setActiveValidation,
} from "./product.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

// --- Lectura pública (tienda en línea, CU-004 / CU-005) ---
router.get("/", listValidation, validate, ProductController.list);
router.get("/slug/:slug", slugParamValidation, validate, ProductController.getBySlug);
router.get("/:id", idParamValidation, validate, ProductController.getOne);
router.get("/:productId/variants", ProductController.listVariants);

// --- Administración: Administrador y Empleado pueden consultar,
//     pero solo Administrador crea/edita/elimina (RF-006 a RF-014) ---
router.use(verifyAuth, authorize("Administrador", "Empleado"));

router.get("/:id/price-history", idParamValidation, validate, ProductController.priceHistory);

router.use(authorize("Administrador"));

router.post("/", createProductValidation, validate, ProductController.create);
router.put("/:id", updateProductValidation, validate, ProductController.update);
router.patch("/:id/status", updateStatusValidation, validate, ProductController.updateStatus);
router.delete("/:id", idParamValidation, validate, ProductController.remove);

router.post("/:id/images", upload.single("image"), ProductController.uploadImage);
router.delete("/:id/images/:imageId", ProductController.removeImage);

router.post("/:productId/variants", createVariantValidation, validate, ProductController.addVariant);
router.put("/variants/:id", updateVariantValidation, validate, ProductController.updateVariant);
router.patch(
  "/variants/:id/status",
  setActiveValidation,
  validate,
  ProductController.setVariantActive
);

export default router;
