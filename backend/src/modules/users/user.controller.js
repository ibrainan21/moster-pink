import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import UserService from "./user.service.js";

class UserController {
  // GET /api/users  (RF-004, CU-027)
  list = asyncHandler(async (req, res) => {
    const result = await UserService.list(req.query);
    res.json(ApiResponse.success("Usuarios obtenidos correctamente.", result));
  });

  // GET /api/users/:id
  getOne = asyncHandler(async (req, res) => {
    const user = await UserService.getById(req.params.id);
    res.json(ApiResponse.success("Usuario obtenido correctamente.", user));
  });

  // PATCH /api/users/:id/status
  setActive = asyncHandler(async (req, res) => {
    const user = await UserService.setActive(req.params.id, req.body.isActive, req.user);
    const msg = req.body.isActive ? "Usuario activado." : "Usuario bloqueado.";
    res.json(ApiResponse.success(msg, user));
  });

  // PATCH /api/users/:id/role
  updateRole = asyncHandler(async (req, res) => {
    const user = await UserService.updateRole(req.params.id, req.body.role, req.user);
    res.json(ApiResponse.success("Rol actualizado correctamente.", user));
  });

  // PATCH /api/users/me
  updateMe = asyncHandler(async (req, res) => {
    const user = await UserService.updateProfile(req.user.id, req.body);
    res.json(ApiResponse.success("Perfil actualizado correctamente.", user));
  });
}

export default new UserController();
