import { useState } from "react";
import { Plus, Pencil, Trash2, Power, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import promotionService from "../../../services/promotion.service";
import ProductPicker from "./ProductPicker";
import styles from "./AdminPromotions.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });

function PromotionsTab() {
  const [reloadToken, setReloadToken] = useState(0);
  const [modalPromotion, setModalPromotion] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const { data: promotions, loading, error } = useFetch(
    (signal) => promotionService.listPromotions(false, signal),
    [reloadToken]
  );

  const handleToggleActive = async (promotion) => {
    setActionError("");
    setBusyId(promotion.id);
    try {
      await promotionService.setPromotionActive(promotion.id, !promotion.is_active);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado de la promoción.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (promotion) => {
    if (!window.confirm(`¿Eliminar la promoción "${promotion.name}"?`)) return;
    setActionError("");
    setBusyId(promotion.id);
    try {
      await promotionService.removePromotion(promotion.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar la promoción.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <button type="button" className={styles.newButton} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nueva promoción
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.state}>Cargando promociones...</p>}
      {error && <p className={styles.state}>No pudimos cargar las promociones.</p>}
      {!loading && !error && promotions?.length === 0 && (
        <p className={styles.state}>Todavía no hay promociones. Crea la primera arriba.</p>
      )}

      {!loading && promotions?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descuento</th>
                <th>Compra mínima</th>
                <th>Vigencia</th>
                <th>Productos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td className={styles.nameCell}>{promo.name}</td>
                  <td>
                    {promo.discount_type === "PERCENTAGE"
                      ? `${Number(promo.discount_value)}%`
                      : formatPrice(promo.discount_value)}
                  </td>
                  <td className={styles.muted}>
                    {Number(promo.minimum_purchase) > 0
                      ? formatPrice(promo.minimum_purchase)
                      : "—"}
                  </td>
                  <td className={styles.muted}>
                    {formatDate(promo.start_date)} – {formatDate(promo.end_date)}
                  </td>
                  <td className={styles.muted}>{promo.product_count}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        promo.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {promo.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => setModalPromotion(promo)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title={promo.is_active ? "Desactivar" : "Activar"}
                        disabled={busyId === promo.id}
                        onClick={() => handleToggleActive(promo)}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        className={styles.deleteAction}
                        disabled={busyId === promo.id}
                        onClick={() => handleDelete(promo)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showNew || modalPromotion) && (
        <PromotionModal
          promotion={modalPromotion}
          onClose={() => {
            setShowNew(false);
            setModalPromotion(null);
          }}
          onSuccess={() => {
            setShowNew(false);
            setModalPromotion(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function PromotionModal({ promotion, onClose, onSuccess }) {
  const isEdit = Boolean(promotion?.id);

  const [name, setName] = useState(promotion?.name || "");
  const [description, setDescription] = useState(promotion?.description || "");
  const [discountType, setDiscountType] = useState(promotion?.discount_type || "PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(promotion?.discount_value ?? "");
  const [minimumPurchase, setMinimumPurchase] = useState(promotion?.minimum_purchase ?? "");
  const [startDate, setStartDate] = useState(promotion?.start_date?.slice(0, 10) || "");
  const [endDate, setEndDate] = useState(promotion?.end_date?.slice(0, 10) || "");
  const [products, setProducts] = useState(
    promotion?.products?.map((p) => ({ id: p.id, name: p.name })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !discountValue || !startDate || !endDate) {
      setError("Nombre, descuento y fechas son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        discountType,
        discountValue: Number(discountValue),
        minimumPurchase: minimumPurchase ? Number(minimumPurchase) : 0,
        startDate,
        endDate,
        productIds: products.map((p) => p.id),
      };
      if (isEdit) {
        await promotionService.updatePromotion(promotion.id, payload);
      } else {
        await promotionService.createPromotion(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos guardar la promoción.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Editar promoción" : "Nueva promoción"}</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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

          <div className={styles.modalField}>
            <label>Productos incluidos</label>
            <ProductPicker selected={products} onChange={setProducts} />
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear promoción"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PromotionsTab;
