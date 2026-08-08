import pool from "../../config/database.js";

class SocialRepository {
  // RF-042: enlaces a redes sociales.
  async list({ onlyActive = false } = {}) {
    const where = onlyActive ? "WHERE is_active = TRUE" : "";
    const [rows] = await pool.query(
      `SELECT * FROM social_links ${where} ORDER BY sort_order ASC`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM social_links WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async findByPlatform(platform) {
    const [rows] = await pool.query(`SELECT * FROM social_links WHERE platform = ? LIMIT 1`, [
      platform,
    ]);
    return rows[0] || null;
  }

  async create({ platform, url, sortOrder }) {
    const [result] = await pool.query(
      `INSERT INTO social_links (platform, url, sort_order) VALUES (?, ?, ?)`,
      [platform, url, sortOrder || 0]
    );
    return this.getById(result.insertId);
  }

  async update(id, { url, sortOrder }) {
    await pool.query(`UPDATE social_links SET url = ?, sort_order = ? WHERE id = ?`, [
      url,
      sortOrder || 0,
      id,
    ]);
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE social_links SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async remove(id) {
    await pool.query(`DELETE FROM social_links WHERE id = ?`, [id]);
  }
}

export default new SocialRepository();
