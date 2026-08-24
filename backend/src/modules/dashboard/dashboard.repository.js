import pool from "../../config/database.js";

// RF-043: contadores y listados para el dashboard administrativo. Todo es
// de solo lectura -- no hay tabla propia, son agregaciones sobre orders,
// order_details, users y products (igual que InventoryRepository.
// getSummaryCounts ya hace lo propio para inventario).
class DashboardRepository {
  // Ingresos y pedidos SOLO cuentan pedidos que ya se pagaron de alguna
  // forma (no PENDING ni CANCELLED), igual que el criterio que ya usa
  // review.repository.userPurchasedProductInOrder para "compra válida".
  async getOrderTotals() {
    const [[today]] = await pool.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status NOT IN ('PENDING', 'CANCELLED') AND DATE(order_date) = CURDATE()`
    );
    const [[month]] = await pool.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status NOT IN ('PENDING', 'CANCELLED')
         AND YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE())`
    );
    const [[allTime]] = await pool.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status NOT IN ('PENDING', 'CANCELLED')`
    );
    const [[pending]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE status = 'PENDING'`
    );

    return { today, month, allTime, pendingOrders: pending.total };
  }

  // Ingresos por día de los últimos N días, para la gráfica de tendencia.
  // Incluye días sin pedidos (con 0) para que la gráfica no tenga huecos.
  async getRevenueByDay(days = 14) {
    const [rows] = await pool.query(
      `SELECT DATE(order_date) AS date, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
       FROM orders
       WHERE status NOT IN ('PENDING', 'CANCELLED')
         AND order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(order_date)
       ORDER BY DATE(order_date) ASC`,
      [days - 1]
    );

    const byDate = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r]));
    const result = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = byDate.get(key);
      result.push({
        date: key,
        revenue: found ? Number(found.revenue) : 0,
        orders: found ? found.orders : 0,
      });
    }
    return result;
  }

  async getOrdersByStatus() {
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS total FROM orders GROUP BY status`
    );
    return rows;
  }

  async getRecentOrders(limit = 8) {
    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total, o.order_date,
              CONCAT(u.first_name, ' ', u.last_name) AS customer_name
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       ORDER BY o.order_date DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async getTopProducts(limit = 5) {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.name, pr.slug,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = pr.id
                 ORDER BY pi.is_main DESC, pi.position ASC LIMIT 1) AS image,
              SUM(od.quantity) AS units_sold,
              SUM(od.subtotal) AS revenue
       FROM order_details od
       INNER JOIN variants v ON od.variant_id = v.id
       INNER JOIN products pr ON v.product_id = pr.id
       INNER JOIN orders o ON od.order_id = o.id
       WHERE o.status NOT IN ('PENDING', 'CANCELLED')
       GROUP BY pr.id, pr.name, pr.slug
       ORDER BY units_sold DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async getCustomerCounts() {
    const [[total]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'Cliente'`
    );
    const [[newThisMonth]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'Cliente'
         AND YEAR(u.created_at) = YEAR(CURDATE()) AND MONTH(u.created_at) = MONTH(CURDATE())`
    );
    return { total: total.total, newThisMonth: newThisMonth.total };
  }

  async getProductCounts() {
    const [[active]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products WHERE status = 'ACTIVE'`
    );
    const [[total]] = await pool.query(`SELECT COUNT(*) AS total FROM products`);
    return { active: active.total, total: total.total };
  }

  async getPendingReviewsCount() {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS total FROM reviews WHERE is_approved = FALSE`
    );
    return row.total;
  }
}

export default new DashboardRepository();
