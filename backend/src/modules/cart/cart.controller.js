import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import CartService from "./cart.service.js";

class CartController {
  // GET /api/cart
  getCart = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart(req.user.id);
    res.json(ApiResponse.success("Carrito obtenido correctamente.", cart));
  });

  // POST /api/cart/items  (RF-029, CU-006)
  addItem = asyncHandler(async (req, res) => {
    const cart = await CartService.addItem(req.user.id, {
      variantId: req.body.variantId,
      quantity: req.body.quantity || 1,
    });
    res.status(201).json(ApiResponse.success("Producto agregado al carrito.", cart));
  });

  // PATCH /api/cart/items/:itemId
  updateQuantity = asyncHandler(async (req, res) => {
    const cart = await CartService.updateQuantity(req.user.id, req.params.itemId, req.body.quantity);
    res.json(ApiResponse.success("Carrito actualizado correctamente.", cart));
  });

  // DELETE /api/cart/items/:itemId
  removeItem = asyncHandler(async (req, res) => {
    const cart = await CartService.removeItem(req.user.id, req.params.itemId);
    res.json(ApiResponse.success("Producto eliminado del carrito.", cart));
  });

  // DELETE /api/cart
  clear = asyncHandler(async (req, res) => {
    const cart = await CartService.clear(req.user.id);
    res.json(ApiResponse.success("Carrito vaciado correctamente.", cart));
  });
}

export default new CartController();
