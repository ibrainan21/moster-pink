import { Router } from "express";
import OrderController from "./order.controller.js";
import {
  idParamValidation,
  listValidation,
  checkoutValidation,
  confirmPaymentValidation,
  updateStatusValidation,
  createShipmentValidation,
  updateShipmentValidation,
  createReturnValidation,
} from "./order.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Todo el módulo requiere sesión iniciada. El filtrado de "solo mis
// pedidos" para el rol Cliente vive en el service (list / getByIdForUser).
router.use(verifyAuth);

router.get("/", listValidation, validate, OrderController.list);
router.get("/:id", idParamValidation, validate, OrderController.getOne);

// RF-030, CU-007: cualquier usuario autenticado (típicamente Cliente) puede
// hacer checkout de su propio carrito.
router.post("/checkout", checkoutValidation, validate, OrderController.checkout);

// RF-034: el cliente puede solicitar devolución de su propio pedido; el
// service valida la propiedad cuando el rol es Cliente.
router.post("/:id/returns", createReturnValidation, validate, OrderController.createReturn);

// --- Operación interna: confirmar pago, cambiar estado, envíos ---
router.use(authorize("Administrador", "Empleado"));

router.post(
  "/:id/confirm-payment",
  confirmPaymentValidation,
  validate,
  OrderController.confirmPayment
);
router.patch("/:id/status", updateStatusValidation, validate, OrderController.updateStatus);
router.post("/:id/shipment", createShipmentValidation, validate, OrderController.createShipment);
router.patch(
  "/shipments/:shipmentId",
  updateShipmentValidation,
  validate,
  OrderController.updateShipmentStatus
);

export default router;
