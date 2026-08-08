import ApiError from "../../utils/ApiError.js";
import SocialRepository from "./social.repository.js";

class SocialService {
  async list(onlyActive) {
    return SocialRepository.list({ onlyActive });
  }

  async getById(id) {
    const link = await SocialRepository.getById(id);
    if (!link) throw new ApiError(404, "Red social no encontrada.");
    return link;
  }

  async create(data) {
    const existing = await SocialRepository.findByPlatform(data.platform);
    if (existing) {
      throw new ApiError(409, `Ya existe un enlace configurado para ${data.platform}.`);
    }
    return SocialRepository.create(data);
  }

  async update(id, data) {
    await this.getById(id);
    return SocialRepository.update(id, data);
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return SocialRepository.setActive(id, isActive);
  }

  async remove(id) {
    await this.getById(id);
    await SocialRepository.remove(id);
  }
}

export default new SocialService();
