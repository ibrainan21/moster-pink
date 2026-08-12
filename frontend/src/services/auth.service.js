import api, { setToken, clearToken } from "./api";

// Envuelve /api/auth (ver backend: src/modules/auth/auth.routes.js).
const authService = {
  async register(data) {
    const result = await api.post("/auth/register", data);
    setToken(result.token);
    return result.user;
  },

  async login(email, password) {
    const result = await api.post("/auth/login", { email, password });
    setToken(result.token);
    return result.user;
  },

  logout() {
    clearToken();
  },

  // Valida el token guardado y trae los datos frescos del usuario.
  me(signal) {
    return api.get("/auth/me", null, signal);
  },

  forgotPassword(email) {
    return api.post("/auth/forgot-password", { email });
  },

  resetPassword(email, code, newPassword) {
    return api.post("/auth/reset-password", { email, code, newPassword });
  },

  changePassword(currentPassword, newPassword) {
    return api.post("/auth/change-password", { currentPassword, newPassword });
  },
};

export default authService;
