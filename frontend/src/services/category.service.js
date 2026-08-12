import api from "./api";

// Envuelve las llamadas a /api/categories (ver backend:
// src/modules/categories/category.routes.js). La lectura es pública.
const categoryService = {
  list: (onlyActive = true, signal) => api.get("/categories", { onlyActive }, signal),
  getById: (id, signal) => api.get(`/categories/${id}`, null, signal),
  getBySlug: (slug, signal) => api.get(`/categories/slug/${slug}`, null, signal),

  // Usado en el panel administrativo (formulario de producto) para el
  // selector de subcategoría dependiente de la categoría elegida.
  listSubcategories: (categoryId, onlyActive = true, signal) =>
    api.get(`/categories/${categoryId}/subcategories`, { onlyActive }, signal),
};

export default categoryService;
