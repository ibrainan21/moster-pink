import api from "./api";

// Envuelve /api/promotions (ver backend: src/modules/promotions/promotion.routes.js).
const promotionService = {
  listSeasons: (onlyActive = true, signal) =>
    api.get("/promotions/seasons", { onlyActive }, signal),
};

export default promotionService;
