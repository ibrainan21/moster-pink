import { Router } from "express";
import CategoryController from "./category.controller.js";
import {
  idParamValidation,
  slugParamValidation,
  listValidation,
  createCategoryValidation,
  updateCategoryValidation,
  setActiveValidation,
  createSubcategoryValidation,
  updateSubcategoryValidation,
} from "./category.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// --- Lectura pública (catálogo de la tienda) ---
router.get("/", listValidation, validate, CategoryController.list);
router.get("/slug/:slug", slugParamValidation, validate, CategoryController.getBySlug);
router.get("/:id", idParamValidation, validate, CategoryController.getOne);
router.get(
  "/:categoryId/subcategories",
  listValidation,
  validate,
  CategoryController.listSubcategories
);

// --- Administración (RF-014, RF-015): solo Administrador ---
router.use(verifyAuth, authorize("Administrador"));

router.post("/", createCategoryValidation, validate, CategoryController.create);
router.put("/:id", updateCategoryValidation, validate, CategoryController.update);
router.patch("/:id/status", setActiveValidation, validate, CategoryController.setActive);
router.delete("/:id", idParamValidation, validate, CategoryController.remove);

router.post(
  "/:categoryId/subcategories",
  createSubcategoryValidation,
  validate,
  CategoryController.createSubcategory
);
router.put(
  "/subcategories/:id",
  updateSubcategoryValidation,
  validate,
  CategoryController.updateSubcategory
);
router.patch(
  "/subcategories/:id/status",
  setActiveValidation,
  validate,
  CategoryController.setSubcategoryActive
);
router.delete(
  "/subcategories/:id",
  idParamValidation,
  validate,
  CategoryController.removeSubcategory
);

export default router;
