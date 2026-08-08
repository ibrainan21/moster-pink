import { Router } from "express";
import ContentController from "./content.controller.js";
import {
  idParamValidation,
  setActiveValidation,
  listBannersValidation,
  createBannerValidation,
  updateBannerValidation,
  createGalleryValidation,
  updateGalleryValidation,
  createSocialValidation,
  updateSocialValidation,
  saveCompanyValidation,
} from "./content.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// --- Lectura pública (RF-039 a RF-042, CU-023): todo el contenido del
// sitio se consulta sin autenticación, porque lo ve cualquier visitante. ---
router.get("/banners", listBannersValidation, validate, ContentController.listBanners);
router.get("/gallery", ContentController.listGallery);
router.get("/social", ContentController.listSocial);
router.get("/company", ContentController.getCompany);

// --- Administración: solo Administrador ---
router.use(verifyAuth, authorize("Administrador"));

router.post("/banners", createBannerValidation, validate, ContentController.createBanner);
router.put("/banners/:id", updateBannerValidation, validate, ContentController.updateBanner);
router.patch(
  "/banners/:id/status",
  setActiveValidation,
  validate,
  ContentController.setBannerActive
);
router.delete("/banners/:id", idParamValidation, validate, ContentController.removeBanner);

router.post("/gallery", createGalleryValidation, validate, ContentController.createGalleryItem);
router.put("/gallery/:id", updateGalleryValidation, validate, ContentController.updateGalleryItem);
router.patch(
  "/gallery/:id/status",
  setActiveValidation,
  validate,
  ContentController.setGalleryItemActive
);
router.delete("/gallery/:id", idParamValidation, validate, ContentController.removeGalleryItem);

router.post("/social", createSocialValidation, validate, ContentController.createSocial);
router.put("/social/:id", updateSocialValidation, validate, ContentController.updateSocial);
router.patch(
  "/social/:id/status",
  setActiveValidation,
  validate,
  ContentController.setSocialActive
);
router.delete("/social/:id", idParamValidation, validate, ContentController.removeSocial);

router.put("/company", saveCompanyValidation, validate, ContentController.saveCompany);

export default router;
