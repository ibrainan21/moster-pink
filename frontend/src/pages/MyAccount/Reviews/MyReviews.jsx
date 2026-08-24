import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Trash2, MessageSquareText } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import reviewService from "../../../services/review.service";
import styles from "./MyReviews.module.css";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

/**
 * MyReviews
 * /mi-cuenta/resenas. Lista las opiniones que el usuario ha publicado
 * (GET /api/reviews/mine) y permite eliminarlas (DELETE /api/reviews/:id
 * -- el backend ya valida que solo el dueño o un Administrador puedan
 * borrarlas). No hay edición: el backend no expone un PATCH de contenido
 * para reseñas del propio cliente, solo moderación (is_approved).
 */
function MyReviews() {
  const [tick, setTick] = useState(0);
  const { data: reviews, loading, error } = useFetch(
    (signal) => reviewService.listMine(signal),
    [tick]
  );

  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const handleRemove = async (reviewId) => {
    if (!window.confirm("¿Eliminar esta opinión?")) return;
    setActionError("");
    setBusyId(reviewId);
    try {
      await reviewService.remove(reviewId);
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar tu opinión.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2 className={styles.title}>Mis opiniones</h2>

      {loading && <p className={styles.state}>Cargando tus opiniones...</p>}
      {error && <p className={styles.state}>No pudimos cargar tus opiniones.</p>}
      {actionError && <p className={styles.error}>{actionError}</p>}

      {!loading && !error && reviews?.length === 0 && (
        <div className={styles.empty}>
          <MessageSquareText size={40} color="#ff5c93" />
          <p>Todavía no has publicado ninguna opinión.</p>
          <p className={styles.emptyHint}>
            Puedes opinar sobre un producto desde el detalle de un pedido ya pagado.
          </p>
          <Link to="/mi-cuenta/pedidos" className={styles.shopLink}>
            Ver mis pedidos →
          </Link>
        </div>
      )}

      {reviews?.length > 0 && (
        <div className={styles.list}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <Link to={`/productos/${review.slug}`} className={styles.productName}>
                  {review.product_name}
                </Link>
                <button
                  type="button"
                  className={styles.removeButton}
                  disabled={busyId === review.id}
                  onClick={() => handleRemove(review.id)}
                  aria-label="Eliminar opinión"
                  title="Eliminar opinión"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    size={16}
                    fill={value <= review.rating ? "#ff5c93" : "none"}
                    color={value <= review.rating ? "#ff5c93" : "#d9d0d5"}
                  />
                ))}
              </div>

              {review.comment && <p className={styles.comment}>{review.comment}</p>}

              <div className={styles.cardFooter}>
                <span className={styles.date}>{formatDate(review.created_at)}</span>
                {!review.is_approved && (
                  <span className={styles.pendingTag}>En revisión</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReviews;
