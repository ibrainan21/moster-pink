import pool from "../../config/database.js";

class CouponRepository {
  async list({ onlyActive = false } = {}) {
    const where = onlyActive
      ? "WHERE is_active = TRUE AND NOW() BETWEEN start_date AND end_date"
      : "";
    const [rows] = await pool.query(`SELECT * FROM coupons ${where} ORDER BY created_at DESC`);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM coupons WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async findByCode(code) {
    const [rows] = await pool.query(`SELECT * FROM coupons WHERE code = ? LIMIT 1`, [
      code.toUpperCase(),
    ]);
    return rows[0] || null;
  }

  async create({ code, description, discountType, discountValue, minimumPurchase, usageLimit, startDate, endDate, createdBy }) {
    const [result] = await pool.query(
      `INSERT INTO coupons
         (code, description, discount_type, discount_value, minimum_purchase, usage_limit, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        description || null,
        discountType,
        discountValue,
        minimumPurchase || 0,
        usageLimit || null,
        startDate,
        endDate,
        createdBy,
      ]
    );
    return this.getById(result.insertId);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE coupons SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  // RN-035: uso registrado por pedido (también hay UNIQUE(coupon_id, order_id) en BD).
  async recordUsage(couponId, userId, orderId) {
    await pool.query(
      `INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)`,
      [couponId, userId, orderId]
    );
    await pool.query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`, [couponId]);
  }

  async hasUserUsedCoupon(couponId, userId) {
    const [rows] = await pool.query(
      `SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ? LIMIT 1`,
      [couponId, userId]
    );
    return rows.length > 0;
  }
}

export default new CouponRepository();
