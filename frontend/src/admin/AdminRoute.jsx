import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccessDenied from "./pages/AccessDenied/AccessDenied";

/**
 * AdminRoute
 * Envuelve todo /admin. A diferencia de <ProtectedRoute> (que redirige a "/"
 * cuando el rol no alcanza), aquí se pide explícitamente mostrar una
 * pantalla de "Acceso denegado" en vez de redirigir en silencio, porque el
 * panel administrativo es un caso donde el usuario sí necesita saber por
 * qué no puede entrar.
 */
function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Todavía no sabemos si hay sesión válida (validando el token contra el
  // backend) -> no decidir nada todavía.
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role_name !== "Administrador") {
    return <AccessDenied />;
  }

  return children;
}

export default AdminRoute;
