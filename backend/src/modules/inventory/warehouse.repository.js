import pool from "../../config/database.js";

class WarehouseRepository {
  async list({ onlyActive = false } = {}) {
    const where = onlyActive ? "WHERE is_active = TRUE AND deleted_at IS NULL" : "WHERE deleted_at IS NULL";
    const [rows] = await pool.query(`SELECT * FROM warehouses ${where} ORDER BY name ASC`);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM warehouses WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCode(code) {
    const [rows] = await pool.query(
      `SELECT * FROM warehouses WHERE code = ? AND deleted_at IS NULL LIMIT 1`,
      [code]
    );
    return rows[0] || null;
  }

  async create({ name, code, address }) {
    const [result] = await pool.query(
      `INSERT INTO warehouses (name, code, address) VALUES (?, ?, ?)`,
      [name, code, address || null]
    );
    return this.getById(result.insertId);
  }

  async update(id, { name, code, address }) {
    await pool.query(
      `UPDATE warehouses SET name = ?, code = ?, address = ? WHERE id = ?`,
      [name, code, address || null, id]
    );
    return this.getById(id);
  }

  async setActive(id, isActive) {
    await pool.query(`UPDATE warehouses SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    return this.getById(id);
  }

  async countInventoryRows(id) {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory WHERE warehouse_id = ? AND stock > 0`,
      [id]
    );
    return total;
  }

  async softDelete(id) {
    await pool.query(`UPDATE warehouses SET deleted_at = NOW(), is_active = FALSE WHERE id = ?`, [id]);
  }
}

export default new WarehouseRepository();
