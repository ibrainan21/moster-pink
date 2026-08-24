import api from "./api";

// Envuelve /api/promotions (ver backend: src/modules/promotions/promotion.routes.js).
// Promociones y temporadas: lectura pública, escritura solo Administrador.
// Cupones: validar es público, listar es Administrador/Empleado, crear y
// cambiar estado es solo Administrador (el backend no expone editar ni
// borrar un cupón, solo crear y activar/desactivar).
const promotionService = {
  // --- Promociones (RF-038) ---
  listPromotions: (onlyActive = false, signal) =>
    api.get("/promotions", { onlyActive }, signal),
  getPromotion: (id, signal) => api.get(`/promotions/${id}`, null, signal),
  createPromotion: (data) => api.post("/promotions", data),
  updatePromotion: (id, data) => api.put(`/promotions/${id}`, data),
  setPromotionActive: (id, isActive) => api.patch(`/promotions/${id}/status`, { isActive }),
  removePromotion: (id) => api.delete(`/promotions/${id}`),

  // --- Temporadas (RF-011, RF-014) ---
  listSeasons: (onlyActive = true, signal) =>
    api.get("/promotions/seasons", { onlyActive }, signal),
  getSeason: (id, signal) => api.get(`/promotions/seasons/${id}`, null, signal),
  createSeason: (data) => api.post("/promotions/seasons", data),
  updateSeason: (id, data) => api.put(`/promotions/seasons/${id}`, data),
  setSeasonActive: (id, isActive) => api.patch(`/promotions/seasons/${id}/status`, { isActive }),
  removeSeason: (id) => api.delete(`/promotions/seasons/${id}`),
  addSeasonProduct: (id, productId) =>
    api.post(`/promotions/seasons/${id}/products`, { productId }),
  removeSeasonProduct: (id, productId) =>
    api.delete(`/promotions/seasons/${id}/products/${productId}`),

  // --- Cupones (RF-038, RN-035) ---
  listCoupons: (onlyActive = false, signal) =>
    api.get("/promotions/coupons", { onlyActive }, signal),
  createCoupon: (data) => api.post("/promotions/coupons", data),
  setCouponActive: (id, isActive) => api.patch(`/promotions/coupons/${id}/status`, { isActive }),

  // Valida un cupón contra el total del carrito/checkout SIN registrar su
  // uso todavía -> { coupon, discount }. El uso real se registra cuando se
  // crea el pedido (order.service.create ya manda couponCode).
  validateCoupon: (code, cartTotal) =>
    api.post("/promotions/coupons/validate", { code, cartTotal }),
};

export default promotionService;
