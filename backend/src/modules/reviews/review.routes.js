import { Router } from "express";
import ReviewController from "./review.controller.js";
import {
  idParamValidation,
  productIdParamValidation,
  listAllValidation,
  createReviewValidation,
  setApprovedValidation,
} from "./review.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Lectura pública: cualquiera puede ver las opiniones de un producto.
router.get(
  "/product/:productId",
  productIdParamValidation,
  validate,
  ReviewController.listByProduct
);

// Lectura pública: reseñas recientes para el Home (testimonios reales).
router.get("/recent", ReviewController.listRecent);

// El resto requiere sesión iniciada.
router.use(verifyAuth);

// Panel administrativo: todas las reseñas (Administrador y Empleado pueden
// consultar; moderar/eliminar queda más restringido abajo).
router.get(
  "/",
  authorize("Administrador", "Empleado"),
  listAllValidation,
  validate,
  ReviewController.listAll
);

router.get("/mine", ReviewController.listMine);
router.post("/", createReviewValidation, validate, ReviewController.create);
router.delete("/:id", idParamValidation, validate, ReviewController.remove);

// Moderación: solo Administrador.
router.patch(
  "/:id/approval",
  authorize("Administrador"),
  setApprovedValidation,
  validate,
  ReviewController.setApproved
);

export default router;