import ApiError from "../../utils/ApiError.js";
import InventoryRepository from "./inventory.repository.js";
import WarehouseRepository from "./warehouse.repository.js";
import ProductRepository from "../products/product.repository.js";

class InventoryService {
  async list(query) {
    const { page = 1, limit = 20, warehouseId, productId, lowStockOnly, search } = query;
    return InventoryRepository.list({
      page,
      limit,
      warehouseId: warehouseId || null,
      productId: productId || null,
      lowStockOnly: lowStockOnly === "true" || lowStockOnly === true,
      search: search || null,
    });
  }

  async getById(id) {
    const inventory = await InventoryRepository.getById(id);
    if (!inventory) throw new ApiError(404, "Registro de inventario no encontrado.");
    return inventory;
  }

  async updateThresholds(id, data) {
    await this.getById(id);
    return InventoryRepository.updateThresholds(id, data);
  }

  async listMovements(query) {
    const {
      page = 1,
      limit = 20,
      inventoryId,
      warehouseId,
      variantId,
      movementType,
      dateFrom,
      dateTo,
    } = query;

    return InventoryRepository.listMovements({
      page,
      limit,
      inventoryId: inventoryId || null,
      warehouseId: warehouseId || null,
      variantId: variantId || null,
      movementTypeCode: movementType || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });
  }

  // RF-023: entrada/salida rápida sin pasar por compras/pedidos.
  async createAdjustment(data, actingUser) {
    const warehouse = await WarehouseRepository.getById(data.warehouseId);
    if (!warehouse) throw new ApiError(400, "El almacén especificado no existe.");

    const variant = await ProductRepository.getVariantById(data.variantId);
    if (!variant) throw new ApiError(400, "La variante especificada no existe.");

    let inventoryId;
    try {
      inventoryId = await InventoryRepository.createAdjustment({
        warehouseId: data.warehouseId,
        variantId: data.variantId,
        quantity: data.quantity,
        direction: data.direction,
        reason: data.reason,
        createdBy: actingUser.id,
      });
    } catch (err) {
      if (err.statusCode) throw new ApiError(err.statusCode, err.message);
      throw err;
    }

    return this.getById(inventoryId);
  }

  async listAlerts(query) {
    const { page = 1, limit = 20, resolved, warehouseId } = query;
    const parsedResolved =
      resolved === undefined || resolved === null || resolved === ""
        ? null
        : resolved === "true" || resolved === true;

    return InventoryRepository.listAlerts({
      page,
      limit,
      resolved: parsedResolved,
      warehouseId: warehouseId || null,
    });
  }

  async resolveAlert(id) {
    await InventoryRepository.resolveAlert(id);
  }

  async getSummary() {
    return InventoryRepository.getSummaryCounts();
  }
}

export default new InventoryService();
