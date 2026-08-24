import { useState } from "react";
import { Plus, Pencil, Trash2, Star, MapPin } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import addressService from "../../../services/address.service";
import styles from "./MyAddresses.module.css";

const emptyForm = {
  alias: "",
  recipientName: "",
  phone: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  country: "México",
  isDefault: false,
};

const toFormValues = (address) => ({
  alias: address.alias || "",
  recipientName: address.recipient_name || "",
  phone: address.phone || "",
  street: address.street || "",
  exteriorNumber: address.exterior_number || "",
  interiorNumber: address.interior_number || "",
  neighborhood: address.neighborhood || "",
  city: address.city || "",
  state: address.state || "",
  postalCode: address.postal_code || "",
  country: address.country || "México",
  isDefault: Boolean(address.is_default),
});

/**
 * MyAddresses
 * /mi-cuenta/direcciones (RF-037). CRUD completo sobre
 * /api/customers/addresses: agregar, editar, eliminar y marcar como
 * predeterminada.
 */
function MyAddresses() {
  const { data: addresses, loading, error, refetch } = useFetchWithRefetch();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (address) => {
    setEditingId(address.id);
    setForm(toFormValues(address));
    setFormError("");
    setShowForm(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        await addressService.update(editingId, form);
      } else {
        await addressService.create(form);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      refetch();
    } catch (err) {
      setFormError(err.message || "No pudimos guardar la dirección.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    setActionError("");
    setBusyId(addressId);
    try {
      await addressService.setDefault(addressId);
      refetch();
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar la dirección predeterminada.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (addressId) => {
    if (!window.confirm("¿Eliminar esta dirección?")) return;
    setActionError("");
    setBusyId(addressId);
    try {
      await addressService.remove(addressId);
      refetch();
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar la dirección.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Mis direcciones</h2>
        {!showForm && (
          <button type="button" className={styles.addButton} onClick={openCreateForm}>
            <Plus size={16} /> Agregar dirección
          </button>
        )}
      </div>

      {loading && <p className={styles.state}>Cargando tus direcciones...</p>}
      {error && <p className={styles.state}>No pudimos cargar tus direcciones.</p>}
      {actionError && <p className={styles.error}>{actionError}</p>}

      {!loading && !error && !addresses?.length && !showForm && (
        <div className={styles.empty}>
          <MapPin size={40} color="#ff5c93" />
          <p>Todavía no tienes direcciones guardadas.</p>
        </div>
      )}

      {addresses?.length > 0 && (
        <div className={styles.list}>
          {addresses.map((addr) => (
            <div key={addr.id} className={styles.card}>
              {Boolean(addr.is_default) && <span className={styles.defaultTag}>Predeterminada</span>}

              <p className={styles.addressName}>
                {addr.alias ? `${addr.alias} — ` : ""}
                {addr.recipient_name}
              </p>
              <p className={styles.addressDetail}>
                {addr.street} {addr.exterior_number}
                {addr.interior_number ? ` Int. ${addr.interior_number}` : ""},{" "}
                {addr.neighborhood ? `${addr.neighborhood}, ` : ""}
                {addr.city ? `${addr.city}, ` : ""}
                {addr.state} {addr.postal_code}
              </p>
              {addr.phone && <p className={styles.addressDetail}>Tel: {addr.phone}</p>}

              <div className={styles.cardActions}>
                {!addr.is_default && (
                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={busyId === addr.id}
                    onClick={() => handleSetDefault(addr.id)}
                  >
                    <Star size={14} /> Predeterminar
                  </button>
                )}
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => openEditForm(addr)}
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  disabled={busyId === addr.id}
                  onClick={() => handleRemove(addr.id)}
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3 className={styles.formTitle}>
            {editingId ? "Editar dirección" : "Nueva dirección"}
          </h3>

          {formError && <p className={styles.error}>{formError}</p>}

          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Alias (ej. Casa, Oficina)"
              value={form.alias}
              onChange={(e) => handleChange("alias", e.target.value)}
            />
            <input
              type="text"
              placeholder="Nombre de quien recibe *"
              required
              value={form.recipientName}
              onChange={(e) => handleChange("recipientName", e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Calle *"
              required
              value={form.street}
              onChange={(e) => handleChange("street", e.target.value)}
            />
            <input
              type="text"
              placeholder="Número exterior"
              value={form.exteriorNumber}
              onChange={(e) => handleChange("exteriorNumber", e.target.value)}
            />
            <input
              type="text"
              placeholder="Número interior"
              value={form.interiorNumber}
              onChange={(e) => handleChange("interiorNumber", e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Colonia"
              value={form.neighborhood}
              onChange={(e) => handleChange("neighborhood", e.target.value)}
            />
            <input
              type="text"
              placeholder="Ciudad"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Estado"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
            />
            <input
              type="text"
              placeholder="Código postal"
              value={form.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => handleChange("isDefault", e.target.checked)}
            />
            Usar como dirección predeterminada
          </label>

          <div className={styles.formActions}>
            <button type="submit" disabled={saving} className={styles.saveButton}>
              {saving ? "Guardando..." : "Guardar dirección"}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// useFetch (hooks/useFetch.js) no expone un "refetch" manual -- solo vuelve
// a pedir cuando cambian sus deps. Aquí lo necesitamos después de
// crear/editar/eliminar una dirección, así que envolvemos con un contador
// que forzamos a cambiar para disparar un nuevo fetch.
function useFetchWithRefetch() {
  const [tick, setTick] = useState(0);
  const { data, loading, error } = useFetch((signal) => addressService.list(signal), [tick]);
  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}

export default MyAddresses;
