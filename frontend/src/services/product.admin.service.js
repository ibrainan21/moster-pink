import api, { getToken } from "./api";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Envuelve las llamadas ADMINISTRATIVAS de /api/products (crear, editar,
// variantes, imágenes) — separado de product.service.js a propósito, para
// no arriesgar el catálogo público al tocar este archivo.
const productAdminService = {
  // Reutiliza el mismo GET /api/products que el catálogo público, pero
  // aquí se usa con filtros de administración (status, search, etc.) y
  // requiere sesión con rol Administrador/Empleado según el backend.
  list: (filters = {}, signal) => api.get("/products", filters, signal),

  // GET /api/products/:id (a diferencia de getBySlug, este trae el
  // producto sin filtrar por status: activo, inactivo o descontinuado).
  getById: (id, signal) => api.get(`/products/${id}`, null, signal),

  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateStatus: (id, status) => api.patch(`/products/${id}/status`, { status }),
  remove: (id) => api.delete(`/products/${id}`),

  priceHistory: (id, signal) => api.get(`/products/${id}/price-history`, null, signal),

  // --- Imágenes: multipart/form-data, no pasa por el wrapper JSON de api.js ---
  async uploadImage(productId, file, { variantId, isMain } = {}) {
    const formData = new FormData();
    formData.append("image", file);
    if (variantId) formData.append("variantId", variantId);
    if (isMain) formData.append("isMain", "true");

    const token = getToken();
    const response = await fetch(`${BASE_URL}/products/${productId}/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Error ${response.status}`);
    }
    return data.data;
  },

  removeImage: (productId, imageId) => api.delete(`/products/${productId}/images/${imageId}`),

  // --- Variantes ---
  listVariants: (productId, signal) => api.get(`/products/${productId}/variants`, null, signal),
  addVariant: (productId, data) => api.post(`/products/${productId}/variants`, data),
  updateVariant: (variantId, data) => api.put(`/products/variants/${variantId}`, data),
  setVariantActive: (variantId, isActive) =>
    api.patch(`/products/variants/${variantId}/status`, { isActive }),
};

export default productAdminService;
