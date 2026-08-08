import pool from "../../config/database.js";

class GalleryRepository {
  // RF-041: galerías de imágenes de la tienda.
  async list({ category = null, onlyActive = false } = {}) {
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (onlyActive) {
      conditions.push("is_active = TRUE");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT * FROM galleries ${where} ORDER BY sort_order ASC, created_at DESC`,
      params
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM galleries WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async create({ title, imageUrl, category, sortOrder }) {
    const [result] = await pool.query(
      `INSERT INTO galleries (title, image_url, category, sort_order) VALUES (?, ?, ?, ?)`,
      [title || null, imageUrl, category || null, sortOrder || 0]
    );
    return this.getById(result.insertId);
  }

  async update(id, { title, imageUrl, category, sortOrder }) {
    await pool.query(
      `UPDATE galleries SET title = ?, image_url = ?, category = ?, sort_order = ? WHERE id = ?`,
      [title || null, imageUrl, category || null, sortOrder || 0, id]
    );
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE galleries SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async remove(id) {
    await pool.query(`DELETE FROM galleries WHERE id = ?`, [id]);
  }
}

export default new GalleryRepository();
