import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];
export const slugParamValidation = [param("slug").trim().notEmpty()];

export const listValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["ACTIVE", "INACTIVE", "DISCONTINUED"]),
];

export const createProductValidation = [
  body("categoryId").isInt({ min: 1 }).withMessage("La categoría es obligatoria."),
  body("subcategoryId").optional({ nullable: true }).isInt({ min: 1 }),
  body("supplierId").optional({ nullable: true }).isInt({ min: 1 }),
  body("name").trim().notEmpty().withMessage("El nombre es obligatorio."),
  body("cost").isFloat({ min: 0 }).withMessage("El costo debe ser un número positivo."),
  body("price").isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo."),
  body("sku").optional({ nullable: true }).isString(),
  body("shortDescription").optional({ nullable: true }).isString(),
  body("description").optional({ nullable: true }).isString(),
  body("isFeatured").optional().isBoolean(),
  body("isNew").optional().isBoolean(),
  body("newUntil").optional({ nullable: true }).isISO8601(),
  body("publishedAt").optional({ nullable: true }).isISO8601(),
  body("unpublishAt").optional({ nullable: true }).isISO8601(),
  body("tagIds").optional().isArray(),
  body("relatedProductIds").optional().isArray(),
];

export const updateProductValidation = [...idParamValidation, ...createProductValidation];

export const updateStatusValidation = [
  ...idParamValidation,
  body("status").isIn(["ACTIVE", "INACTIVE", "DISCONTINUED"]).withMessage("Estado inválido."),
];

export const createVariantValidation = [
  param("productId").isInt({ min: 1 }).withMessage("Id de producto inválido."),
  body("sku").trim().notEmpty().withMessage("El SKU de la variante es obligatorio."),
  body("color").optional({ nullable: true }).isString(),
  body("size").optional({ nullable: true }).isString(),
  body("material").optional({ nullable: true }).isString(),
  body("capacity").optional({ nullable: true }).isString(),
  body("additionalPrice").optional().isFloat({ min: 0 }),
];

export const updateVariantValidation = [
  ...idParamValidation,
  body("color").optional({ nullable: true }).isString(),
  body("size").optional({ nullable: true }).isString(),
  body("material").optional({ nullable: true }).isString(),
  body("capacity").optional({ nullable: true }).isString(),
  body("additionalPrice").optional().isFloat({ min: 0 }),
];

export const setActiveValidation = [
  ...idParamValidation,
  body("isActive").isBoolean().withMessage("isActive debe ser verdadero o falso."),
];
