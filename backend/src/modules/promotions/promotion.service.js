import ApiError from "../../utils/ApiError.js";
import PromotionRepository from "./promotion.repository.js";

class PromotionService {
  async list(onlyActive) {
    return PromotionRepository.list({ onlyActive });
  }

  async getById(id) {
    const promotion = await PromotionRepository.getById(id);
    if (!promotion) throw new ApiError(404, "Promoción no encontrada.");
    const products = await PromotionRepository.getProducts(id);
    return { ...promotion, products };
  }

  async create(data, actingUser) {
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      throw new ApiError(400, "Un descuento porcentual no puede ser mayor a 100.");
    }

    const promotion = await PromotionRepository.create({ ...data, createdBy: actingUser.id });

    if (data.productIds?.length) {
      await PromotionRepository.setProducts(promotion.id, data.productIds);
    }

    return this.getById(promotion.id);
  }

  async update(id, data) {
    await this.getById(id);

    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      throw new ApiError(400, "Un descuento porcentual no puede ser mayor a 100.");
    }

    await PromotionRepository.update(id, data);

    if (data.productIds !== undefined) {
      await PromotionRepository.setProducts(id, data.productIds);
    }

    return this.getById(id);
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return PromotionRepository.setActive(id, isActive);
  }

  async remove(id) {
    await this.getById(id);
    await PromotionRepository.remove(id);
  }

  // Calcula el precio con descuento aplicado, si el producto tiene una
  // promoción vigente (RN-033).
  async getEffectivePrice(productId, basePrice) {
    const promo = await PromotionRepository.getActivePromotionForProduct(productId);
    if (!promo) return { finalPrice: Number(basePrice), promotion: null };

    const discount =
      promo.discount_type === "PERCENTAGE"
        ? (Number(basePrice) * Number(promo.discount_value)) / 100
        : Number(promo.discount_value);

    const finalPrice = Math.max(0, Number(basePrice) - discount);
    return { finalPrice, promotion: promo };
  }
}

export default new PromotionService();
