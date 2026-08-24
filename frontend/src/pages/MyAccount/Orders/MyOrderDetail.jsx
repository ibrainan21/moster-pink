import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Truck, MapPin, Star, CheckCircle2 } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import orderService from "../../../services/order.service";
import addressService from "../../../services/address.service";
import reviewService from "../../../services/review.service";
import ReviewModal from "../Reviews/ReviewModal";
import { STATUS_LABELS, STATUS_CLASS, SHIPMENT_STATUS_LABELS, canReviewOrder } from "./orderStatus";
import styles from "./MyOrderDetail.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

function MyOrderDetail() {
  const { id } = useParams();

  const { data: order, loading, error } = useFetch(
    (signal) => orderService.getById(id, signal),
    [id]
  );
  const { data: addresses } = useFetch((signal) => addressService.list(signal), []);
  const {
    data: myReviews,
    error: reviewsError,
    // No hay problema si esto falla (p.ej. cuenta sin sesión completa
    // todavía): simplemente no sabremos qué ya se opinó y el botón se
    // mostrará normal.
  } = useFetch((signal) => reviewService.listMine(signal), []);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [justReviewed, setJustReviewed] = useState([]);

  if (loading) return <p className={styles.state}>Cargando tu pedido...</p>;
  if (error || !order) return <p className={styles.state}>No pudimos cargar este pedido.</p>;

  const address = addresses?.find((a) => a.id === order.address_id);
  const reviewedKeys = new Set(
    (reviewsError ? [] : myReviews || [])
      .filter((r) => r.order_id === Number(id))
      .map((r) => r.product_id)
  );

  const hasReview = (productId) =>
    reviewedKeys.has(productId) || justReviewed.includes(productId);

  return (
    <div>
      <Link to="/mi-cuenta/pedidos" className={styles.backLink}>
        ← Volver a mis pedidos
      </Link>

      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>{order.order_number}</h2>
          <p className={styles.date}>{formatDate(order.order_date)}</p>
        </div>
        <span className={`${styles.badge} ${styles[STATUS_CLASS[order.status]]}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Productos</h3>
            <div className={styles.items}>
              {order.details?.map((item) => {
                const variantLabel = [item.color, item.size].filter(Boolean).join(" / ");
                const eligible = canReviewOrder(order.status);
                const reviewed = hasReview(item.product_id);

                return (
                  <div key={item.id} className={styles.item}>
                    {item.image ? (
                      <img src={item.image} alt={item.product_name} className={styles.itemImage} />
                    ) : (
                      <div className={styles.itemImagePlaceholder}>Sin imagen</div>
                    )}

                    <div className={styles.itemInfo}>
                      {item.slug ? (
                        <Link to={`/productos/${item.slug}`} className={styles.itemName}>
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className={styles.itemName}>{item.product_name}</p>
                      )}
                      {variantLabel && <p className={styles.itemVariant}>{variantLabel}</p>}
                      <p className={styles.itemQty}>
                        {item.quantity} × {formatPrice(item.unit_price)}
                      </p>

                      {eligible && item.product_id && (
                        reviewed ? (
                          <span className={styles.reviewedTag}>
                            <CheckCircle2 size={14} /> Ya opinaste sobre este producto
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.reviewButton}
                            onClick={() =>
                              setReviewTarget({
                                productId: item.product_id,
                                productName: item.product_name,
                              })
                            }
                          >
                            <Star size={14} /> Escribir opinión
                          </button>
                        )
                      )}
                    </div>

                    <p className={styles.itemSubtotal}>{formatPrice(item.subtotal)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {order.shipment && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>
                <Truck size={18} /> Envío
              </h3>
              <div className={styles.readOnlyRow}>
                <span className={styles.readOnlyLabel}>Estado</span>
                <span>{SHIPMENT_STATUS_LABELS[order.shipment.shipping_status]}</span>
              </div>
              {order.shipment.carrier && (
                <div className={styles.readOnlyRow}>
                  <span className={styles.readOnlyLabel}>Paquetería</span>
                  <span>{order.shipment.carrier}</span>
                </div>
              )}
              {order.shipment.tracking_number && (
                <div className={styles.readOnlyRow}>
                  <span className={styles.readOnlyLabel}>Guía</span>
                  <span>{order.shipment.tracking_number}</span>
                </div>
              )}
              {order.shipment.delivered_at && (
                <div className={styles.readOnlyRow}>
                  <span className={styles.readOnlyLabel}>Entregado</span>
                  <span>{formatDate(order.shipment.delivered_at)}</span>
                </div>
              )}
            </section>
          )}

          {address && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>
                <MapPin size={18} /> Dirección de envío
              </h3>
              <p className={styles.addressName}>
                {address.alias ? `${address.alias} — ` : ""}
                {address.recipient_name}
              </p>
              <p className={styles.addressDetail}>
                {address.street} {address.exterior_number}
                {address.interior_number ? ` Int. ${address.interior_number}` : ""},{" "}
                {address.neighborhood ? `${address.neighborhood}, ` : ""}
                {address.city ? `${address.city}, ` : ""}
                {address.state} {address.postal_code}
              </p>
            </section>
          )}

          {order.statusHistory?.length > 0 && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Historial del pedido</h3>
              <div className={styles.timeline}>
                {order.statusHistory.map((h) => (
                  <div key={h.id} className={styles.timelineRow}>
                    <span className={styles.timelineStatus}>
                      {STATUS_LABELS[h.new_status] || h.new_status}
                    </span>
                    <span className={styles.timelineDate}>{formatDate(h.created_at)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className={styles.summary}>
          <h3 className={styles.cardTitle}>Resumen</h3>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className={styles.summaryRow}>
              <span>Descuento</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span>{formatPrice(order.shipping_cost)}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          {order.notes && (
            <p className={styles.notes}>
              <strong>Notas:</strong> {order.notes}
            </p>
          )}
        </div>
      </div>

      {reviewTarget && (
        <ReviewModal
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
          orderId={Number(id)}
          onClose={() => setReviewTarget(null)}
          onCreated={() => {
            setJustReviewed((prev) => [...prev, reviewTarget.productId]);
            setReviewTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default MyOrderDetail;
