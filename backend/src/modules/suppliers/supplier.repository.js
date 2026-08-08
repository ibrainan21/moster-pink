import pool from "../../config/database.js";

class SupplierRepository {
  // RF-025: administración de proveedores.
  async list({ page = 1, limit = 20, search = null, onlyActive = false }) {
    const offset = (page - 1) * limit;
    const conditions = ["deleted_at IS NULL"];
    const params = [];

    if (onlyActive) conditions.push("is_active = TRUE");

    if (search) {
      conditions.push("(name LIKE ? OR contact_name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query(
      `SELECT * FROM suppliers ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM suppliers ${where}`,
      params
    );

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM suppliers WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByName(name) {
    const [rows] = await pool.query(
      `SELECT * FROM suppliers WHERE name = ? AND deleted_at IS NULL LIMIT 1`,
      [name]
    );
    return rows[0] || null;
  }

  async create({ name, contactName, phone, email, address, notes }) {
    const [result] = await pool.query(
      `INSERT INTO suppliers (name, contact_name, phone, email, address, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, contactName || null, phone || null, email || null, address || null, notes || null]
    );
    return this.getById(result.insertId);
  }

  async update(id, { name, contactName, phone, email, address, notes }) {
    await pool.query(
      `UPDATE suppliers
       SET name = ?, contact_name = ?, phone = ?, email = ?, address = ?, notes = ?
       WHERE id = ?`,
      [name, contactName || null, phone || null, email || null, address || null, notes || null, id]
    );
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE suppliers SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async softDelete(id) {
    await pool.query(`UPDATE suppliers SET deleted_at = NOW(), is_active = FALSE WHERE id = ?`, [id]);
  }

  async countPurchases(id) {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM purchases WHERE supplier_id = ? AND deleted_at IS NULL`,
      [id]
    );
    return total;
  }

  // Para poblar selects en el frontend (RF-026: elegir proveedor al crear orden de compra).
  async listActiveForSelect() {
    const [rows] = await pool.query(
      `SELECT id, name FROM suppliers WHERE is_active = TRUE AND deleted_at IS NULL ORDER BY name ASC`
    );
    return rows;
  }
}

export default new SupplierRepository();
