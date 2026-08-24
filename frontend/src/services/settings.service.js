import api from "./api";

// Envuelve /api/settings (ver backend: src/modules/settings/settings.routes.js).
// Todo requiere sesión de Administrador.
const settingsService = {
  getCatalog: (signal) => api.get("/settings/catalog", null, signal),
  getAll: (signal) => api.get("/settings", null, signal),
  update: (values) => api.put("/settings", values),

  // Pública -- no requiere sesión de Administrador. La usan /carrito y
  // /checkout para estimar envío e impuesto (RF-030).
  getShippingConfig: (signal) => api.get("/settings/shipping", null, signal),
};

export default settingsService;
