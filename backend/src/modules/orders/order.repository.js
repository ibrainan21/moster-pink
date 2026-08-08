import pool from "../../config/database.js";

class OrderRepository {
  async generateNextNumber() {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders`);
    return `PED-${String(total + 1).padStart(6, "0")}`;
  }

  async findByNumber(orderNumber) {
    const [rows] = await pool.query(`SELECT id FROM orders WHERE order_number = ? LIMIT 1`, [
      orderNumber,
    ]);
    return rows[0] || null;
  }

  async getDefaultWarehouseId() {
    const [rows] = await pool.query(
      `SELECT id FROM warehouses WHERE is_active = TRUE AND deleted_at IS NULL ORDER BY id ASC LIMIT 1`
    );
    return rows[0]?.id || null;
  }

  // RF-030, CU-007: crea el pedido + sus líneas dentro de una transacción.
  // Los triggers trg_order_details_bi / trg_order_details_ai (12_triggers.sql)
  // validan stock suficiente y descuentan el inventario automáticamente al
  // insertar cada línea; si no alcanza el stock, el INSERT lanza un error y
  // aquí se hace rollback de todo el pedido.
  // Si se manda couponId, el uso del cupón (coupon_usage + used_count) se
  // registra en la MISMA transacción: o se crean el pedido y el uso del
  // cupón juntos, o no se crea ninguno de los dos.
  async create({ userId, addressId, warehouseId, lines, shippingCost = 0, discount = 0, notes, createdBy = null, couponId = null }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice - (l.discount || 0), 0);
      const tax = 0;
      const total = subtotal + tax + Number(shippingCost) - Number(discount);

      let orderNumber = await this.generateNextNumber();
      while (await this.findByNumber(orderNumber)) {
        orderNumber = `PED-${Date.now().toString().slice(-6)}`;
      }

      const [orderResult] = await connection.query(
        `INSERT INTO orders
           (user_id, address_id, order_number, order_date, status,
            subtotal, discount, shipping_cost, tax, total, notes, created_by)
         VALUES (?, ?, ?, NOW(), 'PENDING', ?, ?, ?, ?, ?, ?, ?)`,
        [userId, addressId || null, orderNumber, subtotal, discount, shippingCost, tax, total, notes || null, createdBy]
      );

      const orderId = orderResult.insertId;

      for (const line of lines) {
        const lineSubtotal = line.quantity * line.unitPrice - (line.discount || 0);
        await connection.query(
          `INSERT INTO order_details
             (order_id, warehouse_id, variant_id, quantity, unit_price, discount, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, warehouseId, line.variantId, line.quantity, line.unitPrice, line.discount || 0, lineSubtotal]
        );
      }

      if (couponId) {
        await connection.query(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)`,
          [couponId, userId, orderId]
        );
        await connection.query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`, [
          couponId,
        ]);
      }

      await connection.commit();
      return orderId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async list({ page = 1, limit = 20, userId = null, status = null, dateFrom = null, dateTo = null }) {
    const offset = (page - 1) * limit;
    const conditions = ["o.deleted_at IS NULL"];
    const params = [];

    if (userId) {
      conditions.push("o.user_id = ?");
      params.push(userId);
    }
    if (status) {
      conditions.push("o.status = ?");
      params.push(status);
    }
    if (dateFrom) {
      conditions.push("o.order_date >= ?");
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push("o.order_date <= ?");
      params.push(dateTo);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.order_date, o.status, o.total,
              CONCAT(u.first_name, ' ', u.last_name) AS customer_name
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       ${where}
       ORDER BY o.order_date DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${where}`, params);

    return { rows, total, page: Number(page), limit: Number(limit) };
  }

  async getById(id) {
    const [rows] = await pool.query(
      `SELECT o.*, CONCAT(u.first_name, ' ', u.last_name) AS customer_name, u.email AS customer_email
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND o.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async getDetails(orderId) {
    const [rows] = await pool.query(
      `SELECT od.*, v.sku, v.color, v.size, pr.name AS product_name,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = pr.id
                 ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS image
       FROM order_details od
       INNER JOIN variants v ON od.variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       WHERE od.order_id = ?`,
      [orderId]
    );
    return rows;
  }

  // RN-028: la validación de saltos de estado inválidos y la restauración de
  // stock al cancelar ya las hace el trigger trg_orders_bu; aquí solo se
  // dispara el UPDATE. Si el trigger rechaza la transición, el error sube
  // hasta el service.
  async updateStatus(id, status) {
    await pool.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
    return this.getById(id);
  }

  async getStatusHistory(orderId) {
    const [rows] = await pool.query(
      `SELECT osh.*, CONCAT(u.first_name, ' ', u.last_name) AS changed_by_name
       FROM order_status_history osh
       LEFT JOIN users u ON osh.changed_by = u.id
       WHERE osh.order_id = ?
       ORDER BY osh.created_at ASC`,
      [orderId]
    );
    return rows;
  }

  // --- Pagos (RF-030, Mercado Pago) ---

  async addPayment(orderId, { paymentMethod, amount, paymentDate, reference, status }) {
    const [result] = await pool.query(
      `INSERT INTO order_payments (order_id, payment_method, amount, payment_date, reference, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, paymentMethod, amount, paymentDate || new Date(), reference || null, status || "PENDING"]
    );
    const [rows] = await pool.query(`SELECT * FROM order_payments WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  async getPayments(orderId) {
    const [rows] = await pool.query(
      `SELECT * FROM order_payments WHERE order_id = ? ORDER BY payment_date DESC`,
      [orderId]
    );
    return rows;
  }

  // --- Envíos ---

  async createShipment(orderId, { carrier, trackingNumber }) {
    const [result] = await pool.query(
      `INSERT INTO shipments (order_id, carrier, tracking_number, shipping_status)
       VALUES (?, ?, ?, 'PENDING')`,
      [orderId, carrier || null, trackingNumber || null]
    );
    const [rows] = await pool.query(`SELECT * FROM shipments WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  async updateShipmentStatus(shipmentId, status) {
    const timestampField =
      status === "SHIPPED" ? "shipped_at" : status === "DELIVERED" ? "delivered_at" : null;

    const setClause = timestampField
      ? `shipping_status = ?, ${timestampField} = NOW()`
      : `shipping_status = ?`;

    await pool.query(`UPDATE shipments SET ${setClause} WHERE id = ?`, [status, shipmentId]);
    const [rows] = await pool.query(`SELECT * FROM shipments WHERE id = ?`, [shipmentId]);
    return rows[0];
  }

  async getShipment(orderId) {
    const [rows] = await pool.query(`SELECT * FROM shipments WHERE order_id = ? LIMIT 1`, [orderId]);
    return rows[0] || null;
  }

  // --- Devoluciones del cliente (RF-034) ---

  async createReturn({ orderId, reason, createdBy, lines }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO order_returns (order_id, reason, status, created_by)
         VALUES (?, ?, 'APPROVED', ?)`,
        [orderId, reason, createdBy]
      );
      const returnId = result.insertId;

      for (const line of lines) {
        // trg_order_return_details_ai regresa el stock si item_condition = GOOD.
        await connection.query(
          `INSERT INTO order_return_details (order_return_id, warehouse_id, variant_id, quantity, item_condition)
           VALUES (?, ?, ?, ?, ?)`,
          [returnId, line.warehouseId, line.variantId, line.quantity, line.condition]
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

  async getReturns(orderId) {
    const [rows] = await pool.query(
      `SELECT * FROM order_returns WHERE order_id = ? ORDER BY created_at DESC`,
      [orderId]
    );
    return rows;
  }
}

export default new OrderRepository();
