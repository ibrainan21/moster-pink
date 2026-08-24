import { useState } from "react";
import useFetch from "../../../hooks/useFetch";
import contentService from "../../../services/content.service";
import styles from "./AdminContent.module.css";

/**
 * CompanyTab
 * Datos públicos de la empresa (CU-023): los usan Footer y Location en la
 * tienda pública. Es un solo registro (upsert en el backend -- ver
 * company.service.save), así que aquí no hay lista ni modal, solo un
 * formulario que se precarga con lo que ya exista.
 */
function CompanyTab() {
  const { data: company, loading } = useFetch(
    (signal) => contentService.getCompany(signal),
    []
  );

  if (loading) return <p className={styles.state}>Cargando información de la empresa...</p>;

  return (
    <CompanyForm company={company} />
  );
}

function CompanyForm({ company }) {
  const [form, setForm] = useState({
    name: company?.name || "",
    legalName: company?.legal_name || "",
    rfc: company?.rfc || "",
    phone: company?.phone || "",
    email: company?.email || "",
    website: company?.website || "",
    address: company?.address || "",
    logoUrl: company?.logo_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("El nombre del negocio es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      await contentService.saveCompany(form);
      setSuccess("Los datos de la empresa se guardaron correctamente.");
    } catch (err) {
      setError(err.message || "No pudimos guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.companyForm}>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <div className={styles.modalRow}>
        <div className={styles.modalField}>
          <label>Nombre del negocio</label>
          <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
        </div>
        <div className={styles.modalField}>
          <label>Razón social (opcional)</label>
          <input
            type="text"
            value={form.legalName}
            onChange={(e) => handleChange("legalName", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.modalRow}>
        <div className={styles.modalField}>
          <label>RFC (opcional)</label>
          <input type="text" value={form.rfc} onChange={(e) => handleChange("rfc", e.target.value)} />
        </div>
        <div className={styles.modalField}>
          <label>Teléfono (usado para WhatsApp)</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+52 55 1234 5678"
          />
        </div>
      </div>

      <div className={styles.modalRow}>
        <div className={styles.modalField}>
          <label>Correo de contacto</label>
          <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
        </div>
        <div className={styles.modalField}>
          <label>Sitio web (opcional)</label>
          <input
            type="text"
            value={form.website}
            onChange={(e) => handleChange("website", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.modalField}>
        <label>Dirección</label>
        <textarea
          rows={2}
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </div>

      <div className={styles.modalField}>
        <label>URL del logo (opcional)</label>
        <input
          type="text"
          value={form.logoUrl}
          onChange={(e) => handleChange("logoUrl", e.target.value)}
        />
        {form.logoUrl && <img src={form.logoUrl} alt="" className={styles.preview} />}
      </div>

      <button type="submit" className={styles.saveButton} disabled={saving}>
        {saving ? "Guardando..." : "Guardar datos de la empresa"}
      </button>
    </form>
  );
}

export default CompanyTab;
