import ApiError from "../../utils/ApiError.js";
import UserRepository from "./user.repository.js";

class UserService {
  // RF-004: consultar usuarios (con filtros de rol / estado / búsqueda).
  async list(query) {
    const { page = 1, limit = 20, role = null, isActive = null, search = null } = query;

    const parsedIsActive =
      isActive === undefined || isActive === null || isActive === ""
        ? null
        : isActive === "true" || isActive === "1";

    return UserRepository.list({
      page,
      limit,
      roleName: role || null,
      isActive: parsedIsActive,
      search: search || null,
    });
  }

  async getById(id) {
    const user = await UserRepository.findById(id);
    if (!user) throw new ApiError(404, "Usuario no encontrado.");
    return this.sanitize(user);
  }

  // RF-004: bloquear / activar usuarios.
  async setActive(id, isActive, actingUser) {
    if (Number(id) === actingUser.id && !isActive) {
      throw new ApiError(400, "No puedes desactivar tu propia cuenta.");
    }

    const user = await UserRepository.findById(id);
    if (!user) throw new ApiError(404, "Usuario no encontrado.");

    const updated = await UserRepository.setActive(id, isActive);
    return this.sanitize(updated);
  }

  // RF-004: cambiar roles.
  async updateRole(id, roleName, actingUser) {
    if (Number(id) === actingUser.id) {
      throw new ApiError(400, "No puedes cambiar tu propio rol.");
    }

    const user = await UserRepository.findById(id);
    if (!user) throw new ApiError(404, "Usuario no encontrado.");

    const role = await UserRepository.findRoleByName(roleName);
    if (!role) throw new ApiError(400, "El rol especificado no existe.");

    const updated = await UserRepository.updateRole(id, role.id);
    return this.sanitize(updated);
  }

  async updateProfile(id, data) {
    const updated = await UserRepository.updateProfile(id, data);
    return this.sanitize(updated);
  }

  // Nunca devolvemos el hash de la contraseña al cliente.
  sanitize(user) {
    if (!user) return user;
    const { password, ...safe } = user;
    return safe;
  }
}

export default new UserService();
