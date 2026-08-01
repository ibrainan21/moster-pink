import pool from "../../config/database.js";

class ProductRepository {
  // RF-006 a RF-014: catálogo con filtros para la tienda y el panel admin.
  async list({
    page = 1,
    limit = 20,
    categoryId = null,
    subcategoryId = null,
    search = null,
    status = null,
    isFeatured = null,
    isNew = null,
    minPrice = null,
    maxPrice = null,
  }) {
    const offset = (page - 1) * limit;
    const conditions = ["p.deleted_at IS NULL"];
    const params = [];

    if (categoryId) {
      conditions.push("p.category_id = ?");
      params.push(categoryId);
    }
    if (subcategoryId) {
      conditions.push("p.subcategory_id = ?");
      params.push(subcategoryId);
    }
    if (search) {
      conditions.push("(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push("p.status = ?");
      params.push(status);
    }
    if (isFeatured !== null) {
      conditions.push("p.is_featured = ?");
      params.push(isFeatured ? 1 : 0);
    }
    if (isNew !== null) {
      conditions.push("p.is_new = ?");
      params.push(isNew ? 1 : 0);
    }
    if (minPrice !== null) {
      conditions.push("p.price >= ?");
      params.push(minPrice);
    }
    if (maxPrice !== null) {
      conditions.push("p.price <= ?");
      params.push(maxPrice);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query(
      `SELECT
          p.id, p.name, p.slug, p.sku, p.short_description,
          p.cost, p.price, p.status, p.is_featured, p.is_new,
          c.name AS category, sc.name AS subcategory,
          (SELECT image_url FROM product_images pi
             WHERE pi.product_id = p.id
             ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS main_image
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${where}`,
      params
    );

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, sc.name AS subcategory_name, s.name AS supplier_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ? AND p.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async getBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
       WHERE p.slug = ? AND p.deleted_at IS NULL
       LIMIT 1`,
      [slug]
    );
    return rows[0] || null;
  }

  async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT id FROM products WHERE slug = ? AND deleted_at IS NULL LIMIT 1`,
      [slug]
    );
    return rows[0] || null;
  }

  async findBySku(sku) {
    if (!sku) return null;
    const [rows] = await pool.query(
      `SELECT id FROM products WHERE sku = ? AND deleted_at IS NULL LIMIT 1`,
      [sku]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO products
         (category_id, subcategory_id, supplier_id, name, slug, short_description,
          description, sku, barcode, cost, price, weight, is_featured, is_new,
          new_until, published_at, unpublish_at, seo_title, seo_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.categoryId,
        data.subcategoryId || null,
        data.supplierId || null,
        data.name,
        data.slug,
        data.shortDescription || null,
        data.description || null,
        data.sku || null,
        data.barcode || null,
        data.cost,
        data.price,
        data.weight || null,
        data.isFeatured ? 1 : 0,
        data.isNew ? 1 : 0,
        data.newUntil || null,
        data.publishedAt || null,
        data.unpublishAt || null,
        data.seoTitle || null,
        data.seoDescription || null,
      ]
    );
    return this.getById(result.insertId);
  }

  async update(id, data) {
    await pool.query(
      `UPDATE products SET
         category_id = ?, subcategory_id = ?, supplier_id = ?, name = ?, slug = ?,
         short_description = ?, description = ?, sku = ?, barcode = ?, cost = ?,
         price = ?, weight = ?, is_featured = ?, is_new = ?, new_until = ?,
         published_at = ?, unpublish_at = ?, seo_title = ?, seo_description = ?
       WHERE id = ?`,
      [
        data.categoryId,
        data.subcategoryId || null,
        data.supplierId || null,
        data.name,
        data.slug,
        data.shortDescription || null,
        data.description || null,
        data.sku || null,
        data.barcode || null,
        data.cost,
        data.price,
        data.weight || null,
        data.isFeatured ? 1 : 0,
        data.isNew ? 1 : 0,
        data.newUntil || null,
        data.publishedAt || null,
        data.unpublishAt || null,
        data.seoTitle || null,
        data.seoDescription || null,
        id,
      ]
    );
    return this.getById(id);
  }

  // RN-007: un único estado (ACTIVE / INACTIVE / DISCONTINUED).
  async updateStatus(id, status) {
    const discontinuedAt = status === "DISCONTINUED" ? "NOW()" : "NULL";
    await pool.query(
      `UPDATE products SET status = ?, discontinued_at = ${discontinuedAt} WHERE id = ?`,
      [status, id]
    );
    return this.getById(id);
  }

  // RN-009: nunca eliminación física.
  async softDelete(id) {
    await pool.query(
      `UPDATE products SET deleted_at = NOW(), status = 'INACTIVE' WHERE id = ?`,
      [id]
    );
  }

  // RF-007, RF-028.1: historial de cambios de costo/precio.
  async recordPriceHistory(productId, { previousCost, previousPrice, newCost, newPrice, changedBy }) {
    await pool.query(
      `INSERT INTO product_price_history
         (product_id, previous_cost, previous_price, new_cost, new_price, changed_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, previousCost, previousPrice, newCost, newPrice, changedBy || null]
    );
  }

  async getPriceHistory(productId) {
    const [rows] = await pool.query(
      `SELECT * FROM product_price_history WHERE product_id = ? ORDER BY created_at DESC`,
      [productId]
    );
    return rows;
  }

  // --- Tags (etiquetas especiales) ---

  async setTags(productId, tagIds) {
    await pool.query(`DELETE FROM product_tags WHERE product_id = ?`, [productId]);
    if (!tagIds || !tagIds.length) return;

    const values = tagIds.map((tagId) => [productId, tagId]);
    await pool.query(`INSERT INTO product_tags (product_id, tag_id) VALUES ?`, [values]);
  }

  async getTags(productId) {
    const [rows] = await pool.query(
      `SELECT t.id, t.name, t.slug
       FROM product_tags pt
       INNER JOIN tags t ON pt.tag_id = t.id
       WHERE pt.product_id = ?`,
      [productId]
    );
    return rows;
  }

  // --- Productos relacionados (RF-012) ---

  async setRelatedProducts(productId, relatedIds) {
    await pool.query(`DELETE FROM related_products WHERE product_id = ?`, [productId]);
    const ids = (relatedIds || []).filter((rid) => Number(rid) !== Number(productId));
    if (!ids.length) return;

    const values = ids.map((rid) => [productId, rid]);
    await pool.query(`INSERT INTO related_products (product_id, related_product_id) VALUES ?`, [values]);
  }

  async getRelatedProducts(productId) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id
                 ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS main_image
       FROM related_products rp
       INNER JOIN products p ON rp.related_product_id = p.id
       WHERE rp.product_id = ? AND p.deleted_at IS NULL AND p.status = 'ACTIVE'`,
      [productId]
    );
    return rows;
  }

  // --- Imágenes (RF-006, RF-018) ---

  async getImages(productId) {
    const [rows] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, position ASC`,
      [productId]
    );
    return rows;
  }

  async addImage({ productId, variantId = null, imageUrl, altText = null, isMain = false, position = 1 }) {
    if (isMain) {
      await pool.query(
        `UPDATE product_images SET is_main = FALSE WHERE product_id = ? AND product_variant_id <=> ?`,
        [productId, variantId]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO product_images (product_id, product_variant_id, image_url, alt_text, is_main, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, variantId, imageUrl, altText, isMain ? 1 : 0, position]
    );
    const [rows] = await pool.query(`SELECT * FROM product_images WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  async removeImage(imageId) {
    await pool.query(`DELETE FROM product_images WHERE id = ?`, [imageId]);
  }

  async getImageById(imageId) {
    const [rows] = await pool.query(`SELECT * FROM product_images WHERE id = ?`, [imageId]);
    return rows[0] || null;
  }

  // --- Variantes (RF-016, RF-017) ---

  async getVariants(productId) {
    const [rows] = await pool.query(
      `SELECT v.*,
              COALESCE(SUM(i.stock), 0) AS total_stock
       FROM variants v
       LEFT JOIN inventory i ON i.product_variant_id = v.id
       WHERE v.product_id = ?
       GROUP BY v.id
       ORDER BY v.created_at ASC`,
      [productId]
    );
    return rows;
  }

  async getVariantById(id) {
    const [rows] = await pool.query(`SELECT * FROM variants WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async findVariantBySku(sku) {
    const [rows] = await pool.query(`SELECT id FROM variants WHERE sku = ? LIMIT 1`, [sku]);
    return rows[0] || null;
  }

  async createVariant({ productId, sku, color, size, material, capacity, additionalPrice }) {
    const [result] = await pool.query(
      `INSERT INTO variants (product_id, sku, color, size, material, capacity, additional_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, sku, color || null, size || null, material || null, capacity || null, additionalPrice || 0]
    );
    return this.getVariantById(result.insertId);
  }

  async updateVariant(id, { color, size, material, capacity, additionalPrice }) {
    await pool.query(
      `UPDATE variants SET color = ?, size = ?, material = ?, capacity = ?, additional_price = ?
       WHERE id = ?`,
      [color || null, size || null, material || null, capacity || null, additionalPrice || 0, id]
    );
    return this.getVariantById(id);
  }

  async setVariantActive(id, isActive) {
    await pool.query(`UPDATE variants SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getVariantById(id);
  }
}

export default new ProductRepository();
