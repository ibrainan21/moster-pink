import { Router } from "express";
import CartController from "./cart.controller.js";
import {
  itemIdParamValidation,
  addItemValidation,
  updateQuantityValidation,
} from "./cart.validation.js";
import validate from "../../middlewares/validate.middleware.js";
import { verifyAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// El carrito es siempre del usuario autenticado (cualquier rol con cuenta,
// aunque en la práctica lo usa el Cliente).
router.use(verifyAuth);

router.get("/", CartController.getCart);
router.post("/items", addItemValidation, validate, CartController.addItem);
router.patch("/items/:itemId", updateQuantityValidation, validate, CartController.updateQuantity);
router.delete("/items/:itemId", itemIdParamValidation, validate, CartController.removeItem);
router.delete("/", CartController.clear);

export default router;
