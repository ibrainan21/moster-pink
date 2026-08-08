import ApiError from "../../utils/ApiError.js";
import CouponRepository from "./coupon.repository.js";

class CouponService {
  async list(onlyActive) {
    return CouponRepository.list({ onlyActive });
  }

  async getById(id) {
    const coupon = await CouponRepository.getById(id);
    if (!coupon) throw new ApiError(404, "Cupón no encontrado.");
    return coupon;
  }

  async create(data, actingUser) {
    const existing = await CouponRepository.findByCode(data.code);
    if (existing) throw new ApiError(409, "Ya existe un cupón con ese código.");

    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      throw new ApiError(400, "Un descuento porcentual no puede ser mayor a 100.");
    }

    return CouponRepository.create({ ...data, createdBy: actingUser.id });
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return CouponRepository.setActive(id, isActive);
  }

  // RN-035: valida que el cupón pueda usarse (vigencia, límite de usos,
  // compra mínima) sin registrar el uso todavía. Útil para mostrar el
  // descuento en el carrito antes del checkout.
  async validate(code, cartTotal) {
    const coupon = await CouponRepository.findByCode(code);
    if (!coupon) throw new ApiError(404, "El cupón no existe.");

    if (!coupon.is_active) {
      throw new ApiError(400, "Este cupón ya no está activo.");
    }

    const now = new Date();
    if (now < new Date(coupon.start_date) || now > new Date(coupon.end_date)) {
      throw new ApiError(400, "Este cupón no está vigente.");
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new ApiError(400, "Este cupón alcanzó su límite de usos.");
    }

    if (Number(cartTotal) < Number(coupon.minimum_purchase)) {
      throw new ApiError(
        400,
        `La compra mínima para este cupón es de $${coupon.minimum_purchase}.`
      );
    }

    const discount =
      coupon.discount_type === "PERCENTAGE"
        ? (Number(cartTotal) * Number(coupon.discount_value)) / 100
        : Number(coupon.discount_value);

    return { coupon, discount: Math.min(discount, Number(cartTotal)) };
  }

  // Registra el uso una vez que el pedido ya se creó (se llama desde el
  // flujo de checkout cuando se integre el cupón al pedido).
  async apply(code, userId, orderId, cartTotal) {
    const { coupon, discount } = await this.validate(code, cartTotal);
    await CouponRepository.recordUsage(coupon.id, userId, orderId);
    return { coupon, discount };
  }
}

export default new CouponService();
