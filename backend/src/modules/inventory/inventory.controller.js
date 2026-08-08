import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import WarehouseService from "./warehouse.service.js";
import InventoryService from "./inventory.service.js";
import RestockService from "./restock.service.js";

class InventoryController {
  // --- Almacenes ---

  listWarehouses = asyncHandler(async (req, res) => {
    const warehouses = await WarehouseService.list(req.query.onlyActive === "true");
    res.json(ApiResponse.success("Almacenes obtenidos correctamente.", warehouses));
  });

  getWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await WarehouseService.getById(req.params.id);
    res.json(ApiResponse.success("Almacén obtenido correctamente.", warehouse));
  });

  createWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await WarehouseService.create(req.body);
    res.status(201).json(ApiResponse.success("Almacén creado correctamente.", warehouse));
  });

  updateWarehouse = asyncHandler(async (req, res) => {
    const warehouse = await WarehouseService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Almacén actualizado correctamente.", warehouse));
  });

  setWarehouseActive = asyncHandler(async (req, res) => {
    const warehouse = await WarehouseService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado del almacén actualizado.", warehouse));
  });

  removeWarehouse = asyncHandler(async (req, res) => {
    await WarehouseService.remove(req.params.id);
    res.json(ApiResponse.success("Almacén eliminado correctamente."));
  });

  // --- Inventario (RF-017, RF-019 a RF-023) ---

  listInventory = asyncHandler(async (req, res) => {
    const result = await InventoryService.list(req.query);
    res.json(ApiResponse.success("Inventario obtenido correctamente.", result));
  });

  getInventory = asyncHandler(async (req, res) => {
    const inventory = await InventoryService.getById(req.params.id);
    res.json(ApiResponse.success("Registro de inventario obtenido correctamente.", inventory));
  });

  updateThresholds = asyncHandler(async (req, res) => {
    const inventory = await InventoryService.updateThresholds(req.params.id, req.body);
    res.json(ApiResponse.success("Stock mínimo/máximo actualizado.", inventory));
  });

  listMovements = asyncHandler(async (req, res) => {
    const result = await InventoryService.listMovements(req.query);
    res.json(ApiResponse.success("Movimientos obtenidos correctamente.", result));
  });

  // RF-023: ajuste rápido de inventario.
  createAdjustment = asyncHandler(async (req, res) => {
    const inventory = await InventoryService.createAdjustment(req.body, req.user);
    res.status(201).json(ApiResponse.success("Ajuste de inventario registrado correctamente.", inventory));
  });

  // --- Alertas (RF-021, RF-022) ---

  listAlerts = asyncHandler(async (req, res) => {
    const result = await InventoryService.listAlerts(req.query);
    res.json(ApiResponse.success("Alertas obtenidas correctamente.", result));
  });

  resolveAlert = asyncHandler(async (req, res) => {
    await InventoryService.resolveAlert(req.params.id);
    res.json(ApiResponse.success("Alerta marcada como resuelta."));
  });

  getSummary = asyncHandler(async (req, res) => {
    const summary = await InventoryService.getSummary();
    res.json(ApiResponse.success("Resumen de inventario obtenido correctamente.", summary));
  });

  // --- Lista para surtir (RF-024) ---

  listRestockLists = asyncHandler(async (req, res) => {
    const lists = await RestockService.list(req.query.status || null);
    res.json(ApiResponse.success("Listas para surtir obtenidas correctamente.", lists));
  });

  getRestockList = asyncHandler(async (req, res) => {
    const list = await RestockService.getById(req.params.id);
    res.json(ApiResponse.success("Lista para surtir obtenida correctamente.", list));
  });

  createRestockList = asyncHandler(async (req, res) => {
    const list = await RestockService.create(req.body, req.user);
    res.status(201).json(ApiResponse.success("Lista para surtir creada correctamente.", list));
  });

  addRestockItem = asyncHandler(async (req, res) => {
    const item = await RestockService.addItem(req.params.id, req.body);
    res.status(201).json(ApiResponse.success("Producto agregado a la lista.", item));
  });

  removeRestockItem = asyncHandler(async (req, res) => {
    await RestockService.removeItem(req.params.id, req.params.itemId);
    res.json(ApiResponse.success("Producto eliminado de la lista."));
  });

  updateRestockStatus = asyncHandler(async (req, res) => {
    const list = await RestockService.updateStatus(req.params.id, req.body.status);
    res.json(ApiResponse.success("Estado de la lista actualizado.", list));
  });
}

export default new InventoryController();
