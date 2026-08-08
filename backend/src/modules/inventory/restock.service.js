import ApiError from "../../utils/ApiError.js";
import RestockRepository from "./restock.repository.js";
import ProductRepository from "../products/product.repository.js";

class RestockService {
  async list(status) {
    return RestockRepository.list({ status });
  }

  async getById(id) {
    const list = await RestockRepository.getById(id);
    if (!list) throw new ApiError(404, "Lista para surtir no encontrada.");
    const items = await RestockRepository.getItems(id);
    return { ...list, items };
  }

  async create(data, actingUser) {
    return RestockRepository.create({ name: data.name, createdBy: actingUser.id });
  }

  async addItem(listId, data) {
    const list = await RestockRepository.getById(listId);
    if (!list) throw new ApiError(404, "Lista para surtir no encontrada.");
    if (list.status !== "OPEN") {
      throw new ApiError(400, "Solo se pueden agregar productos a una lista abierta.");
    }

    const variant = await ProductRepository.getVariantById(data.variantId);
    if (!variant) throw new ApiError(400, "La variante especificada no existe.");

    return RestockRepository.addItem(listId, data);
  }

  async removeItem(listId, itemId) {
    const list = await RestockRepository.getById(listId);
    if (!list) throw new ApiError(404, "Lista para surtir no encontrada.");
    await RestockRepository.removeItem(itemId);
  }

  async updateStatus(id, status) {
    const list = await RestockRepository.getById(id);
    if (!list) throw new ApiError(404, "Lista para surtir no encontrada.");
    return RestockRepository.updateStatus(id, status);
  }
}

export default new RestockService();
