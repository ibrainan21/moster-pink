import ApiError from "../../utils/ApiError.js";
import CartRepository from "./cart.repository.js";

class CartService {
  // Arma el carrito con precios calculados y totales (CU-006).
  async getCart(userId) {
    const items = await CartRepository.getByUser(userId);

    const enriched = items.map((item) => {
      const unitPrice = Number(item.base_price) + Number(item.additional_price);
      return {
        ...item,
        unit_price: unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const total = enriched.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = enriched.reduce((sum, item) => sum + item.quantity, 0);

    return { items: enriched, total, itemCount };
  }

  // RF-029: agregar producto/variante al carrito.
  async addItem(userId, { variantId, quantity }) {
    const variant = await CartRepository.getVariantWithProduct(variantId);
    if (!variant) throw new ApiError(404, "La variante especificada no existe.");

    if (!variant.is_active || variant.product_status !== "ACTIVE") {
      throw new ApiError(400, "Este producto ya no está disponible.");
    }

    await CartRepository.addOrIncrement(userId, variantId, quantity);
    return this.getCart(userId);
  }

  async updateQuantity(userId, itemId, quantity) {
    const item = await CartRepository.getItemById(userId, itemId);
    if (!item) throw new ApiError(404, "El producto no está en tu carrito.");

    if (quantity <= 0) {
      await CartRepository.removeItem(userId, itemId);
    } else {
      await CartRepository.updateQuantity(userId, itemId, quantity);
    }

    return this.getCart(userId);
  }

  async removeItem(userId, itemId) {
    const item = await CartRepository.getItemById(userId, itemId);
    if (!item) throw new ApiError(404, "El producto no está en tu carrito.");
    await CartRepository.removeItem(userId, itemId);
    return this.getCart(userId);
  }

  async clear(userId) {
    await CartRepository.clear(userId);
    return this.getCart(userId);
  }
}

export default new CartService();
