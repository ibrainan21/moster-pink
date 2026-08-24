import { useState } from "react";
import { Search, Star, Eye, EyeOff, Trash2 } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import reviewService from "../../../services/review.service";
import { useAuth } from "../../../context/AuthContext";
import styles from "./AdminReviews.module.css";

const PAGE_SIZE = 20;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "—";

/**
 * AdminReviews
 * /admin/resenas — moderación de opiniones (GET /api/reviews con filtros,
 * PATCH /:id/approval, DELETE /:id). Las reseñas se auto-publican al
 * crearse (ver review.repository.js: is_approved = TRUE desde el INSERT),
 * así que esto no es una cola de aprobación previa -- es una herramienta
 * para ocultar o eliminar contenido inapropiado después de publicado.
 */
function AdminReviews() {
  const { user: currentUser } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const { data, loading, error } = useFetch(
    (signal) =>
      reviewService.listAll(
        {
          page,
          limit: PAGE_SIZE,
          rating: ratingFilter || undefined,
          isApproved: statusFilter || undefined,
          search: debouncedSearch.trim() || undefined,
        },
        signal
      ),
    [page, ratingFilter, statusFilter, debouncedSearch, reloadTick]
  );

  const reviews = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [prevFilters, setPrevFilters] = useState(`${ratingFilter}|${statusFilter}|${debouncedSearch}`);
  const filtersKey = `${ratingFilter}|${statusFilter}|${debouncedSearch}`;
  if (prevFilters !== filtersKey) {
    setPrevFilters(filtersKey);
    if (page !== 1) setPage(1);
  }

  const refresh = () => setReloadTick((t) => t + 1);

  const handleToggleApproved = async (review) => {
    setActionError("");
    try {
      await reviewService.setApproved(review.id, !review.is_approved);
      refresh();
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar la reseña.");
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm(`¿Eliminar la reseña de ${review.customer_name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setActionError("");
    try {
      await reviewService.remove(review.id);
      refresh();
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar la reseña.");
    }
  };

  const isAdmin = currentUser?.role_name === "Administrador";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Reseñas</h1>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o comentario..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="">Todas las calificaciones</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} estrella{r === 1 ? "" : "s"}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="true">Visibles</option>
          <option value="false">Ocultas</option>
        </select>
      </div>

      {actionError && <p className={styles.actionError}>{actionError}</p>}

      {loading && <p className={styles.state}>Cargando reseñas...</p>}
      {error && <p className={styles.state}>No pudimos cargar las reseñas.</p>}
      {!loading && !error && reviews.length === 0 && (
        <p className={styles.state}>No hay reseñas con esos filtros.</p>
      )}

      {!loading && reviews.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className={styles.row}>
                  <td>
                    <p className={styles.customerName}>{review.customer_name}</p>
                    <p className={styles.muted}>{review.customer_email}</p>
                  </td>
                  <td className={styles.productName}>{review.product_name}</td>
                  <td>
                    <div className={styles.stars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < review.rating ? "#ffb400" : "none"}
                          color="#ffb400"
                        />
                      ))}
                    </div>
                  </td>
                  <td className={styles.comment}>{review.comment || "—"}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        review.is_approved ? styles.statusVisible : styles.statusHidden
                      }`}
                    >
                      {review.is_approved ? "Visible" : "Oculta"}
                    </span>
                  </td>
                  <td className={styles.muted}>{formatDate(review.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      {isAdmin && (
                        <button
                          type="button"
                          className={`${styles.actionButton} ${
                            review.is_approved ? styles.hideButton : styles.showButton
                          }`}
                          title={review.is_approved ? "Ocultar reseña" : "Volver a mostrar"}
                          onClick={() => handleToggleApproved(review)}
                        >
                          {review.is_approved ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          className={styles.deleteButton}
                          title="Eliminar reseña"
                          onClick={() => handleDelete(review)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isAdmin && reviews.length > 0 && (
        <p className={styles.roleNote}>
          Solo el Administrador puede ocultar o eliminar reseñas. Tu rol permite consultarlas.
        </p>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
