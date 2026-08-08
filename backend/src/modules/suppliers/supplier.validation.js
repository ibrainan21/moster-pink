import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

export const listValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createSupplierValidation = [
  body("name").trim().notEmpty().withMessage("El nombre del proveedor es obligatorio."),
  body("contactName").optional({ nullable: true }).isString(),
  body("phone").optional({ nullable: true }).isString(),
  body("email").optional({ nullable: true }).isEmail().withMessage("Correo inválido."),
  body("address").optional({ nullable: true }).isString(),
  body("notes").optional({ nullable: true }).isString(),
];

export const updateSupplierValidation = [...idParamValidation, ...createSupplierValidation];

export const setActiveValidation = [
  ...idParamValidation,
  body("isActive").isBoolean().withMessage("isActive debe ser verdadero o falso."),
];
