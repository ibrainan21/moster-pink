import { body, param } from "express-validator";

export const addressIdParamValidation = [
  param("addressId").isInt({ min: 1 }).withMessage("Id de dirección inválido."),
];

export const productIdParamValidation = [
  param("productId").isInt({ min: 1 }).withMessage("Id de producto inválido."),
];

export const createAddressValidation = [
  body("recipientName").trim().notEmpty().withMessage("El nombre del destinatario es obligatorio."),
  body("street").trim().notEmpty().withMessage("La calle es obligatoria."),
  body("phone").optional({ nullable: true }).isString(),
  body("exteriorNumber").optional({ nullable: true }).isString(),
  body("interiorNumber").optional({ nullable: true }).isString(),
  body("neighborhood").optional({ nullable: true }).isString(),
  body("city").optional({ nullable: true }).isString(),
  body("state").optional({ nullable: true }).isString(),
  body("postalCode").optional({ nullable: true }).isString(),
  body("country").optional({ nullable: true }).isString(),
  body("isDefault").optional().isBoolean(),
  body("alias").optional({ nullable: true }).isString(),
];

export const updateAddressValidation = [...addressIdParamValidation, ...createAddressValidation];

export const addFavoriteValidation = [
  body("productId").isInt({ min: 1 }).withMessage("El producto es obligatorio."),
];
