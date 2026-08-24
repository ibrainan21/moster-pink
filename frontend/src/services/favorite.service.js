import api from "./api";

// Envuelve /api/customers/favorites (ver backend:
// src/modules/customers/customer.routes.js). Todo requiere sesión iniciada.
const favoriteService = {
  list: (signal) => api.get("/customers/favorites", null, signal),

  add: (productId) => api.post("/customers/favorites", { productId }),

  remove: (productId) => api.delete(`/customers/favorites/${productId}`),
};

export default favoriteService;
