import ApiError from "../../utils/ApiError.js";
import ReviewRepository from "./review.repository.js";
import ProductRepository from "../products/product.repository.js";

class ReviewService {
  async listByProduct(productId) {
    const [reviews, summary] = await Promise.all([
      ReviewRepository.listByProduct(productId),
      ReviewRepository.getProductAverage(productId),
    ]);
    return { reviews, summary };
  }

  async listMine(userId) {
    return ReviewRepository.listByUser(userId);
  }

  // RF-036, RN-030, RN-031
  async create(userId, { productId, orderId, rating, comment, photoUrl }) {
    const product = await ProductRepository.getById(productId);
    if (!product) throw new ApiError(404, "Producto no encontrado.");

    const purchased = await ReviewRepository.userPurchasedProductInOrder(userId, productId, orderId);
    if (!purchased) {
      throw new ApiError(
        403,
        "Solo puedes opinar sobre productos que hayas comprado en ese pedido."
      );
    }

    const existing = await ReviewRepository.findExisting(userId, productId, orderId);
    if (existing) {
      throw new ApiError(409, "Ya publicaste una opinión de este producto para este pedido.");
    }

    return ReviewRepository.create({ userId, productId, orderId, rating, comment, photoUrl });
  }

  async remove(userId, reviewId, actingUser) {
    const review = await ReviewRepository.getById(reviewId);
    if (!review) throw new ApiError(404, "Opinión no encontrada.");

    const isOwner = review.user_id === Number(userId);
    const isStaff = actingUser.roleName === "Administrador";

    if (!isOwner && !isStaff) {
      throw new ApiError(403, "No puedes eliminar esta opinión.");
    }

    await ReviewRepository.remove(reviewId);
  }

  // Moderación (opcional, útil para contenido inapropiado).
  async setApproved(reviewId, isApproved) {
    const review = await ReviewRepository.getById(reviewId);
    if (!review) throw new ApiError(404, "Opinión no encontrada.");
    return ReviewRepository.setApproved(reviewId, isApproved);
  }
}

export default new ReviewService();
