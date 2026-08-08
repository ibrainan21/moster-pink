import ApiError from "../../utils/ApiError.js";
import slugify from "../../utils/slugify.js";
import SeasonRepository from "./season.repository.js";

class SeasonService {
  async list(onlyActive) {
    return SeasonRepository.list({ onlyActive });
  }

  async getById(id) {
    const season = await SeasonRepository.getById(id);
    if (!season) throw new ApiError(404, "Temporada no encontrada.");
    const products = await SeasonRepository.getProducts(id);
    return { ...season, products };
  }

  // RN-034: toda temporada tiene fecha de inicio y fin.
  async create(data) {
    let slug = slugify(data.name);
    if (await SeasonRepository.findBySlug(slug)) {
      slug = `${slug}-${Date.now().toString().slice(-5)}`;
    }

    const season = await SeasonRepository.create({ ...data, slug });

    if (data.productIds?.length) {
      await SeasonRepository.setProducts(season.id, data.productIds);
    }

    return this.getById(season.id);
  }

  async update(id, data) {
    const current = await SeasonRepository.getById(id);
    if (!current) throw new ApiError(404, "Temporada no encontrada.");

    let slug = current.slug;
    if (data.name !== current.name) {
      slug = slugify(data.name);
      const existing = await SeasonRepository.findBySlug(slug);
      if (existing && existing.id !== Number(id)) {
        slug = `${slug}-${Date.now().toString().slice(-5)}`;
      }
    }

    await SeasonRepository.update(id, { ...data, slug });

    if (data.productIds !== undefined) {
      await SeasonRepository.setProducts(id, data.productIds);
    }

    return this.getById(id);
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return SeasonRepository.setActive(id, isActive);
  }

  async remove(id) {
    await this.getById(id);
    await SeasonRepository.remove(id);
  }

  async addProduct(seasonId, productId) {
    await this.getById(seasonId);
    await SeasonRepository.addProduct(seasonId, productId);
    return this.getById(seasonId);
  }

  async removeProduct(seasonId, productId) {
    await this.getById(seasonId);
    await SeasonRepository.removeProduct(seasonId, productId);
    return this.getById(seasonId);
  }
}

export default new SeasonService();
