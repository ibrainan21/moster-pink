import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Envuelve cualquier <Route element={...}> que requiera sesión iniciada
 * (carrito, mi cuenta, checkout, etc.). Si no hay sesión, redirige a
 * /login y recuerda a dónde quería ir el usuario (state.from), para
 * regresarlo ahí después de loguearse.
 *
 * Uso:
 *   <Route path="/carrito" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
 */
function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Todavía no sabemos si hay sesión válida (validando el token contra el
  // backend) -> no decidir nada todavía, para no expulsar a alguien que sí
  // tiene sesión solo porque la respuesta aún no llegó.
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role_name)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
