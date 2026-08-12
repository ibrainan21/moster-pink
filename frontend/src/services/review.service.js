import api from "./api";

// Envuelve /api/reviews (ver backend: src/modules/reviews/review.routes.js).
const reviewService = {
  listByProduct: (productId, signal) => api.get(`/reviews/product/${productId}`, null, signal),
  listRecent: (limit = 6, signal) => api.get("/reviews/recent", { limit }, signal),
};

export default reviewService;
