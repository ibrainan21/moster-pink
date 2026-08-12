import api from "./api";

// Envuelve /api/inventory (ver backend: src/modules/inventory/inventory.routes.js).
// Todo el módulo requiere sesión con rol Administrador o Empleado.
const inventoryService = {
  list: (filters = {}, signal) => api.get("/inventory", filters, signal),
  getById: (id, signal) => api.get(`/inventory/${id}`, null, signal),
  updateThresholds: (id, { minStock, maxStock }) =>
    api.patch(`/inventory/${id}/thresholds`, { minStock, maxStock }),

  listMovements: (filters = {}, signal) => api.get("/inventory/movements", filters, signal),

  listAlerts: (filters = {}, signal) => api.get("/inventory/alerts", filters, signal),
  resolveAlert: (id) => api.patch(`/inventory/alerts/${id}/resolve`),

  getSummary: (signal) => api.get("/inventory/summary", null, signal),

  // RF-023: ajuste rápido (entrada/salida) de inventario.
  createAdjustment: ({ warehouseId, variantId, quantity, direction, reason }) =>
    api.post("/inventory/adjustments", { warehouseId, variantId, quantity, direction, reason }),

  // --- Almacenes ---
  listWarehouses: (onlyActive, signal) =>
    api.get("/inventory/warehouses", onlyActive ? { onlyActive: true } : null, signal),
};

export default inventoryService;
