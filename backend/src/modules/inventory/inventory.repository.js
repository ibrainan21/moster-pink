import pool from "../../config/database.js";

class InventoryRepository {
  // RF-017: inventario por almacén + variante (uno o varios almacenes).
  async list({ page = 1, limit = 20, warehouseId = null, productId = null, lowStockOnly = false, search = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (warehouseId) {
      conditions.push("i.warehouse_id = ?");
      params.push(warehouseId);
    }
    if (productId) {
      conditions.push("v.product_id = ?");
      params.push(productId);
    }
    if (lowStockOnly) {
      conditions.push("i.stock <= i.min_stock");
    }
    if (search) {
      conditions.push("(pr.name LIKE ? OR v.sku LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT i.id, i.warehouse_id, w.name AS warehouse_name,
              i.product_variant_id, v.sku, v.color, v.size,
              pr.id AS product_id, pr.name AS product_name,
              i.stock, i.reserved_stock, i.available_stock, i.min_stock, i.max_stock,
              i.updated_at
       FROM inventory i
       INNER JOIN warehouses w ON i.warehouse_id = w.id
       INNER JOIN variants v ON i.product_variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       ${where}
       ORDER BY pr.name ASC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM inventory i
       INNER JOIN variants v ON i.product_variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       ${where}`,
      params
    );

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT i.*, w.name AS warehouse_name, v.sku, pr.name AS product_name
       FROM inventory i
       INNER JOIN warehouses w ON i.warehouse_id = w.id
       INNER JOIN variants v ON i.product_variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByWarehouseAndVariant(warehouseId, variantId) {
    const [rows] = await pool.query(
      `SELECT * FROM inventory WHERE warehouse_id = ? AND product_variant_id = ? LIMIT 1`,
      [warehouseId, variantId]
    );
    return rows[0] || null;
  }

  // Se usa antes de un ajuste manual: si la variante nunca ha tenido
  // inventario en ese almacén, se crea la fila en cero primero.
  async ensureInventoryRow(warehouseId, variantId, minStock = 0) {
    const existing = await this.findByWarehouseAndVariant(warehouseId, variantId);
    if (existing) return existing;

    const [result] = await pool.query(
      `INSERT INTO inventory (warehouse_id, product_variant_id, stock, min_stock)
       VALUES (?, ?, 0, ?)`,
      [warehouseId, variantId, minStock]
    );
    return this.getById(result.insertId);
  }

  async updateThresholds(id, { minStock, maxStock }) {
    await pool.query(`UPDATE inventory SET min_stock = ?, max_stock = ? WHERE id = ?`, [
      minStock,
      maxStock ?? null,
      id,
    ]);
    return this.getById(id);
  }

  // RF-020, RF-023: historial de movimientos (con filtros).
  async listMovements({ page = 1, limit = 20, inventoryId = null, warehouseId = null, variantId = null, movementTypeCode = null, dateFrom = null, dateTo = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (inventoryId) {
      conditions.push("im.inventory_id = ?");
      params.push(inventoryId);
    }
    if (warehouseId) {
      conditions.push("i.warehouse_id = ?");
      params.push(warehouseId);
    }
    if (variantId) {
      conditions.push("i.product_variant_id = ?");
      params.push(variantId);
    }
    if (movementTypeCode) {
      conditions.push("mt.code = ?");
      params.push(movementTypeCode);
    }
    if (dateFrom) {
      conditions.push("im.created_at >= ?");
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push("im.created_at <= ?");
      params.push(dateTo);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT im.id, im.quantity, im.reference_type, im.reference_id, im.notes, im.created_at,
              mt.code AS movement_type, mt.name AS movement_type_name,
              w.name AS warehouse_name, v.sku, pr.name AS product_name,
              CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
       FROM inventory_movements im
       INNER JOIN inventory i ON im.inventory_id = i.id
       INNER JOIN movement_types mt ON im.movement_type_id = mt.id
       INNER JOIN warehouses w ON i.warehouse_id = w.id
       INNER JOIN variants v ON i.product_variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       LEFT JOIN users u ON im.created_by = u.id
       ${where}
       ORDER BY im.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM inventory_movements im
       INNER JOIN inventory i ON im.inventory_id = i.id
       INNER JOIN movement_types mt ON im.movement_type_id = mt.id
       ${where}`,
      params
    );

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  // RF-023: ajuste rápido de inventario (entrada/salida manual).
  // El trigger trg_adjustment_details_ai (12_triggers.sql) es quien
  // realmente mueve el stock y registra el movimiento; aquí solo
  // insertamos el encabezado y el detalle dentro de una transacción.
  async createAdjustment({ warehouseId, variantId, quantity, direction, reason, createdBy }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [invRows] = await connection.query(
        `SELECT id, stock FROM inventory WHERE warehouse_id = ? AND product_variant_id = ? LIMIT 1`,
        [warehouseId, variantId]
      );

      let inventoryId;
      if (invRows.length) {
        inventoryId = invRows[0].id;
      } else {
        const [insertResult] = await connection.query(
          `INSERT INTO inventory (warehouse_id, product_variant_id, stock) VALUES (?, ?, 0)`,
          [warehouseId, variantId]
        );
        inventoryId = insertResult.insertId;
      }

      if (direction === "OUT" && invRows.length && invRows[0].stock < quantity) {
        throw Object.assign(new Error("No hay suficiente inventario para esta salida."), {
          statusCode: 400,
        });
      }

      const [adjustmentResult] = await connection.query(
        `INSERT INTO stock_adjustments (warehouse_id, reason, created_by) VALUES (?, ?, ?)`,
        [warehouseId, reason, createdBy]
      );
      const adjustmentId = adjustmentResult.insertId;

      await connection.query(
        `INSERT INTO adjustment_details (stock_adjustment_id, inventory_id, adjustment_type, quantity, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [adjustmentId, inventoryId, direction, quantity, reason]
      );

      await connection.commit();
      return inventoryId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // RF-021, RF-022: alertas de stock (RN-021).
  async listAlerts({ page = 1, limit = 20, resolved = null, warehouseId = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (resolved !== null) {
      conditions.push("ia.is_resolved = ?");
      params.push(resolved ? 1 : 0);
    }
    if (warehouseId) {
      conditions.push("ia.warehouse_id = ?");
      params.push(warehouseId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT ia.*, w.name AS warehouse_name, v.sku, pr.name AS product_name, i.stock, i.min_stock
       FROM inventory_alerts ia
       INNER JOIN warehouses w ON ia.warehouse_id = w.id
       INNER JOIN inventory i ON ia.inventory_id = i.id
       INNER JOIN variants v ON i.product_variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       ${where}
       ORDER BY ia.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory_alerts ia ${where}`,
      params
    );

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  async resolveAlert(id) {
    await pool.query(
      `UPDATE inventory_alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE id = ?`,
      [id]
    );
  }

  // RF-043: contadores para el dashboard.
  async getSummaryCounts() {
    const [[outOfStock]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory WHERE stock = 0`
    );
    const [[lowStock]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory WHERE stock > 0 AND stock <= min_stock`
    );
    const [[activeAlerts]] = await pool.query(
      `SELECT COUNT(*) AS total FROM inventory_alerts WHERE is_resolved = FALSE`
    );
    return {
      outOfStock: outOfStock.total,
      lowStock: lowStock.total,
      activeAlerts: activeAlerts.total,
    };
  }
}

export default new InventoryRepository();
