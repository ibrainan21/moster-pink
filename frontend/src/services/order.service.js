import api from "./api";

// Envuelve /api/orders (ver backend: src/modules/orders/order.routes.js).
const orderService = {
  // RF-030, CU-007: checkout del carrito actual del usuario autenticado.
  // addressId es opcional (customer_addresses.id puede ser NULL en orders),
  // pero en la práctica el checkout siempre debería mandar una dirección
  // de envío real.
  checkout: ({ addressId, notes, couponCode } = {}) =>
    api.post("/orders/checkout", { addressId, notes, couponCode }),

  getById: (id, signal) => api.get(`/orders/${id}`, null, signal),

  list: (filters = {}, signal) => api.get("/orders", filters, signal),
};

export default orderService;
