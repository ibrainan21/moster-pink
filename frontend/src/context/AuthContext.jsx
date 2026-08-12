import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";
import { getToken } from "../services/api";

/**
 * AuthContext
 * Fuente única de verdad de la sesión en todo el frontend: quién está
 * logueado (o null), y las acciones login/register/logout. Cualquier
 * componente puede leerlo con el hook useAuth() de abajo, en vez de que
 * cada página maneje su propio estado de usuario por separado.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" = todavía no sabemos si hay sesión válida o no (primer
  // render, antes de validar el token guardado contra el backend). Sirve
  // para no parpadear "no hay sesión" un instante antes de confirmarla.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    authService
      .me(controller.signal)
      .then((freshUser) => setUser(freshUser))
      .catch((err) => {
        // Si la petición se abortó (cleanup de este mismo efecto, p.ej. el
        // doble-montaje de StrictMode en desarrollo, o un cambio de ruta),
        // NO es un fallo de autenticación real: el token sigue siendo
        // válido y no hay que tocarlo. Solo cerramos sesión cuando /auth/me
        // de verdad respondió que el token es inválido/expiró.
        if (controller.signal.aborted || err?.name === "AbortError") return;

        // Token inválido o expirado: se descarta en silencio, el usuario
        // simplemente queda como visitante anónimo otra vez.
        authService.logout();
        setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const login = async (email, password) => {
    const loggedUser = await authService.login(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (data) => {
    const newUser = await authService.register(data);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth() debe usarse dentro de <AuthProvider>.");
  }
  return context;
}
