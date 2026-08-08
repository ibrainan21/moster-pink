import { body, param } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

export const productIdParamValidation = [
  param("productId").isInt({ min: 1 }).withMessage("Id de producto inválido."),
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
