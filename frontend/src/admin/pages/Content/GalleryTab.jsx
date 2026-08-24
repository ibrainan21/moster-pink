import { useState } from "react";
import { Plus, Pencil, Trash2, Power, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import contentService from "../../../services/content.service";
import styles from "./AdminContent.module.css";

/**
 * GalleryTab
 * Administra la galería que alimenta "Síguenos en Instagram" en el Home
 * (components/InstagramGallery). `category` es texto libre (no hay un
 * catálogo fijo en el backend) para poder reutilizar la galería en otros
 * bloques del sitio más adelante si hace falta.
 */
function GalleryTab() {
  const [reloadToken, setReloadToken] = useState(0);
  const [modalItem, setModalItem] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const { data: items, loading, error } = useFetch(
    (signal) => contentService.listAllGallery(signal),
    [reloadToken]
  );

  const handleToggleActive = async (item) => {
    setActionError("");
    setBusyId(item.id);
    try {
      await contentService.setGalleryItemActive(item.id, !item.is_active);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado de la imagen.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("¿Eliminar esta imagen de la galería?")) return;
    setActionError("");
    setBusyId(item.id);
    try {
      await contentService.removeGalleryItem(item.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar la imagen.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <button type="button" className={styles.newButton} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nueva imagen
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.state}>Cargando galería...</p>}
      {error && <p className={styles.state}>No pudimos cargar la galería.</p>}
      {!loading && !error && items?.length === 0 && (
        <p className={styles.state}>Todavía no hay imágenes. Agrega la primera arriba.</p>
      )}

      {!loading && items?.length > 0 && (
        <div className={styles.galleryGrid}>
          {items.map((item) => (
            <div key={item.id} className={styles.galleryCard}>
              <img src={item.image_url} alt={item.title || ""} className={styles.galleryImage} />
              <div className={styles.galleryInfo}>
                <p className={styles.nameCell}>{item.title || "Sin título"}</p>
                {item.category && <p className={styles.muted}>{item.category}</p>}
                <span
                  className={`${styles.statusBadge} ${
                    item.is_active ? styles.statusActive : styles.statusInactive
                  }`}
                >
                  {item.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className={styles.actions}>
                <button type="button" title="Editar" onClick={() => setModalItem(item)}>
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  title={item.is_active ? "Desactivar" : "Activar"}
                  disabled={busyId === item.id}
                  onClick={() => handleToggleActive(item)}
                >
                  <Power size={16} />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  className={styles.deleteAction}
                  disabled={busyId === item.id}
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showNew || modalItem) && (
        <GalleryModal
          item={modalItem}
          onClose={() => {
            setShowNew(false);
            setModalItem(null);
          }}
          onSuccess={() => {
            setShowNew(false);
            setModalItem(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function GalleryModal({ item, onClose, onSuccess }) {
  const isEdit = Boolean(item?.id);

  const [title, setTitle] = useState(item?.title || "");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [category, setCategory] = useState(item?.category || "");
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0);
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
        title: title.trim() || null,
        imageUrl: imageUrl.trim(),
        category: category.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      };
      if (isEdit) {
        await contentService.updateGalleryItem(item.id, payload);
      } else {
        await contentService.createGalleryItem(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos guardar la imagen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Editar imagen" : "Nueva imagen"}</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>URL de la imagen</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              autoFocus
            />
            {imageUrl && <img src={imageUrl} alt="" className={styles.preview} />}
          </div>

          <div className={styles.modalField}>
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Categoría (opcional)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="instagram"
              />
            </div>
            <div className={styles.modalField}>
              <label>Orden</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar imagen"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default GalleryTab;
