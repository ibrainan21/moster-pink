import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

// Seguimiento público (/seguimiento): número de pedido + correo, sin sesión.
export const trackValidation = [
  query("orderNumber").trim().notEmpty().withMessage("Ingresa el número de pedido."),
  query("email").trim().isEmail().withMessage("Ingresa un correo válido.").normalizeEmail(),
];

export const listValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status")
    .optional()
    .isIn(["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]),
];

export const checkoutValidation = [
  body("deliveryMethod").optional().isIn(["SHIPPING", "PICKUP"]).withMessage("Modalidad de entrega inválida."),
  body("addressId")
    .if(body("deliveryMethod").not().equals("PICKUP"))
    .notEmpty()
    .withMessage("La dirección de envío es obligatoria.")
    .bail()
    .isInt({ min: 1 }),
  body("notes").optional({ nullable: true }).isString(),
  body("couponCode").optional({ nullable: true }).isString(),
];

export const confirmPaymentValidation = [
  ...idParamValidation,
  body("amount").isFloat({ gt: 0 }).withMessage("El monto debe ser mayor a 0."),
  body("reference").optional({ nullable: true }).isString(),
  body("paymentMethod")
    .optional()
    .isIn(["CASH", "CARD", "TRANSFER", "PAYPAL", "MERCADO_PAGO"]),
];

export const updateStatusValidation = [
  ...idParamValidation,
  body("status")
    .isIn(["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .withMessage("Estado inválido."),
];

export const createShipmentValidation = [
  ...idParamValidation,
  body("carrier").optional({ nullable: true }).isString(),
  body("trackingNumber").optional({ nullable: true }).isString(),
];

export const updateShipmentValidation = [
  param("shipmentId").isInt({ min: 1 }).withMessage("Id de envío inválido."),
  body("status")
    .isIn(["PENDING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RETURNED"])
    .withMessage("Estado de envío inválido."),
];

export const createReturnValidation = [
  ...idParamValidation,
  body("reason").trim().notEmpty().withMessage("El motivo de la devolución es obligatorio."),
  body("lines").isArray({ min: 1 }).withMessage("Agrega al menos un producto a la devolución."),
  body("lines.*.warehouseId").isInt({ min: 1 }).withMessage("El almacén es obligatorio."),
  body("lines.*.variantId").isInt({ min: 1 }).withMessage("La variante es obligatoria."),
  body("lines.*.quantity").isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a 0."),
  body("lines.*.condition").isIn(["GOOD", "DAMAGED"]).withMessage("Condición inválida."),
];
