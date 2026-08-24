import { useState } from "react";
import useFetch from "../../../hooks/useFetch";
import settingsService from "../../../services/settings.service";
import styles from "./AdminSettings.module.css";

/**
 * AdminSettings
 * /admin/configuracion (RF-044). El formulario se arma a partir del
 * catálogo que manda el backend (SettingsService.KNOWN_SETTINGS) en vez de
 * tener los campos hardcodeados aquí -- así, si el backend agrega una
 * configuración nueva, esta pantalla la muestra sola sin tocar el
 * frontend. Solo entra Administrador (ni Empleado), igual que el backend.
 */
function AdminSettings() {
  const { data: catalog, loading: loadingCatalog } = useFetch(
    (signal) => settingsService.getCatalog(signal),
    []
  );
  const { data: values, loading: loadingValues } = useFetch(
    (signal) => settingsService.getAll(signal),
    []
  );

  const loading = loadingCatalog || loadingValues;

  if (loading) return <p className={styles.state}>Cargando configuración...</p>;
  if (!catalog || !values) return <p className={styles.state}>No pudimos cargar la configuración.</p>;

  return <SettingsForm catalog={catalog} values={values} />;
}

function SettingsForm({ catalog, values }) {
  const [form, setForm] = useState(values);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await settingsService.update(form);
      setForm(updated);
      setSuccess("La configuración se guardó correctamente.");
    } catch (err) {
      setError(err.message || "No pudimos guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.page}>
      <h1 className={styles.title}>Configuración</h1>
      <p className={styles.subtitle}>
        Estos valores afectan directamente el cálculo de envío e impuestos en cada pedido nuevo.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <div className={styles.card}>
        {Object.entries(catalog).map(([key, meta]) => (
          <div key={key} className={styles.field}>
            <label htmlFor={key}>{meta.label}</label>
            {meta.description && <p className={styles.fieldHint}>{meta.description}</p>}
            <input
              id={key}
              type={meta.type === "number" ? "number" : "text"}
              step={meta.type === "number" ? "0.01" : undefined}
              min={meta.type === "number" ? "0" : undefined}
              value={form[key] ?? ""}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        ))}

        <button type="submit" className={styles.saveButton} disabled={saving}>
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}

export default AdminSettings;
