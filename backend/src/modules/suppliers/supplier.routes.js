import { Router } from "express";
import SupplierController from "./supplier.controller.js";
import {
  idParamValidation,
  listValidation,
  createSupplierValidation,
  updateSupplierValidation,
  setActiveValidation,
} from "./supplier.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

// Todo el módulo de proveedores es interno (RF-025): Administrador y Empleado
// pueden consultar (para armar compras), solo Administrador administra.
router.use(verifyAuth, authorize("Administrador", "Empleado"));

router.get("/", listValidation, validate, SupplierController.list);
router.get("/select", SupplierController.listForSelect);
router.get("/:id", idParamValidation, validate, SupplierController.getOne);

router.use(authorize("Administrador"));

router.post("/", createSupplierValidation, validate, SupplierController.create);
router.put("/:id", updateSupplierValidation, validate, SupplierController.update);
router.patch("/:id/status", setActiveValidation, validate, SupplierController.setActive);
router.delete("/:id", idParamValidation, validate, SupplierController.remove);

export default router;
