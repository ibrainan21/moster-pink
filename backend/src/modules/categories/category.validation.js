import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

export const slugParamValidation = [param("slug").trim().notEmpty()];

export const listValidation = [
  query("onlyActive").optional().isBoolean().toBoolean(),
];

export const createCategoryValidation = [
  body("name").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("description").optional({ nullable: true }).isString(),
  body("imageUrl").optional({ nullable: true }).isString(),
  body("sortOrder").optional().isInt().toInt(),
];

export const updateCategoryValidation = [...idParamValidation, ...createCategoryValidation];

export const setActiveValidation = [
  ...idParamValidation,
  body("isActive").isBoolean().withMessage("isActive debe ser verdadero o falso."),
];

export const createSubcategoryValidation = [
  param("categoryId").isInt({ min: 1 }).withMessage("Id de categoría inválido."),
  body("name").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("description").optional({ nullable: true }).isString(),
];

export const updateSubcategoryValidation = [
  ...idParamValidation,
  body("name").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("description").optional({ nullable: true }).isString(),
];
