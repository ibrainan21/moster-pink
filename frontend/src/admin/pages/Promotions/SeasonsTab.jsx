import { useState } from "react";
import { Plus, Pencil, Trash2, Power, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import promotionService from "../../../services/promotion.service";
import ProductPicker from "./ProductPicker";
import styles from "./AdminPromotions.module.css";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });

function SeasonsTab() {
  const [reloadToken, setReloadToken] = useState(0);
  const [modalSeason, setModalSeason] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const { data: seasons, loading, error } = useFetch(
    (signal) => promotionService.listSeasons(false, signal),
    [reloadToken]
  );

  const handleToggleActive = async (season) => {
    setActionError("");
    setBusyId(season.id);
    try {
      await promotionService.setSeasonActive(season.id, !season.is_active);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado de la temporada.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (season) => {
    if (!window.confirm(`¿Eliminar la temporada "${season.name}"?`)) return;
    setActionError("");
    setBusyId(season.id);
    try {
      await promotionService.removeSeason(season.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar la temporada.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className={styles.tabHeader}>
        <button type="button" className={styles.newButton} onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nueva temporada
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.state}>Cargando temporadas...</p>}
      {error && <p className={styles.state}>No pudimos cargar las temporadas.</p>}
      {!loading && !error && seasons?.length === 0 && (
        <p className={styles.state}>Todavía no hay temporadas. Crea la primera arriba.</p>
      )}

      {!loading && seasons?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.id}>
                  <td className={styles.nameCell}>{season.name}</td>
                  <td className={styles.muted}>
                    {formatDate(season.start_date)} – {formatDate(season.end_date)}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        season.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {season.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => setModalSeason(season)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title={season.is_active ? "Desactivar" : "Activar"}
                        disabled={busyId === season.id}
                        onClick={() => handleToggleActive(season)}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        className={styles.deleteAction}
                        disabled={busyId === season.id}
                        onClick={() => handleDelete(season)}
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

      {(showNew || modalSeason) && (
        <SeasonModal
          seasonId={modalSeason?.id}
          onClose={() => {
            setShowNew(false);
            setModalSeason(null);
          }}
          onSuccess={() => {
            setShowNew(false);
            setModalSeason(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function SeasonModal({ seasonId, onClose, onSuccess }) {
  const isEdit = Boolean(seasonId);

  // El listado no trae los productos de cada temporada (para no cargar de
  // más), así que al editar pedimos el detalle completo aparte.
  const { data: season, loading: loadingSeason } = useFetch(
    (signal) => (isEdit ? promotionService.getSeason(seasonId, signal) : Promise.resolve(null)),
    [seasonId]
  );

  return isEdit && loadingSeason ? (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <p className={styles.state}>Cargando temporada...</p>
      </div>
    </div>
  ) : (
    <SeasonForm season={season} onClose={onClose} onSuccess={onSuccess} />
  );
}

function SeasonForm({ season, onClose, onSuccess }) {
  const isEdit = Boolean(season?.id);

  const [name, setName] = useState(season?.name || "");
  const [description, setDescription] = useState(season?.description || "");
  const [bannerImage, setBannerImage] = useState(season?.banner_image || "");
  const [startDate, setStartDate] = useState(season?.start_date?.slice(0, 10) || "");
  const [endDate, setEndDate] = useState(season?.end_date?.slice(0, 10) || "");
  const [products, setProducts] = useState(
    season?.products?.map((p) => ({ id: p.id, name: p.name })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !startDate || !endDate) {
      setError("Nombre y fechas son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        bannerImage: bannerImage.trim() || null,
        startDate,
        endDate,
        productIds: products.map((p) => p.id),
      };
      if (isEdit) {
        await promotionService.updateSeason(season.id, payload);
      } else {
        await promotionService.createSeason(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos guardar la temporada.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Editar temporada" : "Nueva temporada"}</h2>
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

          <div className={styles.modalField}>
            <label>URL del banner (opcional)</label>
            <input
              type="text"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
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
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear temporada"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SeasonsTab;
