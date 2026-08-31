import { useState } from "react";
import { Plus, Pencil, Trash2, Power, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import contentService from "../../../services/content.service";
import ImageUploadField from "../../../components/ImageUploadField/ImageUploadField";
import styles from "./AdminContent.module.css";

const TYPE_LABELS = {
  MAIN_BANNER: "Banner principal",
  CAROUSEL: "Carrusel",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : "—";

/**
 * BannersTab
 * "banners" es una sola tabla en el backend, diferenciada por `type`
 * (MAIN_BANNER para el Hero del Home, CAROUSEL para un carrusel futuro).
 * Se listan juntos con una columna de tipo en vez de dos pestañas, porque
 * es la misma entidad con el mismo formulario.
 */
function BannersTab() {
  const [reloadToken, setReloadToken] = useState(0);
  const [modalBanner, setModalBanner] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const { data: banners, loading, error } = useFetch(
    (signal) => contentService.listAllBanners(signal),
    [reloadToken]
  );

  const handleToggleActive = async (banner) => {
    setActionError("");
    setBusyId(banner.id);
    try {
      await contentService.setBannerActive(banner.id, !banner.is_active);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado del banner.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm(`¿Eliminar el banner "${banner.title || banner.type}"?`)) return;
    setActionError("");
    setBusyId(banner.id);
    try {
      await contentService.removeBanner(banner.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar el banner.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <button type="button" className={styles.newButton} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nuevo banner
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.state}>Cargando banners...</p>}
      {error && <p className={styles.state}>No pudimos cargar los banners.</p>}
      {!loading && !error && banners?.length === 0 && (
        <p className={styles.state}>Todavía no hay banners. Crea el primero arriba.</p>
      )}

      {!loading && banners?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vista previa</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Posición</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td>
                    <img src={banner.image_url} alt={banner.title || ""} className={styles.thumb} />
                  </td>
                  <td className={styles.nameCell}>{banner.title || "—"}</td>
                  <td className={styles.muted}>{TYPE_LABELS[banner.type] || banner.type}</td>
                  <td className={styles.muted}>{banner.position}</td>
                  <td className={styles.muted}>
                    {banner.start_date || banner.end_date
                      ? `${formatDate(banner.start_date)} – ${formatDate(banner.end_date)}`
                      : "Siempre"}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        banner.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {banner.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" title="Editar" onClick={() => setModalBanner(banner)}>
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title={banner.is_active ? "Desactivar" : "Activar"}
                        disabled={busyId === banner.id}
                        onClick={() => handleToggleActive(banner)}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        className={styles.deleteAction}
                        disabled={busyId === banner.id}
                        onClick={() => handleDelete(banner)}
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

      {(showNew || modalBanner) && (
        <BannerModal
          banner={modalBanner}
          onClose={() => {
            setShowNew(false);
            setModalBanner(null);
          }}
          onSuccess={() => {
            setShowNew(false);
            setModalBanner(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function BannerModal({ banner, onClose, onSuccess }) {
  const isEdit = Boolean(banner?.id);

  const [type, setType] = useState(banner?.type || "MAIN_BANNER");
  const [title, setTitle] = useState(banner?.title || "");
  const [imageUrl, setImageUrl] = useState(banner?.image_url || "");
  const [linkUrl, setLinkUrl] = useState(banner?.link_url || "");
  const [position, setPosition] = useState(banner?.position ?? 1);
  const [startDate, setStartDate] = useState(banner?.start_date?.slice(0, 10) || "");
  const [endDate, setEndDate] = useState(banner?.end_date?.slice(0, 10) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!imageUrl.trim()) {
      setError("La imagen es obligatoria.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        title: title.trim() || null,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || null,
        position: Number(position) || 1,
        startDate: startDate || null,
        endDate: endDate || null,
      };
      if (isEdit) {
        await contentService.updateBanner(banner.id, payload);
      } else {
        await contentService.createBanner(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos guardar el banner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Editar banner" : "Nuevo banner"}</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} disabled={isEdit}>
              <option value="MAIN_BANNER">Banner principal (Hero del Home)</option>
              <option value="CAROUSEL">Carrusel</option>
            </select>
          </div>

          <div className={styles.modalField}>
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <ImageUploadField label="Imagen" value={imageUrl} onChange={setImageUrl} previewClassName={styles.preview} />

          <div className={styles.modalField}>
            <label>Enlace al hacer clic (opcional)</label>
            <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/productos" />
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Posición</label>
              <input
                type="number"
                min="1"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Vigente desde (opcional)</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className={styles.modalField}>
              <label>Vigente hasta (opcional)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear banner"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BannersTab;
