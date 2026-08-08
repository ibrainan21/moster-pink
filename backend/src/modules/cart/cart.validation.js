import { body, param } from "express-validator";

export const itemIdParamValidation = [
  param("itemId").isInt({ min: 1 }).withMessage("Id de producto en carrito inválido."),
];

export const addItemValidation = [
  body("variantId").isInt({ min: 1 }).withMessage("La variante es obligatoria."),
  body("quantity").optional().isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a 0."),
];

export const updateQuantityValidation = [
  ...itemIdParamValidation,
  body("quantity").isInt({ min: 0 }).withMessage("La cantidad debe ser 0 o mayor."),
];
