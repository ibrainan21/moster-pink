import pool from "../../config/database.js";

class AddressRepository {
  // RF-037: direcciones del cliente.
  async listByUser(userId) {
    const [rows] = await pool.query(
      `SELECT * FROM customer_addresses
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM customer_addresses WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async create(userId, data) {
    const [result] = await pool.query(
      `INSERT INTO customer_addresses
         (user_id, alias, recipient_name, phone, street, exterior_number, interior_number,
          neighborhood, city, state, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.alias || null,
        data.recipientName,
        data.phone || null,
        data.street,
        data.exteriorNumber || null,
        data.interiorNumber || null,
        data.neighborhood || null,
        data.city || null,
        data.state || null,
        data.postalCode || null,
        data.country || "México",
        data.isDefault ? 1 : 0,
      ]
    );
    return this.getById(result.insertId);
  }

  async update(id, data) {
    await pool.query(
      `UPDATE customer_addresses SET
         alias = ?, recipient_name = ?, phone = ?, street = ?, exterior_number = ?,
         interior_number = ?, neighborhood = ?, city = ?, state = ?, postal_code = ?, country = ?
       WHERE id = ?`,
      [
        data.alias || null,
        data.recipientName,
        data.phone || null,
        data.street,
        data.exteriorNumber || null,
        data.interiorNumber || null,
        data.neighborhood || null,
        data.city || null,
        data.state || null,
        data.postalCode || null,
        data.country || "México",
        id,
      ]
    );
    return this.getById(id);
  }

  // Solo una dirección puede ser la predeterminada por usuario.
  async clearDefault(userId) {
    await pool.query(`UPDATE customer_addresses SET is_default = FALSE WHERE user_id = ?`, [userId]);
  }

  async setDefault(id) {
    await pool.query(`UPDATE customer_addresses SET is_default = TRUE WHERE id = ?`, [id]);
    return this.getById(id);
  }

  async softDelete(id) {
    await pool.query(`UPDATE customer_addresses SET deleted_at = NOW() WHERE id = ?`, [id]);
  }
}

export default new AddressRepository();
