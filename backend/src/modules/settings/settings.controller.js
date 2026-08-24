import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import SettingsService, { KNOWN_SETTINGS } from "./settings.service.js";

class SettingsController {
  // El "catálogo" (etiquetas, descripciones, tipos) también se manda al
  // frontend para no duplicar esos textos en el admin panel.
  listCatalog = asyncHandler(async (req, res) => {
    res.json(ApiResponse.success("Catálogo de configuraciones obtenido.", KNOWN_SETTINGS));
  });

  getAll = asyncHandler(async (req, res) => {
    const settings = await SettingsService.getAll();
    res.json(ApiResponse.success("Configuración obtenida correctamente.", settings));
  });

  // Pública (sin sesión): el carrito y el checkout la usan para estimar
  // envío e impuesto ANTES de que el cliente inicie sesión/pague. Solo
  // expone los 3 valores numéricos que de verdad necesita el frontend,
  // nunca el catálogo completo (ese sí es solo-Administrador).
  getShippingConfig = asyncHandler(async (req, res) => {
    const config = await SettingsService.getShippingAndTaxConfig();
    res.json(ApiResponse.success("Configuración de envío obtenida correctamente.", config));
  });

  update = asyncHandler(async (req, res) => {
    const settings = await SettingsService.update(req.body, req.user.id);
    res.json(ApiResponse.success("Configuración actualizada correctamente.", settings));
  });
}

export default new SettingsController();
