import pool from "../../config/database.js";

class SubcategoryRepository {
  async getByCategory(categoryId, { onlyActive = false } = {}) {
    const where = onlyActive
      ? "WHERE category_id = ? AND is_active = TRUE AND deleted_at IS NULL"
      : "WHERE category_id = ? AND deleted_at IS NULL";

    const [rows] = await pool.query(
      `SELECT * FROM subcategories ${where} ORDER BY name ASC`,
      [categoryId]
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM subcategories WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByName(categoryId, name) {
    const [rows] = await pool.query(
      `SELECT * FROM subcategories WHERE category_id = ? AND name = ? AND deleted_at IS NULL LIMIT 1`,
      [categoryId, name]
    );
    return rows[0] || null;
  }

  async create({ categoryId, name, slug, description }) {
    const [result] = await pool.query(
      `INSERT INTO subcategories (category_id, name, slug, description)
       VALUES (?, ?, ?, ?)`,
      [categoryId, name, slug, description || null]
    );
    return this.getById(result.insertId);
  }

  async update(id, { name, slug, description }) {
    await pool.query(
      `UPDATE subcategories SET name = ?, slug = ?, description = ? WHERE id = ?`,
      [name, slug, description || null, id]
    );
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE subcategories SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async softDelete(id) {
    await pool.query(`UPDATE subcategories SET deleted_at = NOW(), is_active = FALSE WHERE id = ?`, [id]);
  }
}

export default new SubcategoryRepository();
