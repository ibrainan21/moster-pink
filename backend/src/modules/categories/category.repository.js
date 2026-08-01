import pool from "../../config/database.js";

class CategoryRepository {
  // RF-014, CU-015: listado público/administrativo de categorías.
  async getAll({ onlyActive = false } = {}) {
    const where = onlyActive ? "WHERE c.is_active = TRUE AND c.deleted_at IS NULL" : "WHERE c.deleted_at IS NULL";

    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.is_active, c.sort_order,
              (SELECT COUNT(*) FROM subcategories sc WHERE sc.category_id = c.id AND sc.deleted_at IS NULL) AS subcategory_count
       FROM categories c
       ${where}
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async getBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE slug = ? AND deleted_at IS NULL LIMIT 1`,
      [slug]
    );
    return rows[0] || null;
  }

  async findByName(name) {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE name = ? AND deleted_at IS NULL LIMIT 1`,
      [name]
    );
    return rows[0] || null;
  }

  async create({ name, slug, description, imageUrl, sortOrder }) {
    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, image_url, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [name, slug, description || null, imageUrl || null, sortOrder || 0]
    );
    return this.getById(result.insertId);
  }

  async update(id, { name, slug, description, imageUrl, sortOrder }) {
    await pool.query(
      `UPDATE categories
       SET name = ?, slug = ?, description = ?, image_url = ?, sort_order = ?
       WHERE id = ?`,
      [name, slug, description || null, imageUrl || null, sortOrder || 0, id]
    );
    return this.getById(id);
  }

  // RF-014: activar/desactivar sin borrar (RN-009 aplica también a categorías
  // por consistencia: nunca se elimina físicamente lo que ya tiene productos).
  async setActive(id, isActive) {
    await pool.query(`UPDATE categories SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async softDelete(id) {
    await pool.query(`UPDATE categories SET deleted_at = NOW(), is_active = FALSE WHERE id = ?`, [id]);
  }

  async countProducts(id) {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products WHERE category_id = ? AND deleted_at IS NULL`,
      [id]
    );
    return total;
  }
}

export default new CategoryRepository();
