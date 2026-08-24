import api from "./api";

// Envuelve /api/orders (ver backend: src/modules/orders/order.routes.js).
// list/getById los usan tanto el cliente ("mis pedidos") como el admin — el
// propio backend filtra por rol (Cliente ve solo lo suyo). Los métodos de
// abajo (confirmPayment, updateStatus, envíos) están restringidos por el
// backend a Administrador/Empleado.
const orderService = {
  // Seguimiento público (/seguimiento, sin sesión iniciada). Requiere
  // folio + correo juntos (ver backend: order.repository.js).
  track: ({ orderNumber, email }, signal) =>
    api.get("/orders/track", { orderNumber, email }, signal),

  // RF-030, CU-007: checkout del carrito actual del usuario autenticado.
  // addressId es opcional (customer_addresses.id puede ser NULL en orders),
  // pero en la práctica el checkout siempre debería mandar una dirección
  // de envío real.
  checkout: ({ addressId, notes, couponCode } = {}) =>
    api.post("/orders/checkout", { addressId, notes, couponCode }),

  getById: (id, signal) => api.get(`/orders/${id}`, null, signal),

  list: (filters = {}, signal) => api.get("/orders", filters, signal),

  // --- Administración (Administrador/Empleado) ---

  confirmPayment: (id, { amount, reference, paymentMethod } = {}) =>
    api.post(`/orders/${id}/confirm-payment`, { amount, reference, paymentMethod }),

  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),

  createShipment: (id, { carrier, trackingNumber } = {}) =>
    api.post(`/orders/${id}/shipment`, { carrier, trackingNumber }),

  updateShipmentStatus: (shipmentId, status) =>
    api.patch(`/orders/shipments/${shipmentId}`, { status }),
};

export default orderService;
