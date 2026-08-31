import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import BannerService from "./banner.service.js";
import GalleryService from "./gallery.service.js";
import SocialService from "./social.service.js";
import CompanyService from "./company.service.js";
import { uploadBufferToCloudinary } from "../../utils/cloudinaryUpload.js";

class ContentController {
  // POST /api/content/upload-image (multipart/form-data, campo "image").
  // Endpoint genérico de subida a Cloudinary: lo usan Categorías, Banners,
  // Galería y "Conócenos" cuando el admin sube un archivo en vez de pegar
  // una URL. Reutiliza el mismo middleware/uploader que ya usan los
  // productos (backend/src/middlewares/upload.middleware.js).
  uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "No se recibió ninguna imagen.");
    const result = await uploadBufferToCloudinary(req.file.buffer, "moster-pink/content");
    res.status(201).json(ApiResponse.success("Imagen subida correctamente.", { imageUrl: result.secure_url }));
  });

  // --- Banners (RF-039, RF-040) ---

  listBanners = asyncHandler(async (req, res) => {
    const banners = await BannerService.list(req.query);
    res.json(ApiResponse.success("Banners obtenidos correctamente.", banners));
  });

  createBanner = asyncHandler(async (req, res) => {
    const banner = await BannerService.create(req.body);
    res.status(201).json(ApiResponse.success("Banner creado correctamente.", banner));
  });

  updateBanner = asyncHandler(async (req, res) => {
    const banner = await BannerService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Banner actualizado correctamente.", banner));
  });

  setBannerActive = asyncHandler(async (req, res) => {
    const banner = await BannerService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado del banner actualizado.", banner));
  });

  removeBanner = asyncHandler(async (req, res) => {
    await BannerService.remove(req.params.id);
    res.json(ApiResponse.success("Banner eliminado correctamente."));
  });

  // --- Galería (RF-041) ---

  listGallery = asyncHandler(async (req, res) => {
    const items = await GalleryService.list(req.query);
    res.json(ApiResponse.success("Galería obtenida correctamente.", items));
  });

  createGalleryItem = asyncHandler(async (req, res) => {
    const item = await GalleryService.create(req.body);
    res.status(201).json(ApiResponse.success("Imagen agregada a la galería.", item));
  });

  updateGalleryItem = asyncHandler(async (req, res) => {
    const item = await GalleryService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Imagen de galería actualizada.", item));
  });

  setGalleryItemActive = asyncHandler(async (req, res) => {
    const item = await GalleryService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado de la imagen actualizado.", item));
  });

  removeGalleryItem = asyncHandler(async (req, res) => {
    await GalleryService.remove(req.params.id);
    res.json(ApiResponse.success("Imagen eliminada de la galería."));
  });

  // --- Redes sociales (RF-042) ---

  listSocial = asyncHandler(async (req, res) => {
    const links = await SocialService.list(req.query.onlyActive === "true");
    res.json(ApiResponse.success("Redes sociales obtenidas correctamente.", links));
  });

  createSocial = asyncHandler(async (req, res) => {
    const link = await SocialService.create(req.body);
    res.status(201).json(ApiResponse.success("Red social agregada correctamente.", link));
  });

  updateSocial = asyncHandler(async (req, res) => {
    const link = await SocialService.update(req.params.id, req.body);
    res.json(ApiResponse.success("Red social actualizada correctamente.", link));
  });

  setSocialActive = asyncHandler(async (req, res) => {
    const link = await SocialService.setActive(req.params.id, req.body.isActive);
    res.json(ApiResponse.success("Estado de la red social actualizado.", link));
  });

  removeSocial = asyncHandler(async (req, res) => {
    await SocialService.remove(req.params.id);
    res.json(ApiResponse.success("Red social eliminada correctamente."));
  });

  // --- Información de la empresa (CU-023) ---

  getCompany = asyncHandler(async (req, res) => {
    const company = await CompanyService.get();
    res.json(ApiResponse.success("Información de la empresa obtenida correctamente.", company));
  });

  saveCompany = asyncHandler(async (req, res) => {
    const company = await CompanyService.save(req.body);
    res.json(ApiResponse.success("Información de la empresa actualizada correctamente.", company));
  });
}

export default new ContentController();
