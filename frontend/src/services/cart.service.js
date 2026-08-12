import api from "./api";

// Envuelve /api/cart (ver backend: src/modules/cart/cart.routes.js).
// Todo el módulo requiere sesión iniciada (verifyAuth) — no existe
// carrito de invitado en el backend, así que estas llamadas solo se deben
// hacer cuando isAuthenticated es true (ver CartContext).
const cartService = {
  get: (signal) => api.get("/cart", null, signal),

  // El carrito se agrega por variantId, no por productId (ver cart.service.js
  // del backend): cada producto necesita al menos una variante creada.
  addItem: (variantId, quantity = 1) => api.post("/cart/items", { variantId, quantity }),

  updateQuantity: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),

  clear: () => api.delete("/cart"),
};

export default cartService;
