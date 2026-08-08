import pool from "../../config/database.js";

class PromotionRepository {
  // RF-038: promociones (porcentaje, monto fijo, por temporada).
  async list({ onlyActive = false } = {}) {
    const where = onlyActive
      ? "WHERE p.is_active = TRUE AND NOW() BETWEEN p.start_date AND p.end_date"
      : "";

    const [rows] = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM promotion_products pp WHERE pp.promotion_id = p.id) AS product_count
       FROM promotions p
       ${where}
       ORDER BY p.start_date DESC`
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM promotions WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async getProducts(promotionId) {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.name, pr.slug, pr.price
       FROM promotion_products pp
       INNER JOIN products pr ON pp.product_id = pr.id
       WHERE pp.promotion_id = ?`,
      [promotionId]
    );
    return rows;
  }

  async create({ name, description, discountType, discountValue, minimumPurchase, startDate, endDate, createdBy }) {
    const [result] = await pool.query(
      `INSERT INTO promotions
         (name, description, discount_type, discount_value, minimum_purchase, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, discountType, discountValue, minimumPurchase || 0, startDate, endDate, createdBy]
    );
    return this.getById(result.insertId);
  }

  async update(id, { name, description, discountType, discountValue, minimumPurchase, startDate, endDate }) {
    await pool.query(
      `UPDATE promotions SET
         name = ?, description = ?, discount_type = ?, discount_value = ?,
         minimum_purchase = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [name, description || null, discountType, discountValue, minimumPurchase || 0, startDate, endDate, id]
    );
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE promotions SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async setProducts(promotionId, productIds) {
    await pool.query(`DELETE FROM promotion_products WHERE promotion_id = ?`, [promotionId]);
    if (!productIds?.length) return;
    const values = productIds.map((productId) => [promotionId, productId]);
    await pool.query(`INSERT INTO promotion_products (promotion_id, product_id) VALUES ?`, [values]);
  }

  async remove(id) {
    await pool.query(`DELETE FROM promotion_products WHERE promotion_id = ?`, [id]);
    await pool.query(`DELETE FROM promotions WHERE id = ?`, [id]);
  }

  // Precio efectivo de un producto considerando promociones activas (RN-033:
  // solo participa durante el periodo definido). Si hay varias promociones
  // vigentes para el mismo producto, se aplica la que dé mayor descuento.
  async getActivePromotionForProduct(productId) {
    const [rows] = await pool.query(
      `SELECT p.*
       FROM promotions p
       INNER JOIN promotion_products pp ON pp.promotion_id = p.id
       WHERE pp.product_id = ?
         AND p.is_active = TRUE
         AND NOW() BETWEEN p.start_date AND p.end_date
       ORDER BY p.discount_value DESC
       LIMIT 1`,
      [productId]
    );
    return rows[0] || null;
  }
}

export default new PromotionRepository();
