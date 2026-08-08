import ApiError from "../../utils/ApiError.js";
import BannerRepository from "./banner.repository.js";

class BannerService {
  async list(query) {
    return BannerRepository.list({
      type: query.type || null,
      onlyActive: query.onlyActive === "true" || query.onlyActive === true,
    });
  }

  async getById(id) {
    const banner = await BannerRepository.getById(id);
    if (!banner) throw new ApiError(404, "Banner no encontrado.");
    return banner;
  }

  async create(data) {
    return BannerRepository.create(data);
  }

  async update(id, data) {
    await this.getById(id);
    return BannerRepository.update(id, data);
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return BannerRepository.setActive(id, isActive);
  }

  async remove(id) {
    await this.getById(id);
    await BannerRepository.remove(id);
  }
}

export default new BannerService();
