import pool from "../../config/database.js";

class SeasonRepository {
  // RF-011, RF-014, RN-012, RN-034: temporadas comerciales.
  async list({ onlyActive = false } = {}) {
    const where = onlyActive ? "WHERE is_active = TRUE AND CURDATE() BETWEEN start_date AND end_date" : "";
    const [rows] = await pool.query(`SELECT * FROM seasons ${where} ORDER BY start_date DESC`);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM seasons WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async findBySlug(slug) {
    const [rows] = await pool.query(`SELECT id FROM seasons WHERE slug = ? LIMIT 1`, [slug]);
    return rows[0] || null;
  }

  async create({ name, slug, description, bannerImage, startDate, endDate }) {
    const [result] = await pool.query(
      `INSERT INTO seasons (name, slug, description, banner_image, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, bannerImage || null, startDate, endDate]
    );
    return this.getById(result.insertId);
  }

  async update(id, { name, slug, description, bannerImage, startDate, endDate }) {
    await pool.query(
      `UPDATE seasons SET name = ?, slug = ?, description = ?, banner_image = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [name, slug, description || null, bannerImage || null, startDate, endDate, id]
    );
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE seasons SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async remove(id) {
    await pool.query(`DELETE FROM product_seasons WHERE season_id = ?`, [id]);
    await pool.query(`DELETE FROM seasons WHERE id = ?`, [id]);
  }

  // RF-011: productos que se muestran cuando la temporada está activa.
  async getProducts(seasonId) {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.name, pr.slug, pr.price,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = pr.id
                 ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS image
       FROM product_seasons ps
       INNER JOIN products pr ON ps.product_id = pr.id
       WHERE ps.season_id = ? AND pr.status = 'ACTIVE' AND pr.deleted_at IS NULL`,
      [seasonId]
    );
    return rows;
  }

  async setProducts(seasonId, productIds) {
    await pool.query(`DELETE FROM product_seasons WHERE season_id = ?`, [seasonId]);
    if (!productIds?.length) return;
    const values = productIds.map((productId) => [productId, seasonId]);
    await pool.query(`INSERT INTO product_seasons (product_id, season_id) VALUES ?`, [values]);
  }

  async addProduct(seasonId, productId) {
    await pool.query(
      `INSERT IGNORE INTO product_seasons (product_id, season_id) VALUES (?, ?)`,
      [productId, seasonId]
    );
  }

  async removeProduct(seasonId, productId) {
    await pool.query(`DELETE FROM product_seasons WHERE product_id = ? AND season_id = ?`, [
      productId,
      seasonId,
    ]);
  }
}

export default new SeasonRepository();
