import pool from "../../config/database.js";

class BannerRepository {
  // RF-039 (banner principal) y RF-040 (carrusel) comparten la misma tabla,
  // diferenciados por "type".
  async list({ type = null, onlyActive = false } = {}) {
    const conditions = [];
    const params = [];

    if (type) {
      conditions.push("type = ?");
      params.push(type);
    }
    if (onlyActive) {
      conditions.push("is_active = TRUE");
      conditions.push("(start_date IS NULL OR start_date <= NOW())");
      conditions.push("(end_date IS NULL OR end_date >= NOW())");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT * FROM banners ${where} ORDER BY position ASC, created_at DESC`,
      params
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM banners WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async create({ type, title, imageUrl, linkUrl, position, startDate, endDate }) {
    const [result] = await pool.query(
      `INSERT INTO banners (type, title, image_url, link_url, position, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, title || null, imageUrl, linkUrl || null, position || 1, startDate || null, endDate || null]
    );
    return this.getById(result.insertId);
  }

  async update(id, { title, imageUrl, linkUrl, position, startDate, endDate }) {
    await pool.query(
      `UPDATE banners SET title = ?, image_url = ?, link_url = ?, position = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [title || null, imageUrl, linkUrl || null, position || 1, startDate || null, endDate || null, id]
    );
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE banners SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async remove(id) {
    await pool.query(`DELETE FROM banners WHERE id = ?`, [id]);
  }
}

export default new BannerRepository();
