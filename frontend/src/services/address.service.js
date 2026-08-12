import api from "./api";

// Envuelve /api/customers/addresses (ver backend:
// src/modules/customers/customer.routes.js). Todo requiere sesión iniciada.
const addressService = {
  list: (signal) => api.get("/customers/addresses", null, signal),

  create: (data) => api.post("/customers/addresses", data),

  update: (addressId, data) => api.put(`/customers/addresses/${addressId}`, data),

  setDefault: (addressId) => api.patch(`/customers/addresses/${addressId}/default`),

  remove: (addressId) => api.delete(`/customers/addresses/${addressId}`),
};

export default addressService;
