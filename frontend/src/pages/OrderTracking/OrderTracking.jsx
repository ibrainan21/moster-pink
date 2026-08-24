import { useState } from "react";
import { PackageSearch, Truck } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import orderService from "../../services/order.service";
import { ApiClientError } from "../../services/api";
import { STATUS_LABELS } from "../MyAccount/Orders/orderStatus";
import styles from "./OrderTracking.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
    : "";

/**
 * OrderTracking
 * Ruta pública /seguimiento (sin sesión iniciada). Busca un pedido por
 * folio + correo con el que se compró (GET /api/orders/track), nunca solo
 * por folio -- así nadie puede consultar pedidos ajenos adivinando folios
 * consecutivos.
 */
function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);
    setSearched(true);
    try {
      const result = await orderService.track({ orderNumber: orderNumber.trim(), email: email.trim() });
      setOrder(result);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "No se pudo consultar tu pedido. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>Seguimiento de pedido</h1>
        <p className={styles.subtitle}>
          Ingresa el número de tu pedido y el correo con el que compraste para ver su estado.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <PackageSearch size={18} />
            <input
              type="text"
              placeholder="Número de pedido (ej. PED-000015)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
          </label>

          <label className={styles.field}>
            <input
              type="email"
              placeholder="Correo con el que compraste"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Buscando..." : "Buscar pedido"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        {order && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <div>
                <h2 className={styles.orderNumber}>{order.orderNumber}</h2>
                <p className={styles.orderDate}>{formatDate(order.orderDate)}</p>
              </div>
              <span className={styles.statusBadge}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            {order.shipment && (
              <div className={styles.shipmentBox}>
                <Truck size={18} />
                <div>
                  <p className={styles.shipmentCarrier}>{order.shipment.carrier || "Paquetería"}</p>
                  {order.shipment.trackingNumber && (
                    <p className={styles.shipmentTracking}>
                      Guía: {order.shipment.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            <h3 className={styles.sectionTitle}>Productos</h3>
            <ul className={styles.items}>
              {order.items.map((item, index) => (
                <li key={index} className={styles.item}>
                  <span>
                    {item.quantity} × {item.productName}
                    {item.color ? ` (${item.color}${item.size ? `, ${item.size}` : ""})` : ""}
                  </span>
                </li>
              ))}
            </ul>

            <p className={styles.total}>Total: {formatPrice(order.total)}</p>

            {order.statusHistory?.length > 0 && (
              <>
                <h3 className={styles.sectionTitle}>Historial</h3>
                <ul className={styles.timeline}>
                  {order.statusHistory.map((h, index) => (
                    <li key={index} className={styles.timelineItem}>
                      <span className={styles.timelineStatus}>
                        {STATUS_LABELS[h.status] || h.status}
                      </span>
                      <span className={styles.timelineDate}>{formatDate(h.date)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {searched && !loading && !order && !error && (
          <p className={styles.empty}>No encontramos ningún pedido con esos datos.</p>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default OrderTracking;
