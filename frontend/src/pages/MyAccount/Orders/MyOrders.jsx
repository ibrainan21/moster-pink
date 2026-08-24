import { useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import orderService from "../../../services/order.service";
import { STATUS_LABELS, STATUS_CLASS } from "./orderStatus";
import styles from "./MyOrders.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "PAID", label: "Pagados" },
  { value: "PREPARING", label: "Preparando" },
  { value: "SHIPPED", label: "Enviados" },
  { value: "DELIVERED", label: "Entregados" },
  { value: "CANCELLED", label: "Cancelados" },
];

/**
 * MyOrders
 * /mi-cuenta/pedidos (RF-032, CU-008). Lista los pedidos del usuario
 * autenticado -- el backend ya filtra por rol Cliente en OrderService.list.
 */
function MyOrders() {
  const [status, setStatus] = useState("");

  const { data, loading, error } = useFetch(
    (signal) => orderService.list(status ? { status } : {}, signal),
    [status]
  );

  const orders = data?.rows || [];

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Mis pedidos</h2>
        <div className={styles.filters}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.filterButton} ${status === f.value ? styles.filterActive : ""}`}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className={styles.state}>Cargando tus pedidos...</p>}
      {error && <p className={styles.state}>No pudimos cargar tus pedidos.</p>}

      {!loading && !error && orders.length === 0 && (
        <div className={styles.empty}>
          <Package size={40} color="#ff5c93" />
          <p>Todavía no tienes pedidos aquí.</p>
          <Link to="/productos" className={styles.shopLink}>
            Ver productos →
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <div className={styles.list}>
          {orders.map((order) => (
            <Link key={order.id} to={`/mi-cuenta/pedidos/${order.id}`} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.orderNumber}>{order.order_number}</p>
                <p className={styles.orderDate}>{formatDate(order.order_date)}</p>
              </div>
              <span className={`${styles.badge} ${styles[STATUS_CLASS[order.status]]}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <p className={styles.orderTotal}>{formatPrice(order.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
