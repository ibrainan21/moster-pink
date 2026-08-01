import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AuthService from "./auth.service.js";

class AuthController {
  // POST /api/auth/register  (RF-001, CU-001)
  register = asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    res.status(201).json(ApiResponse.success("Cuenta creada correctamente.", result));
  });

  // POST /api/auth/login  (RF-002, CU-002 / CU-011)
  login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    res.json(ApiResponse.success("Inicio de sesión exitoso.", result));
  });

  // POST /api/auth/forgot-password  (RF-003, CU-003)
  forgotPassword = asyncHandler(async (req, res) => {
    await AuthService.forgotPassword(req.body.email);
    res.json(
      ApiResponse.success(
        "Si el correo está registrado, se envió un código de recuperación."
      )
    );
  });

  // POST /api/auth/reset-password  (RF-003)
  resetPassword = asyncHandler(async (req, res) => {
    await AuthService.resetPassword(req.body);
    res.json(ApiResponse.success("Contraseña actualizada correctamente."));
  });

  // POST /api/auth/change-password
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(ApiResponse.success("Contraseña actualizada correctamente."));
  });

  // GET /api/auth/me
  me = asyncHandler(async (req, res) => {
    const user = await AuthService.me(req.user.id);
    res.json(ApiResponse.success("Sesión activa.", user));
  });
}

export default new AuthController();
