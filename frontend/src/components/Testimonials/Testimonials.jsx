import { Star } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import reviewService from "../../services/review.service";
import styles from "./Testimonials.module.css";

/**
 * Testimonials
 * "Lo que dicen nuestros clientes", con reseñas REALES y aprobadas
 * (GET /api/reviews/recent). A propósito no se usan testimonios inventados
 * de relleno: si todavía no hay reseñas, la sección se oculta en vez de
 * mostrar contenido falso.
 */
function Testimonials() {
  const { data: reviews, loading } = useFetch(
    (signal) => reviewService.listRecent(6, signal),
    []
  );

  if (loading || !reviews?.length) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Lo que dicen nuestros clientes</h2>

      <div className={styles.grid}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.card}>
            <div className={styles.header}>
              <div className={styles.avatar}>{review.customer_name.charAt(0)}</div>
              <div>
                <p className={styles.name}>{review.customer_name}</p>
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
              </div>
            </div>
            <p className={styles.comment}>{review.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
