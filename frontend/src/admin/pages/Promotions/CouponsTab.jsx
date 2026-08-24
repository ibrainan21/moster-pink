import { useState } from "react";
import { Plus, Power, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import promotionService from "../../../services/promotion.service";
import styles from "./AdminPromotions.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });

// El backend (promotion.routes.js) no expone editar ni eliminar un cupón,
// solo crear y cambiar isActive -- por eso esta pestaña no tiene botones
// de editar/borrar como las otras dos.
function CouponsTab() {
  const [reloadToken, setReloadToken] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const { data: coupons, loading, error } = useFetch(
    (signal) => promotionService.listCoupons(false, signal),
    [reloadToken]
  );

  const handleToggleActive = async (coupon) => {
    setActionError("");
    setBusyId(coupon.id);
    try {
      await promotionService.setCouponActive(coupon.id, !coupon.is_active);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado del cupón.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <button type="button" className={styles.newButton} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nuevo cupón
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.state}>Cargando cupones...</p>}
      {error && <p className={styles.state}>No pudimos cargar los cupones.</p>}
      {!loading && !error && coupons?.length === 0 && (
        <p className={styles.state}>Todavía no hay cupones. Crea el primero arriba.</p>
      )}

      {!loading && coupons?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descuento</th>
                <th>Compra mínima</th>
                <th>Usos</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className={styles.nameCell}>{coupon.code}</td>
                  <td>
                    {coupon.discount_type === "PERCENTAGE"
                      ? `${Number(coupon.discount_value)}%`
                      : formatPrice(coupon.discount_value)}
                  </td>
                  <td className={styles.muted}>
                    {Number(coupon.minimum_purchase) > 0
                      ? formatPrice(coupon.minimum_purchase)
                      : "—"}
                  </td>
                  <td className={styles.muted}>
                    {coupon.used_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                  </td>
                  <td className={styles.muted}>
                    {formatDate(coupon.start_date)} – {formatDate(coupon.end_date)}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        coupon.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {coupon.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        title={coupon.is_active ? "Desactivar" : "Activar"}
                        disabled={busyId === coupon.id}
                        onClick={() => handleToggleActive(coupon)}
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <CouponModal
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            setShowNew(false);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function CouponModal({ onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumPurchase, setMinimumPurchase] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim() || !discountValue || !startDate || !endDate) {
      setError("Código, descuento y fechas son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      await promotionService.createCoupon({
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        discountType,
        discountValue: Number(discountValue),
        minimumPurchase: minimumPurchase ? Number(minimumPurchase) : 0,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        startDate,
        endDate,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos crear el cupón.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Nuevo cupón</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>Código</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VERANO20"
              autoFocus
            />
          </div>

          <div className={styles.modalField}>
            <label>Descripción</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Tipo de descuento</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FIXED_AMOUNT">Monto fijo</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Compra mínima (opcional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minimumPurchase}
                onChange={(e) => setMinimumPurchase(e.target.value)}
              />
            </div>
            <div className={styles.modalField}>
              <label>Límite de usos (opcional)</label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Fecha de inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.modalField}>
              <label>Fecha de fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Creando..." : "Crear cupón"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CouponsTab;
