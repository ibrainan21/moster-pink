import api from "./api";

// Envuelve /api/reviews (ver backend: src/modules/reviews/review.routes.js).
const reviewService = {
  listByProduct: (productId, signal) => api.get(`/reviews/product/${productId}`, null, signal),
  listRecent: (limit = 6, signal) => api.get("/reviews/recent", { limit }, signal),

  // "Mis opiniones": todas las reseñas que el usuario autenticado ha escrito.
  listMine: (signal) => api.get("/reviews/mine", null, signal),

  // RF-036: publicar una opinión. Requiere productId + orderId (el backend
  // valida que el usuario haya comprado ese producto en ese pedido).
  create: ({ productId, orderId, rating, comment, photoUrl }) =>
    api.post("/reviews", { productId, orderId, rating, comment, photoUrl }),

  // Panel administrativo (Administrador/Empleado): todas las reseñas, con
  // filtros de aprobación/calificación/producto/búsqueda.
  listAll: (filters = {}, signal) => api.get("/reviews", filters, signal),

  // Moderación: solo Administrador puede aprobar/ocultar.
  setApproved: (id, isApproved) => api.patch(`/reviews/${id}/approval`, { isApproved }),

  // Eliminar: el dueño de la reseña, o Administrador.
  remove: (id) => api.delete(`/reviews/${id}`),
};

export default reviewService;
