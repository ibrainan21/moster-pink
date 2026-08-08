import { body } from "express-validator";

// RF-045: persona, edad, presupuesto, ocasión.
export const recommendValidation = [
  body("persona").optional({ nullable: true }).isString(),
  body("age").optional({ nullable: true }).isInt({ min: 0, max: 120 }),
  body("budget").isFloat({ gt: 0 }).withMessage("El presupuesto debe ser mayor a 0."),
  body("occasion").optional({ nullable: true }).isString(),
  body("categoryId").optional({ nullable: true }).isInt({ min: 1 }),
  body("sessionToken").optional({ nullable: true }).isString(),
];

export const logViewValidation = [
  body("productId").isInt({ min: 1 }).withMessage("El producto es obligatorio."),
  body("sessionToken").optional({ nullable: true }).isString(),
  body("durationSeconds").optional().isInt({ min: 0 }),
];

export const logSearchValidation = [
  body("query").trim().notEmpty().withMessage("La búsqueda no puede estar vacía."),
  body("sessionToken").optional({ nullable: true }).isString(),
  body("resultsCount").optional().isInt({ min: 0 }),
];
