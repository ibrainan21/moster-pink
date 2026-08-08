import ApiError from "../../utils/ApiError.js";
import FavoriteRepository from "./favorite.repository.js";
import ProductRepository from "../products/product.repository.js";

class FavoriteService {
  async list(userId) {
    return FavoriteRepository.listByUser(userId);
  }

  // RF-035, RN-032
  async add(userId, productId) {
    const product = await ProductRepository.getById(productId);
    if (!product) throw new ApiError(404, "Producto no encontrado.");

    const existing = await FavoriteRepository.find(userId, productId);
    if (existing) throw new ApiError(409, "Este producto ya está en tus favoritos.");

    await FavoriteRepository.add(userId, productId);
    return this.list(userId);
  }

  async remove(userId, productId) {
    const existing = await FavoriteRepository.find(userId, productId);
    if (!existing) throw new ApiError(404, "Este producto no está en tus favoritos.");

    await FavoriteRepository.remove(userId, productId);
    return this.list(userId);
  }
}

export default new FavoriteService();
