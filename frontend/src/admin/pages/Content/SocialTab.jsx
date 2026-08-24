import { useState } from "react";
import { Plus, Pencil, Trash2, Power, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import contentService from "../../../services/content.service";
import styles from "./AdminContent.module.css";

// Plataformas sugeridas -- el backend acepta cualquier texto en `platform`
// (solo exige que sea único, ver social.service.js), pero sugerimos estas
// porque son las que el Footer reconoce con ícono propio (tiktok,
// whatsapp); el resto usa un ícono genérico.
const SUGGESTED_PLATFORMS = ["instagram", "facebook", "tiktok", "whatsapp", "youtube", "pinterest"];

function SocialTab() {
  const [reloadToken, setReloadToken] = useState(0);
  const [modalLink, setModalLink] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const { data: links, loading, error } = useFetch(
    (signal) => contentService.listAllSocial(signal),
    [reloadToken]
  );

  const handleToggleActive = async (link) => {
    setActionError("");
    setBusyId(link.id);
    try {
      await contentService.setSocialActive(link.id, !link.is_active);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado del enlace.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (link) => {
    if (!window.confirm(`¿Eliminar el enlace de ${link.platform}?`)) return;
    setActionError("");
    setBusyId(link.id);
    try {
      await contentService.removeSocial(link.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar el enlace.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <button type="button" className={styles.newButton} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nueva red social
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.state}>Cargando redes sociales...</p>}
      {error && <p className={styles.state}>No pudimos cargar las redes sociales.</p>}
      {!loading && !error && links?.length === 0 && (
        <p className={styles.state}>Todavía no hay redes sociales. Agrega la primera arriba.</p>
      )}

      {!loading && links?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plataforma</th>
                <th>Enlace</th>
                <th>Orden</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td className={styles.nameCell} style={{ textTransform: "capitalize" }}>
                    {link.platform}
                  </td>
                  <td className={styles.muted}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.url}
                    </a>
                  </td>
                  <td className={styles.muted}>{link.sort_order}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        link.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {link.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" title="Editar" onClick={() => setModalLink(link)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title={link.is_active ? "Desactivar" : "Activar"}
                        disabled={busyId === link.id}
                        onClick={() => handleToggleActive(link)}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        className={styles.deleteAction}
                        disabled={busyId === link.id}
                        onClick={() => handleDelete(link)}
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

      {(showNew || modalLink) && (
        <SocialModal
          link={modalLink}
          onClose={() => {
            setShowNew(false);
            setModalLink(null);
          }}
          onSuccess={() => {
            setShowNew(false);
            setModalLink(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function SocialModal({ link, onClose, onSuccess }) {
  const isEdit = Boolean(link?.id);

  const [platform, setPlatform] = useState(link?.platform || "");
  const [url, setUrl] = useState(link?.url || "");
  const [sortOrder, setSortOrder] = useState(link?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!platform.trim() || !url.trim()) {
      setError("Plataforma y enlace son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await contentService.updateSocial(link.id, { url: url.trim(), sortOrder: Number(sortOrder) || 0 });
      } else {
        await contentService.createSocial({
          platform: platform.trim().toLowerCase(),
          url: url.trim(),
          sortOrder: Number(sortOrder) || 0,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos guardar el enlace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Editar red social" : "Nueva red social"}</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>Plataforma</label>
            <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="instagram"
              list="platform-suggestions"
              disabled={isEdit}
              autoFocus
            />
            <datalist id="platform-suggestions">
              {SUGGESTED_PLATFORMS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className={styles.modalField}>
            <label>Enlace (URL completa)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://instagram.com/monsterpink"
            />
          </div>

          <div className={styles.modalField}>
            <label>Orden</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar enlace"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SocialTab;
