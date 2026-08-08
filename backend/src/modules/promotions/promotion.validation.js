import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];
export const productIdParamValidation = [
  param("productId").isInt({ min: 1 }).withMessage("Id de producto inválido."),
];

export const listValidation = [query("onlyActive").optional().isBoolean()];

export const setActiveValidation = [
  ...idParamValidation,
  body("isActive").isBoolean().withMessage("isActive debe ser verdadero o falso."),
];

// --- Promociones ---

export const createPromotionValidation = [
  body("name").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("discountType").isIn(["PERCENTAGE", "FIXED_AMOUNT"]).withMessage("Tipo de descuento inválido."),
  body("discountValue").isFloat({ gt: 0 }).withMessage("El valor del descuento debe ser mayor a 0."),
  body("minimumPurchase").optional().isFloat({ min: 0 }),
  body("startDate").isISO8601().withMessage("Fecha de inicio inválida."),
  body("endDate").isISO8601().withMessage("Fecha de fin inválida."),
  body("productIds").optional().isArray(),
];

export const updatePromotionValidation = [...idParamValidation, ...createPromotionValidation];

// --- Temporadas ---

export const createSeasonValidation = [
  body("name").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("description").optional({ nullable: true }).isString(),
  body("bannerImage").optional({ nullable: true }).isString(),
  body("startDate").isISO8601().withMessage("Fecha de inicio inválida."),
  body("endDate").isISO8601().withMessage("Fecha de fin inválida."),
  body("productIds").optional().isArray(),
];

export const updateSeasonValidation = [...idParamValidation, ...createSeasonValidation];

export const addSeasonProductValidation = [
  ...idParamValidation,
  body("productId").isInt({ min: 1 }).withMessage("El producto es obligatorio."),
];

// --- Cupones ---

export const createCouponValidation = [
  body("code").trim().notEmpty().withMessage("El código del cupón es obligatorio."),
  body("discountType").isIn(["PERCENTAGE", "FIXED_AMOUNT"]).withMessage("Tipo de descuento inválido."),
  body("discountValue").isFloat({ gt: 0 }).withMessage("El valor del descuento debe ser mayor a 0."),
  body("minimumPurchase").optional().isFloat({ min: 0 }),
  body("usageLimit").optional({ nullable: true }).isInt({ min: 1 }),
  body("startDate").isISO8601().withMessage("Fecha de inicio inválida."),
  body("endDate").isISO8601().withMessage("Fecha de fin inválida."),
  body("description").optional({ nullable: true }).isString(),
];

export const validateCouponValidation = [
  body("code").trim().notEmpty().withMessage("El código del cupón es obligatorio."),
  body("cartTotal").isFloat({ min: 0 }).withMessage("El total del carrito es obligatorio."),
];
