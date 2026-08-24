import api from "./api";

// Envuelve /api/dashboard (ver backend: src/modules/dashboard/dashboard.routes.js).
// Requiere sesión de Administrador o Empleado.
const dashboardService = {
  getOverview: (signal) => api.get("/dashboard/overview", null, signal),
};

export default dashboardService;
