import bcrypt from "bcrypt";
import crypto from "crypto";

import ApiError from "../../utils/ApiError.js";
import { signToken } from "../../utils/jwt.js";
import { sendPasswordResetEmail } from "../../utils/mailer.js";
import UserRepository from "../users/user.repository.js";
import UserService from "../users/user.service.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const RESET_CODE_TTL_MINUTES = 15;

class AuthService {
  // RF-001: registro de clientes.
  async register({ firstName, lastName, email, password, phone }) {
    const existing = await UserRepository.findByEmail(email);

    if (existing) {
      throw new ApiError(409, "Ya existe una cuenta registrada con este correo.");
    }

    const clientRole = await UserRepository.findRoleByName("Cliente");

    if (!clientRole) {
      throw new ApiError(500, "El rol Cliente no está configurado en el sistema.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await UserRepository.create({
      roleId: clientRole.id,
      firstName,
      lastName,
      email,
      passwordHash,
      phone,
    });

    return this.buildAuthResponse(user);
  }

  // RF-002: login para Cliente, Administrador o Empleado.
  async login({ email, password }) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(401, "Correo o contraseña incorrectos.");
    }

    if (!user.is_active) {
      throw new ApiError(403, "Tu cuenta está bloqueada. Contacta al administrador.");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new ApiError(401, "Correo o contraseña incorrectos.");
    }

    await UserRepository.updateLastLogin(user.id);

    return this.buildAuthResponse(user);
  }

  // RF-003
  async forgotPassword(email) {
    const user = await UserRepository.findByEmail(email);

    if (!user) return;

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);

    await UserRepository.createPasswordReset(user.id, code, expiresAt);
    await sendPasswordResetEmail(user.email, code);
  }

  // RF-003
  async resetPassword({ email, code, newPassword }) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(400, "Código inválido o expirado.");
    }

    const reset = await UserRepository.findValidPasswordReset(user.id, code);

    if (!reset) {
      throw new ApiError(400, "Código inválido o expirado.");
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await UserRepository.updatePassword(user.id, passwordHash);
    await UserRepository.markPasswordResetUsed(reset.id);
  }

  // Cambio de contraseña
  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "Usuario no encontrado.");
    }

    const matches = await bcrypt.compare(currentPassword, user.password);

    if (!matches) {
      throw new ApiError(400, "La contraseña actual no es correcta.");
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await UserRepository.updatePassword(userId, passwordHash);
  }

  async me(userId) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "Usuario no encontrado.");
    }

    return UserService.sanitize(user);
  }

  buildAuthResponse(user) {
    const token = signToken({
      id: user.id,
      role: user.role_name,
    });

    return {
      token,
      user: UserService.sanitize(user),
    };
  }
}

export default new AuthService();