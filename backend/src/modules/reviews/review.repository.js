import pool from "../../config/database.js";

class ReviewRepository {
  // Reseñas públicas de un producto (CU-005: se muestran en el detalle).
  async listByProduct(productId, { onlyApproved = true } = {}) {
    const where = onlyApproved
      ? "WHERE r.product_id = ? AND r.is_approved = TRUE"
      : "WHERE r.product_id = ?";

    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.photo_url, r.created_at,
              CONCAT(u.first_name, ' ', LEFT(u.last_name, 1), '.') AS customer_name
       FROM reviews r
       INNER JOIN users u ON r.user_id = u.id
       ${where}
       ORDER BY r.created_at DESC`,
      [productId]
    );
    return rows;
  }

  // Reseñas recientes de TODA la tienda (no de un producto en particular).
  // Se usa en la sección "Lo que dicen nuestros clientes" del Home: solo
  // reseñas reales y aprobadas, nunca testimonios inventados.
  async listRecentApproved(limit = 6) {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              CONCAT(u.first_name, ' ', LEFT(u.last_name, 1), '.') AS customer_name,
              p.name AS product_name
       FROM reviews r
       INNER JOIN users u ON r.user_id = u.id
       INNER JOIN products p ON r.product_id = p.id
       WHERE r.is_approved = TRUE AND r.comment IS NOT NULL AND r.comment <> ''
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [Number(limit)]
    );
    return rows;
  }

  async listByUser(userId) {
    const [rows] = await pool.query(
      `SELECT r.*, p.name AS product_name, p.slug
       FROM reviews r
       INNER JOIN products p ON r.product_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM reviews WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  // RN-030: solo puede opinar quien compró el producto en ESE pedido.
  // Se valida que el pedido pertenezca al usuario, contenga ese producto
  // (a través de alguna de sus variantes) y ya no esté pendiente/cancelado.
  async userPurchasedProductInOrder(userId, productId, orderId) {
    const [rows] = await pool.query(
      `SELECT od.id
       FROM orders o
       INNER JOIN order_details od ON od.order_id = o.id
       INNER JOIN variants v ON od.variant_id = v.id
       WHERE o.id = ?
         AND o.user_id = ?
         AND v.product_id = ?
         AND o.status NOT IN ('PENDING', 'CANCELLED')
       LIMIT 1`,
      [orderId, userId, productId]
    );
    return rows.length > 0;
  }

  // RN-031: una sola opinión por pedido/producto (también hay UNIQUE en BD).
  async findExisting(userId, productId, orderId) {
    const [rows] = await pool.query(
      `SELECT * FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1`,
      [userId, productId, orderId]
    );
    return rows[0] || null;
  }

  async create({ userId, productId, orderId, rating, comment, photoUrl }) {
    const [result] = await pool.query(
      `INSERT INTO reviews (user_id, product_id, order_id, rating, comment, photo_url, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [userId, productId, orderId, rating, comment || null, photoUrl || null]
    );
    return this.getById(result.insertId);
  }

  async setApproved(id, isApproved) {
    await pool.query(`UPDATE reviews SET is_approved = ? WHERE id = ?`, [isApproved ? 1 : 0, id]);
    return this.getById(id);
  }

  async remove(id) {
    await pool.query(`DELETE FROM reviews WHERE id = ?`, [id]);
  }

  async getProductAverage(productId) {
    const [[row]] = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS total
       FROM reviews WHERE product_id = ? AND is_approved = TRUE`,
      [productId]
    );
    return { average: Number(row.average).toFixed(1), total: row.total };
  }
}

export default new ReviewRepository();
