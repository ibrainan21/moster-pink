import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

export const productIdParamValidation = [
  param("productId").isInt({ min: 1 }).withMessage("Id de producto inválido."),
];

export const listAllValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("rating").optional().isInt({ min: 1, max: 5 }).toInt(),
  query("isApproved").optional().isBoolean(),
  query("productId").optional().isInt({ min: 1 }),
];

export const createReviewValidation = [
  body("productId").isInt({ min: 1 }).withMessage("El producto es obligatorio."),
  body("orderId").isInt({ min: 1 }).withMessage("El pedido es obligatorio."),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("La calificación debe ser de 1 a 5."),
  body("comment").optional({ nullable: true }).isString(),
  body("photoUrl").optional({ nullable: true }).isString(),
];

export const setApprovedValidation = [
  ...idParamValidation,
  body("isApproved").isBoolean().withMessage("isApproved debe ser verdadero o falso."),
];
