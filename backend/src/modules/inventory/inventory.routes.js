import { Router } from "express";
import InventoryController from "./inventory.controller.js";
import {
  idParamValidation,
  createWarehouseValidation,
  updateWarehouseValidation,
  setActiveValidation,
  listInventoryValidation,
  updateThresholdsValidation,
  listMovementsValidation,
  createAdjustmentValidation,
  listAlertsValidation,
  createRestockListValidation,
  addRestockItemValidation,
  updateRestockStatusValidation,
} from "./inventory.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// IMPORTANTE: todas las rutas "literales" (/summary, /warehouses,
// /movements, /alerts, /restock-lists, /adjustments) deben registrarse
// ANTES que "/:id", porque Express prueba las rutas en el orden en que
// se registran y "/:id" hace match con cualquier segmento, incluyendo
// "restock-lists" o "movements" si esas rutas quedaran más abajo.

// Todo el módulo de inventario es interno (RF-017 a RF-024).
router.use(verifyAuth, authorize("Administrador", "Empleado"));

// --- Resumen para dashboard ---
router.get("/summary", InventoryController.getSummary);

// --- Almacenes ---
router.get("/warehouses", InventoryController.listWarehouses);
router.get("/warehouses/:id", idParamValidation, validate, InventoryController.getWarehouse);

// --- Movimientos y alertas (rutas literales, antes de "/:id") ---
router.get("/movements", listMovementsValidation, validate, InventoryController.listMovements);
router.get("/alerts", listAlertsValidation, validate, InventoryController.listAlerts);
router.patch("/alerts/:id/resolve", idParamValidation, validate, InventoryController.resolveAlert);

// RF-023: ajuste rápido de inventario.
router.post("/adjustments", createAdjustmentValidation, validate, InventoryController.createAdjustment);

// --- Lista para surtir (RF-024) ---
router.get("/restock-lists", InventoryController.listRestockLists);
router.get("/restock-lists/:id", idParamValidation, validate, InventoryController.getRestockList);
router.post(
  "/restock-lists",
  createRestockListValidation,
  validate,
  InventoryController.createRestockList
);
router.post(
  "/restock-lists/:id/items",
  addRestockItemValidation,
  validate,
  InventoryController.addRestockItem
);
router.delete("/restock-lists/:id/items/:itemId", InventoryController.removeRestockItem);
router.patch(
  "/restock-lists/:id/status",
  updateRestockStatusValidation,
  validate,
  InventoryController.updateRestockStatus
);

// --- Inventario general (lectura) ---
router.get("/", listInventoryValidation, validate, InventoryController.listInventory);
router.get("/:id", idParamValidation, validate, InventoryController.getInventory);

// --- Administración de almacenes y umbrales: solo Administrador ---
router.use(authorize("Administrador"));

router.post("/warehouses", createWarehouseValidation, validate, InventoryController.createWarehouse);
router.put("/warehouses/:id", updateWarehouseValidation, validate, InventoryController.updateWarehouse);
router.patch(
  "/warehouses/:id/status",
  setActiveValidation,
  validate,
  InventoryController.setWarehouseActive
);
router.delete("/warehouses/:id", idParamValidation, validate, InventoryController.removeWarehouse);
router.patch(
  "/:id/thresholds",
  updateThresholdsValidation,
  validate,
  InventoryController.updateThresholds
);

export default router;
