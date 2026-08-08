import pool from "../../config/database.js";

class CartRepository {
  // RF-029: carrito del cliente autenticado.
  async getByUser(userId) {
    const [rows] = await pool.query(
      `SELECT ci.id, ci.quantity, ci.created_at, ci.updated_at,
              v.id AS variant_id, v.sku, v.color, v.size, v.material, v.capacity,
              v.additional_price, v.is_active AS variant_active,
              pr.id AS product_id, pr.name AS product_name, pr.slug, pr.price AS base_price,
              pr.status AS product_status,
              (SELECT image_url FROM product_images pi
                 WHERE pi.product_id = pr.id
                 ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS image,
              (SELECT COALESCE(SUM(i.stock - i.reserved_stock), 0)
                 FROM inventory i WHERE i.product_variant_id = v.id) AS available_stock
       FROM cart_items ci
       INNER JOIN variants v ON ci.variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async findItem(userId, variantId) {
    const [rows] = await pool.query(
      `SELECT * FROM cart_items WHERE user_id = ? AND variant_id = ? LIMIT 1`,
      [userId, variantId]
    );
    return rows[0] || null;
  }

  async addOrIncrement(userId, variantId, quantity) {
    const existing = await this.findItem(userId, variantId);

    if (existing) {
      await pool.query(`UPDATE cart_items SET quantity = quantity + ? WHERE id = ?`, [
        quantity,
        existing.id,
      ]);
      return existing.id;
    }

    const [result] = await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)`,
      [userId, variantId, quantity]
    );
    return result.insertId;
  }

  async updateQuantity(userId, itemId, quantity) {
    await pool.query(`UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?`, [
      quantity,
      itemId,
      userId,
    ]);
  }

  async removeItem(userId, itemId) {
    await pool.query(`DELETE FROM cart_items WHERE id = ? AND user_id = ?`, [itemId, userId]);
  }

  async clear(userId) {
    await pool.query(`DELETE FROM cart_items WHERE user_id = ?`, [userId]);
  }

  async getItemById(userId, itemId) {
    const [rows] = await pool.query(
      `SELECT * FROM cart_items WHERE id = ? AND user_id = ? LIMIT 1`,
      [itemId, userId]
    );
    return rows[0] || null;
  }

  async getVariantWithProduct(variantId) {
    const [rows] = await pool.query(
      `SELECT v.*, pr.status AS product_status, pr.price AS base_price
       FROM variants v
       INNER JOIN products pr ON v.product_id = pr.id
       WHERE v.id = ? LIMIT 1`,
      [variantId]
    );
    return rows[0] || null;
  }
}

export default new CartRepository();
