import pool from "../../config/database.js";

class FavoriteRepository {
  // RF-035: favoritos del cliente.
  async listByUser(userId) {
    const [rows] = await pool.query(
      `SELECT f.id, f.created_at,
              p.id AS product_id, p.name, p.slug, p.price, p.status,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id
                 ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS image
       FROM favorites f
       INNER JOIN products p ON f.product_id = p.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async find(userId, productId) {
    const [rows] = await pool.query(
      `SELECT * FROM favorites WHERE user_id = ? AND product_id = ? LIMIT 1`,
      [userId, productId]
    );
    return rows[0] || null;
  }

  // RN-032: un producto no puede agregarse dos veces a favoritos (la
  // restricción UNIQUE de la tabla ya lo garantiza a nivel de base de
  // datos; aquí solo evitamos el error feo de MySQL con un mensaje claro).
  async add(userId, productId) {
    const [result] = await pool.query(
      `INSERT INTO favorites (user_id, product_id) VALUES (?, ?)`,
      [userId, productId]
    );
    return result.insertId;
  }

  async remove(userId, productId) {
    await pool.query(`DELETE FROM favorites WHERE user_id = ? AND product_id = ?`, [
      userId,
      productId,
    ]);
  }
}

export default new FavoriteRepository();
