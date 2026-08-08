import { Router } from "express";
import PurchaseController from "./purchase.controller.js";
import {
  idParamValidation,
  listValidation,
  createPurchaseValidation,
  addPaymentValidation,
  createReturnValidation,
} from "./purchase.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Compras es 100% interno (RF-025 a RF-028): Administrador y Empleado.
router.use(verifyAuth, authorize("Administrador", "Empleado"));

router.get("/", listValidation, validate, PurchaseController.list);
router.get("/:id", idParamValidation, validate, PurchaseController.getOne);
router.post("/", createPurchaseValidation, validate, PurchaseController.create);
router.patch("/:id/receive", idParamValidation, validate, PurchaseController.markReceived);
router.post("/:id/payments", addPaymentValidation, validate, PurchaseController.addPayment);
router.post("/:id/returns", createReturnValidation, validate, PurchaseController.createReturn);

// Cancelar una compra es una decisión más delicada: solo Administrador.
router.patch(
  "/:id/cancel",
  authorize("Administrador"),
  idParamValidation,
  validate,
  PurchaseController.cancel
);

export default router;
