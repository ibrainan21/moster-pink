import pool from "../../config/database.js";

class PurchaseRepository {
  // RF-028: historial de compras.
  async list({ page = 1, limit = 20, supplierId = null, status = null, dateFrom = null, dateTo = null }) {
    const offset = (page - 1) * limit;
    const conditions = ["p.deleted_at IS NULL"];
    const params = [];

    if (supplierId) {
      conditions.push("p.supplier_id = ?");
      params.push(supplierId);
    }
    if (status) {
      conditions.push("p.status = ?");
      params.push(status);
    }
    if (dateFrom) {
      conditions.push("p.purchase_date >= ?");
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push("p.purchase_date <= ?");
      params.push(dateTo);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query(
      `SELECT p.id, p.purchase_number, p.purchase_date, p.status, p.subtotal, p.tax, p.total,
              s.name AS supplier_name
       FROM purchases p
       INNER JOIN suppliers s ON p.supplier_id = s.id
       ${where}
       ORDER BY p.purchase_date DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM purchases p ${where}`,
      params
    );

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM purchases p
       INNER JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ? AND p.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async getDetails(purchaseId) {
    const [rows] = await pool.query(
      `SELECT pd.*, v.sku, v.color, v.size, pr.name AS product_name, w.name AS warehouse_name
       FROM purchase_details pd
       INNER JOIN variants v ON pd.variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       INNER JOIN warehouses w ON pd.warehouse_id = w.id
       WHERE pd.purchase_id = ?`,
      [purchaseId]
    );
    return rows;
  }

  async getPayments(purchaseId) {
    const [rows] = await pool.query(
      `SELECT * FROM purchase_payments WHERE purchase_id = ? ORDER BY payment_date DESC`,
      [purchaseId]
    );
    return rows;
  }

  async findByNumber(purchaseNumber) {
    const [rows] = await pool.query(
      `SELECT id FROM purchases WHERE purchase_number = ? LIMIT 1`,
      [purchaseNumber]
    );
    return rows[0] || null;
  }

  async generateNextNumber() {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM purchases`);
    const next = total + 1;
    return `OC-${String(next).padStart(6, "0")}`;
  }

  // RF-026: crear orden de compra con sus líneas, en una sola transacción.
  async create({ supplierId, purchaseDate, notes, createdBy, lines }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitCost - (l.discount || 0), 0);
      const tax = 0;
      const total = subtotal + tax;

      let purchaseNumber = await this.generateNextNumber();
      // Reintento simple por si hay una carrera de números (poco probable, pero barato de cubrir).
      while (await this.findByNumber(purchaseNumber)) {
        purchaseNumber = `OC-${Date.now().toString().slice(-6)}`;
      }

      const [purchaseResult] = await connection.query(
        `INSERT INTO purchases
           (supplier_id, purchase_number, purchase_date, status, subtotal, tax, total, notes, created_by)
         VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`,
        [supplierId, purchaseNumber, purchaseDate, subtotal, tax, total, notes || null, createdBy]
      );

      const purchaseId = purchaseResult.insertId;

      for (const line of lines) {
        const lineSubtotal = line.quantity * line.unitCost - (line.discount || 0);
        await connection.query(
          `INSERT INTO purchase_details
             (purchase_id, warehouse_id, variant_id, quantity, unit_cost, discount, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            purchaseId,
            line.warehouseId,
            line.variantId,
            line.quantity,
            line.unitCost,
            line.discount || 0,
            lineSubtotal,
          ]
        );
      }

      await connection.commit();
      return purchaseId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // RF-027, RN-023: al marcar como recibida, el trigger de la BD entra el
  // inventario automáticamente (ver 12_triggers.sql: trg_purchases_received_au).
  async markReceived(id, receivedBy) {
    await pool.query(
      `UPDATE purchases SET status = 'RECEIVED', received_by = ? WHERE id = ?`,
      [receivedBy, id]
    );
    return this.getById(id);
  }

  async cancel(id) {
    await pool.query(`UPDATE purchases SET status = 'CANCELLED' WHERE id = ?`, [id]);
    return this.getById(id);
  }

  async addPayment(purchaseId, { paymentDate, amount, paymentMethod, reference, notes }) {
    const [result] = await pool.query(
      `INSERT INTO purchase_payments (purchase_id, payment_date, amount, payment_method, reference, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [purchaseId, paymentDate, amount, paymentMethod, reference || null, notes || null]
    );
    const [rows] = await pool.query(`SELECT * FROM purchase_payments WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  async getTotalPaid(purchaseId) {
    const [[{ total }]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM purchase_payments WHERE purchase_id = ?`,
      [purchaseId]
    );
    return total;
  }

  // --- Devoluciones a proveedor (schema: purchase_returns) ---

  async createReturn({ purchaseId, reason, lines }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO purchase_returns (purchase_id, return_date, reason, status)
         VALUES (?, NOW(), ?, 'APPROVED')`,
        [purchaseId, reason]
      );
      const returnId = result.insertId;

      for (const line of lines) {
        // El trigger trg_purchase_return_details_ai valida stock suficiente
        // y descuenta el inventario automáticamente al insertar esta línea.
        await connection.query(
          `INSERT INTO purchase_return_details (purchase_return_id, warehouse_id, variant_id, quantity)
           VALUES (?, ?, ?, ?)`,
          [returnId, line.warehouseId, line.variantId, line.quantity]
        );
      }

      await connection.commit();
      return returnId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // Validaciones auxiliares usadas por el service antes de insertar líneas
  // (más amigable que dejar que la base de datos rechace por FK).
  async warehouseExists(id) {
    const [rows] = await pool.query(
      `SELECT id FROM warehouses WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return !!rows[0];
  }

  async getReturns(purchaseId) {
    const [rows] = await pool.query(
      `SELECT pr.*,
              (SELECT COUNT(*) FROM purchase_return_details prd WHERE prd.purchase_return_id = pr.id) AS line_count
       FROM purchase_returns pr
       WHERE pr.purchase_id = ?
       ORDER BY pr.created_at DESC`,
      [purchaseId]
    );
    return rows;
  }
}

export default new PurchaseRepository();
