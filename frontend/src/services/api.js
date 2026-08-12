// Cliente base para hablar con el backend.
//
// En desarrollo usamos rutas relativas ("/api/...") porque vite.config.js
// tiene un proxy que las reenvía a http://localhost:3000 (ver ese archivo
// para la explicación completa). En producción, si el frontend y el
// backend NO viven en el mismo dominio, se define VITE_API_URL en un
// archivo .env.production (ver .env.example) y aquí se usa esa URL
// completa en su lugar.
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const TOKEN_KEY = "moster_pink_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Error tipado para que los componentes puedan mostrar el mensaje real del
// backend (y, cuando aplica, los detalles de validación campo por campo)
// en vez de un "algo salió mal" genérico.
export class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

/**
 * request
 * Wrapper de fetch que:
 *  - arma la URL contra BASE_URL
 *  - manda el JWT si existe (Authorization: Bearer ...)
 *  - serializa/parsea JSON automáticamente
 *  - lanza ApiClientError cuando success:false, con el mensaje real del
 *    backend (ApiResponse/ApiError ya trae { success, message, details })
 */
async function request(path, { method = "GET", body, params, signal } = {}) {
  let url = `${BASE_URL}${path}`;

  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (query) url += `?${query}`;
  }

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  // 204 No Content u otras respuestas sin body.
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok || (data && data.success === false)) {
    throw new ApiClientError(
      data?.message || `Error ${response.status}`,
      response.status,
      data?.details
    );
  }

  return data?.data;
}

const api = {
  get: (path, params, signal) => request(path, { method: "GET", params, signal }),
  post: (path, body, signal) => request(path, { method: "POST", body, signal }),
  put: (path, body, signal) => request(path, { method: "PUT", body, signal }),
  patch: (path, body, signal) => request(path, { method: "PATCH", body, signal }),
  delete: (path, signal) => request(path, { method: "DELETE", signal }),
};

export default api;
