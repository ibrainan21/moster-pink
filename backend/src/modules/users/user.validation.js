import { body, param, query } from "express-validator";

export const listUsersValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("role").optional().isIn(["Administrador", "Empleado", "Cliente"]),
];

export const userIdParamValidation = [
  param("id").isInt({ min: 1 }).withMessage("Id de usuario inválido."),
];

export const setActiveValidation = [
  ...userIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive debe ser verdadero o falso."),
];

export const updateRoleValidation = [
  ...userIdParamValidation,
  body("role")
    .isIn(["Administrador", "Empleado", "Cliente"])
    .withMessage("Rol inválido."),
];

export const updateProfileValidation = [
  body("firstName").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("lastName").trim().notEmpty().withMessage("El apellido es obligatorio."),
  body("phone").optional({ nullable: true }).isString(),
];
