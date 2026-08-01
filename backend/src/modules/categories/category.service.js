import ApiError from "../../utils/ApiError.js";
import slugify from "../../utils/slugify.js";
import CategoryRepository from "./category.repository.js";
import SubcategoryRepository from "./subcategory.repository.js";

class CategoryService {
  async list(onlyActive) {
    return CategoryRepository.getAll({ onlyActive });
  }

  async getById(id) {
    const category = await CategoryRepository.getById(id);
    if (!category) throw new ApiError(404, "Categoría no encontrada.");
    return category;
  }

  async getBySlug(slug) {
    const category = await CategoryRepository.getBySlug(slug);
    if (!category) throw new ApiError(404, "Categoría no encontrada.");
    return category;
  }

  // RF-014, RN-005: el nombre de categoría debe ser único.
  async create({ name, description, imageUrl, sortOrder }) {
    const existing = await CategoryRepository.findByName(name);
    if (existing) throw new ApiError(409, "Ya existe una categoría con ese nombre.");

    const slug = slugify(name);
    return CategoryRepository.create({ name, slug, description, imageUrl, sortOrder });
  }

  async update(id, { name, description, imageUrl, sortOrder }) {
    await this.getById(id);

    const existing = await CategoryRepository.findByName(name);
    if (existing && existing.id !== Number(id)) {
      throw new ApiError(409, "Ya existe una categoría con ese nombre.");
    }

    const slug = slugify(name);
    return CategoryRepository.update(id, { name, slug, description, imageUrl, sortOrder });
  }

  async setActive(id, isActive) {
    await this.getById(id);
    return CategoryRepository.setActive(id, isActive);
  }

  // RN-009: nunca se elimina físicamente si ya tiene productos asociados.
  async remove(id) {
    await this.getById(id);
    const productCount = await CategoryRepository.countProducts(id);

    if (productCount > 0) {
      throw new ApiError(
        409,
        `No se puede eliminar: la categoría tiene ${productCount} producto(s) asociado(s). Desactívala en su lugar.`
      );
    }

    await CategoryRepository.softDelete(id);
  }

  // --- Subcategorías (RF-015, RN-006) ---

  async listSubcategories(categoryId, onlyActive) {
    await this.getById(categoryId);
    return SubcategoryRepository.getByCategory(categoryId, { onlyActive });
  }

  async createSubcategory(categoryId, { name, description }) {
    await this.getById(categoryId);

    const existing = await SubcategoryRepository.findByName(categoryId, name);
    if (existing) throw new ApiError(409, "Ya existe una subcategoría con ese nombre en esta categoría.");

    const slug = slugify(name);
    return SubcategoryRepository.create({ categoryId, name, slug, description });
  }

  async updateSubcategory(id, { name, description }) {
    const sub = await SubcategoryRepository.getById(id);
    if (!sub) throw new ApiError(404, "Subcategoría no encontrada.");

    const slug = slugify(name);
    return SubcategoryRepository.update(id, { name, slug, description });
  }

  async setSubcategoryActive(id, isActive) {
    const sub = await SubcategoryRepository.getById(id);
    if (!sub) throw new ApiError(404, "Subcategoría no encontrada.");
    return SubcategoryRepository.setActive(id, isActive);
  }

  async removeSubcategory(id) {
    const sub = await SubcategoryRepository.getById(id);
    if (!sub) throw new ApiError(404, "Subcategoría no encontrada.");
    await SubcategoryRepository.softDelete(id);
  }
}

export default new CategoryService();
