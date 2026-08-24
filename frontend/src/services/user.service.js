import api from "./api";

// Envuelve /api/users (ver backend: src/modules/users/user.routes.js).
// list/getById/setActive/updateRole son exclusivos de Administrador (RF-004).
// No existen endpoints de creación ni borrado: los usuarios se registran
// solos vía /auth/register, y por RN-004 nunca se eliminan físicamente,
// solo se bloquean (setActive).
const userService = {
  list: (filters = {}, signal) => api.get("/users", filters, signal),
  getById: (id, signal) => api.get(`/users/${id}`, null, signal),
  setActive: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),

  // Cualquier usuario autenticado puede editar su propio perfil.
  updateMe: (data) => api.patch("/users/me", data),
};

export default userService;
