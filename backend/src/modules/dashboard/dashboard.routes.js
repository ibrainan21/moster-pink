import { Router } from "express";
import DashboardController from "./dashboard.controller.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// RF-043: el dashboard es panel interno -- lo ven Administrador y Empleado,
// igual que el resto de las secciones de solo-lectura del admin (pedidos,
// inventario).
router.use(verifyAuth, authorize("Administrador", "Empleado"));

router.get("/overview", DashboardController.getOverview);

export default router;
