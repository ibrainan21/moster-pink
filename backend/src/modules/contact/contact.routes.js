import { Router } from "express";
import rateLimit from "express-rate-limit";

import ContactController from "./contact.controller.js";
import { sendContactValidation } from "./contact.validation.js";
import validate from "../../middlewares/validate.middleware.js";

const router = Router();

// Ruta pública (cualquier visitante, sin sesión). Rate limit propio para
// que no se use como vector de spam/flood de correos, igual que el login
// (ver auth.routes.js -- mismo patrón).
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiados mensajes enviados. Inténtalo de nuevo en unos minutos.",
  },
});

router.post("/", contactLimiter, sendContactValidation, validate, ContactController.send);

export default router;
