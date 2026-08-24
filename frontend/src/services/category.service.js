import api from "./api";

// Envuelve las llamadas a /api/categories (ver backend:
// src/modules/categories/category.routes.js). La lectura es pública; todo
// lo que crea/edita/borra requiere sesión de Administrador (lo exige el
// backend con verifyAuth + authorize("Administrador"), aquí solo se llama).
const categoryService = {
  list: (onlyActive = true, signal) => api.get("/categories", { onlyActive }, signal),
  getById: (id, signal) => api.get(`/categories/${id}`, null, signal),
  getBySlug: (slug, signal) => api.get(`/categories/slug/${slug}`, null, signal),

  // Usado en el panel administrativo (formulario de producto) para el
  // selector de subcategoría dependiente de la categoría elegida.
  listSubcategories: (categoryId, onlyActive = true, signal) =>
    api.get(`/categories/${categoryId}/subcategories`, { onlyActive }, signal),

  // --- Administración: categorías (RF-014) ---
  create: (payload) => api.post("/categories", payload),
  update: (id, payload) => api.put(`/categories/${id}`, payload),
  setActive: (id, isActive) => api.patch(`/categories/${id}/status`, { isActive }),
  remove: (id) => api.delete(`/categories/${id}`),

  // --- Administración: subcategorías (RF-015) ---
  createSubcategory: (categoryId, payload) =>
    api.post(`/categories/${categoryId}/subcategories`, payload),
  updateSubcategory: (id, payload) => api.put(`/categories/subcategories/${id}`, payload),
  setSubcategoryActive: (id, isActive) =>
    api.patch(`/categories/subcategories/${id}/status`, { isActive }),
  removeSubcategory: (id) => api.delete(`/categories/subcategories/${id}`),
};

export default categoryService;
