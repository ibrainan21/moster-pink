import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

export const listValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["PENDING", "RECEIVED", "CANCELLED"]),
];

export const createPurchaseValidation = [
  body("supplierId").isInt({ min: 1 }).withMessage("El proveedor es obligatorio."),
  body("purchaseDate").optional().isISO8601().withMessage("Fecha inválida."),
  body("notes").optional({ nullable: true }).isString(),
  body("lines").isArray({ min: 1 }).withMessage("Agrega al menos un producto a la compra."),
  body("lines.*.warehouseId").isInt({ min: 1 }).withMessage("El almacén es obligatorio."),
  body("lines.*.variantId").isInt({ min: 1 }).withMessage("La variante es obligatoria."),
  body("lines.*.quantity").isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a 0."),
  body("lines.*.unitCost").isFloat({ min: 0 }).withMessage("El costo unitario debe ser positivo."),
  body("lines.*.discount").optional().isFloat({ min: 0 }),
];

export const addPaymentValidation = [
  ...idParamValidation,
  body("paymentDate").optional().isISO8601(),
  body("amount").isFloat({ gt: 0 }).withMessage("El monto debe ser mayor a 0."),
  body("paymentMethod")
    .isIn(["CASH", "CARD", "TRANSFER", "PAYPAL", "MERCADO_PAGO"])
    .withMessage("Método de pago inválido."),
  body("reference").optional({ nullable: true }).isString(),
  body("notes").optional({ nullable: true }).isString(),
];

export const createReturnValidation = [
  ...idParamValidation,
  body("reason").trim().notEmpty().withMessage("El motivo de la devolución es obligatorio."),
  body("lines").isArray({ min: 1 }).withMessage("Agrega al menos un producto a la devolución."),
  body("lines.*.warehouseId").isInt({ min: 1 }).withMessage("El almacén es obligatorio."),
  body("lines.*.variantId").isInt({ min: 1 }).withMessage("La variante es obligatoria."),
  body("lines.*.quantity").isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a 0."),
];
