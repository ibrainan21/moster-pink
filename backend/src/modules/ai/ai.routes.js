import { Router } from "express";
import AiController from "./ai.controller.js";
import { recommendValidation, logViewValidation, logSearchValidation } from "./ai.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, optionalAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// RF-045, RF-047: el recomendador y el tracking funcionan tanto para
// visitantes anónimos (identificados por sessionToken) como para clientes
// con sesión iniciada (optionalAuth: no exige token, pero lo usa si viene).
router.post("/recommend", optionalAuth, recommendValidation, validate, AiController.recommend);
router.post("/track/view", optionalAuth, logViewValidation, validate, AiController.logView);
router.post("/track/search", optionalAuth, logSearchValidation, validate, AiController.logSearch);

// Historial personal: requiere sesión iniciada.
router.get("/recommendations/mine", verifyAuth, AiController.listMine);

// Panel administrativo.
router.get("/insights", verifyAuth, authorize("Administrador", "Empleado"), AiController.getInsights);

export default router;
