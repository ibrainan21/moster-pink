import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwt.js";
import UserRepository from "../modules/users/user.repository.js";

/**
 * verifyAuth
 * Exige un token JWT válido en el header Authorization: Bearer <token>.
 * Adjunta req.user = { id, roleId, roleName, email } (RF-048, RNF-007).
 */
export const verifyAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "No se proporcionó un token de autenticación.");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, "Token inválido o expirado. Inicia sesión de nuevo.");
  }

  const user = await UserRepository.findById(decoded.id);

  if (!user || !user.is_active || user.deleted_at) {
    throw new ApiError(401, "Tu cuenta ya no tiene acceso al sistema.");
  }

  req.user = {
    id: user.id,
    roleId: user.role_id,
    roleName: user.role_name,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
  };

  next();
});

/**
 * authorize(...roles)
 * Restringe el acceso a ciertos roles (RN-003: un usuario tiene un único
 * rol y sus permisos dependen exclusivamente de él).
 * Ejemplo: authorize("Administrador"), authorize("Administrador","Empleado")
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "No autenticado.");
  }

  if (!roles.includes(req.user.roleName)) {
    throw new ApiError(403, "No tienes permisos para realizar esta acción.");
  }

  next();
};

/**
 * optionalAuth
 * Igual que verifyAuth, pero no falla si no hay token. Útil para catálogo
 * público donde queremos saber si hay un cliente logueado (favoritos,
 * recomendaciones IA) sin exigirlo.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    const user = await UserRepository.findById(decoded.id);

    if (user && user.is_active && !user.deleted_at) {
      req.user = {
        id: user.id,
        roleId: user.role_id,
        roleName: user.role_name,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      };
    }
  } catch (err) {
    // Token inválido en un endpoint opcional: seguimos como visitante anónimo.
  }

  next();
});