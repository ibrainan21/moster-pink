import ApiError from "../../utils/ApiError.js";
import slugify from "../../utils/slugify.js";
import { uploadBufferToCloudinary } from "../../utils/cloudinaryUpload.js";
import ProductRepository from "./product.repository.js";
import CategoryRepository from "../categories/category.repository.js";

class ProductService {
  async list(query) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      subcategoryId,
      search,
      status,
      isFeatured,
      isNew,
      minPrice,
      maxPrice,
    } = query;

    const toBool = (v) => (v === undefined || v === null || v === "" ? null : v === "true" || v === "1");

    return ProductRepository.list({
      page,
      limit,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      search: search || null,
      status: status || null,
      isFeatured: toBool(isFeatured),
      isNew: toBool(isNew),
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
    });
  }

  async getFullProduct(product) {
    const [images, variants, tags, related] = await Promise.all([
      ProductRepository.getImages(product.id),
      ProductRepository.getVariants(product.id),
      ProductRepository.getTags(product.id),
      ProductRepository.getRelatedProducts(product.id),
    ]);
    return { ...product, images, variants, tags, related };
  }

  async getById(id) {
    const product = await ProductRepository.getById(id);
    if (!product) throw new ApiError(404, "Producto no encontrado.");
    return this.getFullProduct(product);
  }

  // Detalle público (CU-005): solo productos activos y no eliminados.
  async getBySlug(slug) {
    const product = await ProductRepository.getBySlug(slug);
    if (!product || product.status !== "ACTIVE") {
      throw new ApiError(404, "Producto no encontrado.");
    }
    return this.getFullProduct(product);
  }

  async assertCategoryExists(categoryId) {
    const category = await CategoryRepository.getById(categoryId);
    if (!category) throw new ApiError(400, "La categoría especificada no existe.");
  }

  // RF-006: registro de productos.
  async create(data, actingUser) {
    await this.assertCategoryExists(data.categoryId);

    let slug = slugify(data.name);
    if (await ProductRepository.findBySlug(slug)) {
      slug = `${slug}-${Date.now().toString().slice(-5)}`;
    }

    if (data.sku && (await ProductRepository.findBySku(data.sku))) {
      throw new ApiError(409, "Ya existe un producto con ese SKU.");
    }

    const product = await ProductRepository.create({ ...data, slug });

    if (data.tagIds?.length) await ProductRepository.setTags(product.id, data.tagIds);
    if (data.relatedProductIds?.length) {
      await ProductRepository.setRelatedProducts(product.id, data.relatedProductIds);
    }

    return this.getFullProduct(product);
  }

  // RF-007: edición; conserva historial si cambia costo o precio (RF-028.1).
  async update(id, data, actingUser) {
    const current = await ProductRepository.getById(id);
    if (!current) throw new ApiError(404, "Producto no encontrado.");

    await this.assertCategoryExists(data.categoryId);

    let slug = current.slug;
    if (data.name !== current.name) {
      slug = slugify(data.name);
      const existing = await ProductRepository.findBySlug(slug);
      if (existing && existing.id !== Number(id)) {
        slug = `${slug}-${Date.now().toString().slice(-5)}`;
      }
    }

    if (data.sku && data.sku !== current.sku) {
      const existingSku = await ProductRepository.findBySku(data.sku);
      if (existingSku) throw new ApiError(409, "Ya existe un producto con ese SKU.");
    }

    const costChanged = Number(data.cost) !== Number(current.cost);
    const priceChanged = Number(data.price) !== Number(current.price);

    if (costChanged || priceChanged) {
      await ProductRepository.recordPriceHistory(id, {
        previousCost: current.cost,
        previousPrice: current.price,
        newCost: data.cost,
        newPrice: data.price,
        changedBy: actingUser?.id,
      });
    }

    const updated = await ProductRepository.update(id, { ...data, slug });

    if (data.tagIds !== undefined) await ProductRepository.setTags(id, data.tagIds);
    if (data.relatedProductIds !== undefined) {
      await ProductRepository.setRelatedProducts(id, data.relatedProductIds);
    }

    return this.getFullProduct(updated);
  }

  // RN-007, RF-008, RF-008.1: único estado posible.
  async updateStatus(id, status) {
    const current = await ProductRepository.getById(id);
    if (!current) throw new ApiError(404, "Producto no encontrado.");
    return ProductRepository.updateStatus(id, status);
  }

  async remove(id) {
    const current = await ProductRepository.getById(id);
    if (!current) throw new ApiError(404, "Producto no encontrado.");
    await ProductRepository.softDelete(id);
  }

  async getPriceHistory(id) {
    await this.getById(id);
    return ProductRepository.getPriceHistory(id);
  }

  // --- Imágenes ---

  async uploadImage(productId, file, { variantId = null, isMain = false, imageUrl = null } = {}) {
    const product = await ProductRepository.getById(productId);
    if (!product) throw new ApiError(404, "Producto no encontrado.");

    let finalUrl = imageUrl;
    if (file) {
      const result = await uploadBufferToCloudinary(file.buffer, `moster-pink/products/${productId}`);
      finalUrl = result.secure_url;
    }
    if (!finalUrl) throw new ApiError(400, "No se recibió ninguna imagen ni URL.");

    return ProductRepository.addImage({
      productId,
      variantId,
      imageUrl: finalUrl,
      isMain,
    });
  }

  async removeImage(productId, imageId) {
    const image = await ProductRepository.getImageById(imageId);
    if (!image || image.product_id !== Number(productId)) {
      throw new ApiError(404, "Imagen no encontrada para este producto.");
    }
    await ProductRepository.removeImage(imageId);
  }

  // --- Variantes (RF-016, RF-017) ---

  async listVariants(productId) {
    await this.getById(productId);
    return ProductRepository.getVariants(productId);
  }

  async addVariant(productId, data) {
    await this.getById(productId);

    if (await ProductRepository.findVariantBySku(data.sku)) {
      throw new ApiError(409, "Ya existe una variante con ese SKU.");
    }

    return ProductRepository.createVariant({ productId, ...data });
  }

  async updateVariant(variantId, data) {
    const variant = await ProductRepository.getVariantById(variantId);
    if (!variant) throw new ApiError(404, "Variante no encontrada.");
    return ProductRepository.updateVariant(variantId, data);
  }

  async setVariantActive(variantId, isActive) {
    const variant = await ProductRepository.getVariantById(variantId);
    if (!variant) throw new ApiError(404, "Variante no encontrada.");
    return ProductRepository.setVariantActive(variantId, isActive);
  }
}

export default new ProductService();
