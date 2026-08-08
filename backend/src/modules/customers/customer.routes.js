import { Router } from "express";
import CustomerController from "./customer.controller.js";
import {
  addressIdParamValidation,
  productIdParamValidation,
  createAddressValidation,
  updateAddressValidation,
  addFavoriteValidation,
} from "./customer.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Todo lo de "mi cuenta" requiere sesión iniciada (direcciones y favoritos
// son siempre del usuario autenticado, sin importar el rol).
router.use(verifyAuth);

// --- Direcciones ---
router.get("/addresses", CustomerController.listAddresses);
router.post("/addresses", createAddressValidation, validate, CustomerController.createAddress);
router.put(
  "/addresses/:addressId",
  updateAddressValidation,
  validate,
  CustomerController.updateAddress
);
router.patch(
  "/addresses/:addressId/default",
  addressIdParamValidation,
  validate,
  CustomerController.setDefaultAddress
);
router.delete(
  "/addresses/:addressId",
  addressIdParamValidation,
  validate,
  CustomerController.removeAddress
);

// --- Favoritos ---
router.get("/favorites", CustomerController.listFavorites);
router.post("/favorites", addFavoriteValidation, validate, CustomerController.addFavorite);
router.delete(
  "/favorites/:productId",
  productIdParamValidation,
  validate,
  CustomerController.removeFavorite
);

export default router;
