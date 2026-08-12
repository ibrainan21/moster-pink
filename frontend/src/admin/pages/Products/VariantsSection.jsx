import { useState } from "react";
import { Plus, Pencil, Power, X } from "lucide-react";
import productAdminService from "../../../services/product.admin.service";
import styles from "./VariantsSection.module.css";

const emptyForm = { sku: "", color: "", size: "", material: "", capacity: "", additionalPrice: "0" };

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

/**
 * VariantsSection
 * Vive dentro de ProductForm (solo en modo edición, ya existe el
 * productId). Usa GET/POST /api/products/:productId/variants y
 * PUT/PATCH /api/products/variants/:id (ver product.admin.service.js).
 * No hay endpoint de eliminar variante en el backend — solo activar
 * /desactivar (isActive), así que no se ofrece "eliminar" aquí.
 */
function VariantsSection({ productId, variants, onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const startEdit = (variant) => {
    setEditingId(variant.id);
    setForm({
      sku: variant.sku,
      color: variant.color || "",
      size: variant.size || "",
      material: variant.material || "",
      capacity: variant.capacity || "",
      additionalPrice: String(variant.additional_price ?? 0),
    });
    setError("");
    setShowForm(true);
  };

  const handleField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        color: form.color || undefined,
        size: form.size || undefined,
        material: form.material || undefined,
        capacity: form.capacity || undefined,
        additionalPrice: form.additionalPrice ? Number(form.additionalPrice) : 0,
      };

      if (editingId) {
        await productAdminService.updateVariant(editingId, payload);
      } else {
        await productAdminService.addVariant(productId, { sku: form.sku, ...payload });
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      onChange();
    } catch (err) {
      setError(err.message || "No pudimos guardar la variante.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (variant) => {
    setBusyId(variant.id);
    try {
      await productAdminService.setVariantActive(variant.id, !variant.is_active);
      onChange();
    } catch (err) {
      setError(err.message || "No pudimos actualizar la variante.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>Variantes</h2>
        {!showForm && (
          <button type="button" className={styles.addButton} onClick={startCreate}>
            <Plus size={14} /> Agregar variante
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!variants?.length && !showForm && (
        <p className={styles.empty}>
          Este producto todavía no tiene variantes — sin al menos una, no se puede agregar al
          carrito de la tienda.
        </p>
      )}

      {variants?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Color</th>
                <th>Talla</th>
                <th>Material</th>
                <th>Capacidad</th>
                <th>Precio extra</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.sku}</td>
                  <td>{v.color || "—"}</td>
                  <td>{v.size || "—"}</td>
                  <td>{v.material || "—"}</td>
                  <td>{v.capacity || "—"}</td>
                  <td>{formatPrice(v.additional_price || 0)}</td>
                  <td>
                    <span className={v.is_active ? styles.active : styles.inactive}>
                      {v.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button type="button" title="Editar" onClick={() => startEdit(v)}>
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title={v.is_active ? "Desactivar" : "Activar"}
                        disabled={busyId === v.id}
                        onClick={() => handleToggleActive(v)}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <span>{editingId ? "Editar variante" : "Nueva variante"}</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div className={styles.formGrid}>
            <input
              type="text"
              placeholder="SKU *"
              required
              disabled={Boolean(editingId)}
              value={form.sku}
              onChange={(e) => handleField("sku", e.target.value)}
            />
            <input
              type="text"
              placeholder="Color"
              value={form.color}
              onChange={(e) => handleField("color", e.target.value)}
            />
            <input
              type="text"
              placeholder="Talla (ej. Único)"
              value={form.size}
              onChange={(e) => handleField("size", e.target.value)}
            />
            <input
              type="text"
              placeholder="Material"
              value={form.material}
              onChange={(e) => handleField("material", e.target.value)}
            />
            <input
              type="text"
              placeholder="Capacidad"
              value={form.capacity}
              onChange={(e) => handleField("capacity", e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Precio extra"
              value={form.additionalPrice}
              onChange={(e) => handleField("additionalPrice", e.target.value)}
            />
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : "Guardar variante"}
          </button>
        </form>
      )}
    </div>
  );
}

export default VariantsSection;
