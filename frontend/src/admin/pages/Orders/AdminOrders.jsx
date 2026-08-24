import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import orderService from "../../../services/order.service";
import { STATUS_LABELS, STATUS_CLASS } from "./orderStatus";
import styles from "./AdminOrders.module.css";

const PAGE_SIZE = 20;

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "—";

/**
 * AdminOrders
 * /admin/pedidos — RF-031/RF-032, CU-020. Usa GET /api/orders (mismo
 * endpoint que "mis pedidos" del cliente; el backend ya distingue el rol
 * y aquí, como Administrador/Empleado, devuelve todos los pedidos).
 */
function AdminOrders() {
  const navigate = useNavigate();
  const [orderNumberInput, setOrderNumberInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useFetch(
    (signal) =>
      orderService.list(
        {
          page,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
        signal
      ),
    [page, statusFilter, dateFrom, dateTo]
  );

  const orders = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Filtro de folio: no es un parámetro del backend (que solo indexa por
  // userId/status/fechas), así que se aplica sobre la página ya cargada.
  const visibleOrders = orderNumberInput.trim()
    ? orders.filter((o) =>
        o.order_number.toLowerCase().includes(orderNumberInput.trim().toLowerCase())
      )
    : orders;

  const [prevFilters, setPrevFilters] = useState(`${statusFilter}|${dateFrom}|${dateTo}`);
  const filtersKey = `${statusFilter}|${dateFrom}|${dateTo}`;
  if (prevFilters !== filtersKey) {
    setPrevFilters(filtersKey);
    if (page !== 1) setPage(1);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Pedidos</h1>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por folio (PED-000123)..."
            value={orderNumberInput}
            onChange={(e) => setOrderNumberInput(e.target.value)}
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      {loading && <p className={styles.state}>Cargando pedidos...</p>}
      {error && <p className={styles.state}>No pudimos cargar los pedidos.</p>}
      {!loading && !error && visibleOrders.length === 0 && (
        <p className={styles.state}>No hay pedidos con esos filtros.</p>
      )}

      {!loading && visibleOrders.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr
                  key={order.id}
                  className={styles.row}
                  onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                >
                  <td className={styles.orderNumber}>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td className={styles.muted}>{formatDate(order.order_date)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[order.status]]}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.viewButton}
                      title="Ver detalle"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/pedidos/${order.id}`);
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
