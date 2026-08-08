import ApiError from "../../utils/ApiError.js";
import GalleryRepository from "./gallery.repository.js";

class GalleryService {
  async list(query) {
    return GalleryRepository.list({
      category: query.category || null,
      onlyActive: query.onlyActive === "true" || query.onlyActive === true,
    });
  }

  async getById(id) {
    const item = await GalleryRepository.getById(id);
    if (!item) throw new ApiError(404, "Elemento de galería no encontrado.");
    return item;
  }

  async create(data) {
    return GalleryRepository.create(data);
  }

  async update(id, data) {
    await this.getById(id);
    return GalleryRepository.update(id, data);
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return GalleryRepository.setActive(id, isActive);
  }

  async remove(id) {
    await this.getById(id);
    await GalleryRepository.remove(id);
  }
}

export default new GalleryService();
