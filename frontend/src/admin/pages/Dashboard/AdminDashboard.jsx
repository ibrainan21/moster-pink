import { Link } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  Star,
  Clock,
} from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import dashboardService from "../../../services/dashboard.service";
import { STATUS_LABELS } from "../Orders/orderStatus";
import RevenueChart from "./RevenueChart";
import styles from "./AdminDashboard.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

const STATUS_BADGE_CLASS = {
  PENDING: "statusPending",
  PAID: "statusPaid",
  PREPARING: "statusPreparing",
  SHIPPED: "statusShipped",
  DELIVERED: "statusDelivered",
  CANCELLED: "statusCancelled",
};

/**
 * AdminDashboard
 * /admin (índice, RF-043). Panel de arranque del admin: un solo GET a
 * /api/dashboard/overview trae todo lo que se muestra aquí (ver
 * dashboard.service.js backend) para no disparar media docena de llamadas
 * sueltas al entrar.
 */
function AdminDashboard() {
  const { data, loading, error } = useFetch(
    (signal) => dashboardService.getOverview(signal),
    []
  );

  if (loading) return <p className={styles.state}>Cargando dashboard...</p>;
  if (error || !data) return <p className={styles.state}>No pudimos cargar el dashboard.</p>;

  const { orders, revenueByDay, recentOrders, topProducts, customers, products, pendingReviews, inventory } =
    data;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.kpiGrid}>
        <KpiCard
          icon={DollarSign}
          label="Ingresos este mes"
          value={formatPrice(orders.month.revenue)}
          sub={`${orders.month.orders} pedidos`}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Pedidos pendientes"
          value={orders.pendingOrders}
          sub="por confirmar pago"
          highlight={orders.pendingOrders > 0}
        />
        <KpiCard
          icon={Users}
          label="Clientes"
          value={customers.total}
          sub={`+${customers.newThisMonth} este mes`}
        />
        <KpiCard
          icon={Package}
          label="Productos activos"
          value={products.active}
          sub={`${products.total} en catálogo`}
        />
      </div>

      {(inventory.outOfStock > 0 || inventory.lowStock > 0 || pendingReviews > 0) && (
        <div className={styles.alerts}>
          {inventory.outOfStock > 0 && (
            <Link to="/admin/inventario" className={styles.alertCard}>
              <AlertTriangle size={18} />
              <span>
                <strong>{inventory.outOfStock}</strong> productos sin stock
              </span>
            </Link>
          )}
          {inventory.lowStock > 0 && (
            <Link to="/admin/inventario" className={styles.alertCard}>
              <AlertTriangle size={18} />
              <span>
                <strong>{inventory.lowStock}</strong> productos con stock bajo
              </span>
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link to="/admin/resenas" className={styles.alertCard}>
              <Star size={18} />
              <span>
                <strong>{pendingReviews}</strong> reseñas por moderar
              </span>
            </Link>
          )}
        </div>
      )}

      <div className={styles.mainGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ingresos últimos 14 días</h2>
          <RevenueChart data={revenueByDay} />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Productos más vendidos</h2>
          {topProducts.length === 0 && <p className={styles.emptyState}>Aún no hay ventas.</p>}
          <div className={styles.topProducts}>
            {topProducts.map((product, index) => (
              <Link
                key={product.id}
                to={`/productos/${product.slug}`}
                className={styles.topProductRow}
              >
                <span className={styles.rank}>{index + 1}</span>
                {product.image ? (
                  <img src={product.image} alt={product.name} className={styles.topProductImage} />
                ) : (
                  <div className={styles.topProductImagePlaceholder} />
                )}
                <div className={styles.topProductInfo}>
                  <p className={styles.topProductName}>{product.name}</p>
                  <p className={styles.topProductSub}>{product.units_sold} vendidos</p>
                </div>
                <span className={styles.topProductRevenue}>{formatPrice(product.revenue)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>Pedidos recientes</h2>
          <Link to="/admin/pedidos" className={styles.viewAllLink}>
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 && <p className={styles.emptyState}>Todavía no hay pedidos.</p>}

        {recentOrders.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/admin/pedidos/${order.id}`} className={styles.orderLink}>
                        {order.order_number}
                      </Link>
                    </td>
                    <td className={styles.muted}>{order.customer_name}</td>
                    <td className={styles.muted}>
                      <Clock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                      {formatDate(order.order_date)}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[STATUS_BADGE_CLASS[order.status]]
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className={styles.total}>{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`${styles.kpiCard} ${highlight ? styles.kpiHighlight : ""}`}>
      <div className={styles.kpiIcon}>
        <Icon size={20} />
      </div>
      <div>
        <p className={styles.kpiValue}>{value}</p>
        <p className={styles.kpiLabel}>{label}</p>
        {sub && <p className={styles.kpiSub}>{sub}</p>}
      </div>
    </div>
  );
}

export default AdminDashboard;
