import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import useFetch from "../../hooks/useFetch";
import orderService from "../../services/order.service";
import styles from "./OrderConfirmation.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const STATUS_LABELS = {
  PENDING: "Pendiente de pago",
  PAID: "Pagado",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

/**
 * OrderConfirmation
 * Ruta protegida /pedido-confirmado/:id. Muestra el pedido recién creado
 * por el checkout (RF-030). Es también la back_url de success/pending de
 * Mercado Pago (ver utils/mercadoPago.js) — el pedido pasa a PAID cuando
 * llega el webhook real, no por nada que pase en esta página.
 */
function OrderConfirmation() {
  const { id } = useParams();

  const { data: order, loading, error } = useFetch(
    (signal) => orderService.getById(id, signal),
    [id]
  );

  if (loading) {
    return (
      <div>
        <Header />
        <p className={styles.state}>Cargando tu pedido...</p>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Header />
        <div className={styles.notFound}>
          <p>No pudimos encontrar este pedido.</p>
          <Link to="/productos" className={styles.link}>
            ← Ver catálogo
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div className={styles.page}>
        <div className={styles.banner}>
          <CheckCircle2 size={48} color="#ff5c93" />
          <h1>¡Gracias por tu compra!</h1>
          <p>
            Tu pedido <strong>#{order.order_number}</strong> se registró correctamente.
          </p>
          <span className={styles.status}>{STATUS_LABELS[order.status] || order.status}</span>
        </div>

        {order.status === "PENDING" && (
          <p className={styles.paymentNote}>
            Tu pago está siendo confirmado por Mercado Pago — puede tardar unos segundos. Tu
            pedido y tu inventario ya quedaron reservados correctamente.
          </p>
        )}

        <div className={styles.card}>
          <h2>
            <Package size={18} /> Productos
          </h2>
          <div className={styles.detailList}>
            {order.details?.map((item) => (
              <div key={item.id} className={styles.detailItem}>
                {item.image ? (
                  <img src={item.image} alt={item.product_name} />
                ) : (
                  <div className={styles.detailImagePlaceholder}>Sin imagen</div>
                )}
                <div className={styles.detailInfo}>
                  <p className={styles.detailName}>{item.product_name}</p>
                  <p className={styles.detailVariant}>
                    {[item.color, item.size].filter(Boolean).join(" / ")}
                  </p>
                  <p className={styles.detailQty}>Cantidad: {item.quantity}</p>
                </div>
                <p className={styles.detailSubtotal}>{formatPrice(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className={styles.totals}>
            <div>
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div>
                <span>Descuento</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            {Number(order.shipping_cost) > 0 && (
              <div>
                <span>Envío</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
            )}
            <div className={styles.totalFinal}>
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <Link to="/productos" className={styles.continueLink}>
          ← Seguir comprando
        </Link>
      </div>

      <Footer />
    </div>
  );
}

export default OrderConfirmation;
