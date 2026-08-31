import { body, param, query } from "express-validator";

export const idParamValidation = [param("id").isInt({ min: 1 }).withMessage("Id inválido.")];

export const setActiveValidation = [
  ...idParamValidation,
  body("isActive").isBoolean().withMessage("isActive debe ser verdadero o falso."),
];

// --- Banners ---

export const listBannersValidation = [
  query("type").optional().isIn(["MAIN_BANNER", "CAROUSEL"]),
  query("onlyActive").optional().isBoolean(),
];

export const createBannerValidation = [
  body("type").isIn(["MAIN_BANNER", "CAROUSEL"]).withMessage("Tipo de banner inválido."),
  body("imageUrl").trim().notEmpty().withMessage("La imagen es obligatoria."),
  body("title").optional({ nullable: true }).isString(),
  body("linkUrl").optional({ nullable: true }).isString(),
  body("position").optional().isInt({ min: 1 }),
  body("startDate").optional({ nullable: true }).isISO8601(),
  body("endDate").optional({ nullable: true }).isISO8601(),
];

export const updateBannerValidation = [
  ...idParamValidation,
  body("imageUrl").trim().notEmpty().withMessage("La imagen es obligatoria."),
  body("title").optional({ nullable: true }).isString(),
  body("linkUrl").optional({ nullable: true }).isString(),
  body("position").optional().isInt({ min: 1 }),
  body("startDate").optional({ nullable: true }).isISO8601(),
  body("endDate").optional({ nullable: true }).isISO8601(),
];

// --- Galería ---

export const createGalleryValidation = [
  body("imageUrl").trim().notEmpty().withMessage("La imagen es obligatoria."),
  body("title").optional({ nullable: true }).isString(),
  body("category").optional({ nullable: true }).isString(),
  body("sortOrder").optional().isInt(),
];

export const updateGalleryValidation = [...idParamValidation, ...createGalleryValidation];

// --- Redes sociales ---

export const createSocialValidation = [
  body("platform").trim().notEmpty().withMessage("La plataforma es obligatoria."),
  body("url").trim().isURL().withMessage("El enlace debe ser una URL válida."),
  body("sortOrder").optional().isInt(),
];

export const updateSocialValidation = [
  ...idParamValidation,
  body("url").trim().isURL().withMessage("El enlace debe ser una URL válida."),
  body("sortOrder").optional().isInt(),
];

// --- Información de la empresa ---

export const saveCompanyValidation = [
  body("name").trim().notEmpty().withMessage("El nombre del negocio es obligatorio."),
  body("legalName").optional({ nullable: true }).isString(),
  body("rfc").optional({ nullable: true }).isString(),
  body("phone").optional({ nullable: true }).isString(),
  body("email").optional({ nullable: true }).isEmail(),
  body("website").optional({ nullable: true }).isString(),
  body("address").optional({ nullable: true }).isString(),
  body("logoUrl").optional({ nullable: true }).isString(),
  body("about").optional({ nullable: true }).isString().isLength({ max: 2000 }),
];
