import pool from "../../config/database.js";

class RestockRepository {
  // RF-024: "lista para surtir".
  async list({ status = null } = {}) {
    const conditions = [];
    const params = [];
    if (status) {
      conditions.push("rl.status = ?");
      params.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT rl.*,
              CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
              (SELECT COUNT(*) FROM restock_list_items rli WHERE rli.restock_list_id = rl.id) AS item_count
       FROM restock_lists rl
       LEFT JOIN users u ON rl.created_by = u.id
       ${where}
       ORDER BY rl.created_at DESC`,
      params
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM restock_lists WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async getItems(listId) {
    const [rows] = await pool.query(
      `SELECT rli.*, v.sku, v.color, v.size, pr.name AS product_name
       FROM restock_list_items rli
       INNER JOIN variants v ON rli.variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       WHERE rli.restock_list_id = ?`,
      [listId]
    );
    return rows;
  }

  async create({ name, createdBy }) {
    const [result] = await pool.query(
      `INSERT INTO restock_lists (name, created_by) VALUES (?, ?)`,
      [name || "Lista para surtir", createdBy]
    );
    return this.getById(result.insertId);
  }

  async addItem(listId, { variantId, requestedQuantity, notes }) {
    // Si la variante ya está en la lista, solo sumamos cantidad en vez de duplicar.
    const [existing] = await pool.query(
      `SELECT id, requested_quantity FROM restock_list_items
       WHERE restock_list_id = ? AND variant_id = ? LIMIT 1`,
      [listId, variantId]
    );

    if (existing.length) {
      await pool.query(
        `UPDATE restock_list_items SET requested_quantity = requested_quantity + ?, notes = COALESCE(?, notes)
         WHERE id = ?`,
        [requestedQuantity, notes || null, existing[0].id]
      );
      const [rows] = await pool.query(`SELECT * FROM restock_list_items WHERE id = ?`, [existing[0].id]);
      return rows[0];
    }

    const [result] = await pool.query(
      `INSERT INTO restock_list_items (restock_list_id, variant_id, requested_quantity, notes)
       VALUES (?, ?, ?, ?)`,
      [listId, variantId, requestedQuantity, notes || null]
    );
    const [rows] = await pool.query(`SELECT * FROM restock_list_items WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  async removeItem(itemId) {
    await pool.query(`DELETE FROM restock_list_items WHERE id = ?`, [itemId]);
  }

  async updateStatus(id, status) {
    await pool.query(`UPDATE restock_lists SET status = ? WHERE id = ?`, [status, id]);
    return this.getById(id);
  }
}

export default new RestockRepository();
