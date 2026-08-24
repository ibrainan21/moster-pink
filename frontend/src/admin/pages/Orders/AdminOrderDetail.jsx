import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import orderService from "../../../services/order.service";
import { STATUS_LABELS, STATUS_CLASS } from "./orderStatus";
import styles from "./AdminOrderDetail.module.css";

const PAYMENT_METHOD_LABELS = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  PAYPAL: "PayPal",
  MERCADO_PAGO: "Mercado Pago",
};

const SHIPMENT_STATUS_LABELS = {
  PENDING: "Pendiente",
  SHIPPED: "Enviado",
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
  RETURNED: "Devuelto",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value));

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";

/**
 * AdminOrderDetail
 * /admin/pedidos/:id — RF-031, CU-020. Usa GET /api/orders/:id (trae
 * details/payments/shipment/statusHistory/returns ya armados por
 * OrderService.getFullOrder) y las acciones administrativas del mismo
 * módulo (confirm-payment, status, shipment).
 */
function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reloadToken, setReloadToken] = useState(0);
  const [actionError, setActionError] = useState("");

  const { data: order, loading, error } = useFetch(
    (signal) => orderService.getById(id, signal),
    [id, reloadToken]
  );

  const refresh = () => setReloadToken((t) => t + 1);

  if (loading) return <p className={styles.state}>Cargando pedido...</p>;
  if (error || !order) return <p className={styles.state}>No pudimos cargar este pedido.</p>;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backLink} onClick={() => navigate("/admin/pedidos")}>
        <ArrowLeft size={16} /> Volver a pedidos
      </button>

      <div className={styles.header}>
        <div>
          <h1>{order.order_number}</h1>
          <p className={styles.customer}>
            {order.customer_name} · {order.customer_email}
          </p>
        </div>
        <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[order.status]]}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.card}>
            <h2>Productos</h2>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th></th>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.details?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.image ? (
                        <img src={item.image} alt="" className={styles.thumb} />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                    </td>
                    <td>
                      <div className={styles.productName}>{item.product_name}</div>
                      <div className={styles.muted}>
                        {item.sku}
                        {item.color ? ` · ${item.color}` : ""}
                        {item.size ? ` · ${item.size}` : ""}
                      </div>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.unit_price)}</td>
                    <td>{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totals}>
              <div>
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div>
                  <span>Descuento</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              {Number(order.shipping_cost) > 0 && (
                <div>
                  <span>Envío</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
              )}
              {Number(order.tax) > 0 && (
                <div>
                  <span>Impuestos</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            {order.notes && (
              <p className={styles.notes}>
                <strong>Notas:</strong> {order.notes}
              </p>
            )}
          </section>

          <section className={styles.card}>
            <h2>Pagos</h2>
            <PaymentsSection order={order} onChanged={refresh} onError={setActionError} />
          </section>

          <section className={styles.card}>
            <h2>Envío</h2>
            <ShipmentSection order={order} onChanged={refresh} onError={setActionError} />
          </section>

          {order.returns?.length > 0 && (
            <section className={styles.card}>
              <h2>Devoluciones</h2>
              <ul className={styles.timeline}>
                {order.returns.map((ret) => (
                  <li key={ret.id}>
                    <div className={styles.timelineDate}>{formatDateTime(ret.created_at)}</div>
                    <div>
                      <strong>{ret.status}</strong> — {ret.reason}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className={styles.side}>
          <section className={styles.card}>
            <h2>Cambiar estado</h2>
            <StatusChanger order={order} onChanged={refresh} onError={setActionError} />
          </section>

          <section className={styles.card}>
            <h2>Historial</h2>
            {order.statusHistory?.length ? (
              <ul className={styles.timeline}>
                {order.statusHistory.map((h) => (
                  <li key={h.id}>
                    <div className={styles.timelineDate}>{formatDateTime(h.created_at)}</div>
                    <div>
                      {h.previous_status ? `${STATUS_LABELS[h.previous_status] || h.previous_status} → ` : ""}
                      <strong>{STATUS_LABELS[h.new_status] || h.new_status}</strong>
                      {h.changed_by_name ? ` · ${h.changed_by_name}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Sin cambios registrados todavía.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusChanger({ order, onChanged, onError }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    if (status === order.status) return;
    onError("");
    setSaving(true);
    try {
      await orderService.updateStatus(order.id, status);
      onChanged();
    } catch (err) {
      // El backend describe exactamente qué transiciones sí están
      // permitidas desde el estado actual (RN-028); se muestra tal cual.
      onError(err.message || "No pudimos actualizar el estado.");
      setStatus(order.status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.statusChanger}>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.saveButton}
        disabled={saving || status === order.status}
        onClick={handleUpdate}
      >
        {saving ? "Guardando..." : "Actualizar"}
      </button>
    </div>
  );
}

function PaymentsSection({ order, onChanged, onError }) {
  const [amount, setAmount] = useState(order.total);
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MERCADO_PAGO");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    onError("");
    setSaving(true);
    try {
      await orderService.confirmPayment(order.id, {
        amount: Number(amount),
        reference: reference.trim() || null,
        paymentMethod,
      });
      onChanged();
    } catch (err) {
      onError(err.message || "No pudimos confirmar el pago.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {order.payments?.length > 0 && (
        <ul className={styles.timeline}>
          {order.payments.map((p) => (
            <li key={p.id}>
              <div className={styles.timelineDate}>{formatDateTime(p.payment_date)}</div>
              <div>
                <strong>{formatPrice(p.amount)}</strong> ·{" "}
                {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method} · {p.status}
                {p.reference ? ` · ref. ${p.reference}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}

      {order.status === "PENDING" ? (
        <form onSubmit={handleConfirm} className={styles.inlineForm}>
          <p className={styles.hint}>
            Confirma manualmente el pago de este pedido (simula la confirmación que en producción
            llega por el webhook de Mercado Pago).
          </p>
          <div className={styles.inlineFormRow}>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Monto"
            />
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Referencia (opcional)"
          />
          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Confirmando..." : "Confirmar pago"}
          </button>
        </form>
      ) : (
        !order.payments?.length && <p className={styles.muted}>Sin pagos registrados.</p>
      )}
    </>
  );
}

function ShipmentSection({ order, onChanged, onError }) {
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState(order.shipment?.shipping_status || "PENDING");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    onError("");
    setSaving(true);
    try {
      await orderService.createShipment(order.id, {
        carrier: carrier.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
      });
      onChanged();
    } catch (err) {
      onError(err.message || "No pudimos registrar el envío.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    onError("");
    setSaving(true);
    try {
      await orderService.updateShipmentStatus(order.shipment.id, shipmentStatus);
      onChanged();
    } catch (err) {
      onError(err.message || "No pudimos actualizar el estado del envío.");
    } finally {
      setSaving(false);
    }
  };

  if (!order.shipment) {
    return (
      <form onSubmit={handleCreate} className={styles.inlineForm}>
        <p className={styles.hint}>Este pedido todavía no tiene un envío registrado.</p>
        <input
          type="text"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          placeholder="Paquetería (opcional)"
        />
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Número de guía (opcional)"
        />
        <button type="submit" className={styles.saveButton} disabled={saving}>
          {saving ? "Guardando..." : "Registrar envío"}
        </button>
      </form>
    );
  }

  return (
    <div>
      <p className={styles.shipmentInfo}>
        {order.shipment.carrier || "Sin paquetería especificada"}
        {order.shipment.tracking_number ? ` · Guía ${order.shipment.tracking_number}` : ""}
      </p>
      <div className={styles.statusChanger}>
        <select value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value)}>
          {Object.entries(SHIPMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.saveButton}
          disabled={saving || shipmentStatus === order.shipment.shipping_status}
          onClick={handleUpdateStatus}
        >
          {saving ? "Guardando..." : "Actualizar"}
        </button>
      </div>
    </div>
  );
}

export default AdminOrderDetail;
