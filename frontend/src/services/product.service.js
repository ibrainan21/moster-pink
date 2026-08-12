import api from "./api";

// Envuelve las llamadas a /api/products (ver backend:
// src/modules/products/product.routes.js). La lectura es pública.
const productService = {
  list: (filters = {}, signal) => api.get("/products", filters, signal),
  getBySlug: (slug, signal) => api.get(`/products/slug/${slug}`, null, signal),

  // Atajo para "Productos más vendidos" / destacados en el Home.
  // El backend no tiene todavía un endpoint de "más vendidos" real (eso
  // vendría de estadísticas de ventas, RF-043), así que por ahora usamos
  // is_featured como aproximación -> RF-009 "Producto destacado".
  listFeatured: (limit = 4, signal) =>
    api.get("/products", { isFeatured: true, limit }, signal),
};

export default productService;
