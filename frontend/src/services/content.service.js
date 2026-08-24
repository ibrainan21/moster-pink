import api from "./api";

// Envuelve /api/content (ver backend: src/modules/content/content.routes.js).
// La lectura es pública; crear/editar/eliminar/cambiar estado requiere
// sesión de Administrador (el backend lo exige con verifyAuth + authorize).
const contentService = {
  // --- Banners (RF-039 banner principal, RF-040 carrusel) ---
  listBanners: (type, signal) =>
    api.get("/content/banners", type ? { type, onlyActive: true } : { onlyActive: true }, signal),
  listAllBanners: (signal) => api.get("/content/banners", null, signal),
  createBanner: (data) => api.post("/content/banners", data),
  updateBanner: (id, data) => api.put(`/content/banners/${id}`, data),
  setBannerActive: (id, isActive) => api.patch(`/content/banners/${id}/status`, { isActive }),
  removeBanner: (id) => api.delete(`/content/banners/${id}`),

  // --- Galería (RF-041) ---
  listGallery: (signal) => api.get("/content/gallery", { onlyActive: true }, signal),
  listAllGallery: (signal) => api.get("/content/gallery", null, signal),
  createGalleryItem: (data) => api.post("/content/gallery", data),
  updateGalleryItem: (id, data) => api.put(`/content/gallery/${id}`, data),
  setGalleryItemActive: (id, isActive) =>
    api.patch(`/content/gallery/${id}/status`, { isActive }),
  removeGalleryItem: (id) => api.delete(`/content/gallery/${id}`),

  // --- Redes sociales (RF-042) ---
  listSocial: (signal) => api.get("/content/social", { onlyActive: true }, signal),
  listAllSocial: (signal) => api.get("/content/social", null, signal),
  createSocial: (data) => api.post("/content/social", data),
  updateSocial: (id, data) => api.put(`/content/social/${id}`, data),
  setSocialActive: (id, isActive) => api.patch(`/content/social/${id}/status`, { isActive }),
  removeSocial: (id) => api.delete(`/content/social/${id}`),

  // --- Información de la empresa (CU-023) ---
  getCompany: (signal) => api.get("/content/company", null, signal),
  saveCompany: (data) => api.put("/content/company", data),
};

export default contentService;
