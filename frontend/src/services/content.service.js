import api from "./api";

// Envuelve /api/content (ver backend: src/modules/content/content.routes.js).
// Toda la lectura es pública.
const contentService = {
  listBanners: (type, signal) => api.get("/content/banners", { type, onlyActive: true }, signal),
  listGallery: (signal) => api.get("/content/gallery", { onlyActive: true }, signal),
  listSocial: (signal) => api.get("/content/social", { onlyActive: true }, signal),
  getCompany: (signal) => api.get("/content/company", null, signal),
};

export default contentService;
