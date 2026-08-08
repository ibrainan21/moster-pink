import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

// --- Almacenes ---

export const createWarehouseValidation = [
  body("name").trim().notEmpty().withMessage("El nombre del almacén es obligatorio."),
  body("code").trim().notEmpty().withMessage("El código del almacén es obligatorio."),
  body("address").optional({ nullable: true }).isString(),
];

export const updateWarehouseValidation = [...idParamValidation, ...createWarehouseValidation];

export const setActiveValidation = [
  ...idParamValidation,
  body("isActive").isBoolean().withMessage("isActive debe ser verdadero o falso."),
];

// --- Inventario ---

export const listInventoryValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("warehouseId").optional().isInt({ min: 1 }),
  query("productId").optional().isInt({ min: 1 }),
];

export const updateThresholdsValidation = [
  ...idParamValidation,
  body("minStock").isInt({ min: 0 }).withMessage("El stock mínimo debe ser un entero positivo."),
  body("maxStock").optional({ nullable: true }).isInt({ min: 0 }),
];

export const listMovementsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("movementType").optional().isString(),
];

// RF-023: ajuste rápido de inventario.
export const createAdjustmentValidation = [
  body("warehouseId").isInt({ min: 1 }).withMessage("El almacén es obligatorio."),
  body("variantId").isInt({ min: 1 }).withMessage("La variante es obligatoria."),
  body("quantity").isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a 0."),
  body("direction").isIn(["IN", "OUT"]).withMessage("La dirección debe ser IN o OUT."),
  body("reason").trim().notEmpty().withMessage("El motivo del ajuste es obligatorio."),
];

// --- Alertas ---

export const listAlertsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("resolved").optional().isBoolean(),
];

// --- Lista para surtir (RF-024) ---

export const createRestockListValidation = [
  body("name").optional({ nullable: true }).isString(),
];

export const addRestockItemValidation = [
  ...idParamValidation,
  body("variantId").isInt({ min: 1 }).withMessage("La variante es obligatoria."),
  body("requestedQuantity").isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a 0."),
  body("notes").optional({ nullable: true }).isString(),
];

export const updateRestockStatusValidation = [
  ...idParamValidation,
  body("status").isIn(["OPEN", "ORDERED", "CLOSED"]).withMessage("Estado inválido."),
];
