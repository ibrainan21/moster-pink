import { useState } from "react";
import { Star, X } from "lucide-react";
import reviewService from "../../../services/review.service";
import styles from "./ReviewModal.module.css";

/**
 * ReviewModal
 * Se abre desde el detalle de un pedido (RF-036, CU-010) para opinar sobre
 * un producto de ESE pedido específico. El backend valida que el usuario
 * de verdad haya comprado ese producto en ese pedido (RN-030) y que no
 * exista ya una opinión para ese par producto/pedido (RN-031).
 */
function ReviewModal({ productName, productId, orderId, onClose, onCreated }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const review = await reviewService.create({
        productId,
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      onCreated(review);
    } catch (err) {
      setError(err.message || "No pudimos publicar tu opinión.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <h2 className={styles.title}>Opinar sobre {productName}</h2>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={styles.starButton}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${value} estrellas`}
              >
                <Star
                  size={28}
                  fill={value <= (hoverRating || rating) ? "#ff5c93" : "none"}
                  color={value <= (hoverRating || rating) ? "#ff5c93" : "#d9d0d5"}
                />
              </button>
            ))}
          </div>

          <textarea
            className={styles.textarea}
            placeholder="Cuéntanos qué te pareció (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button type="submit" className={styles.submitButton} disabled={saving}>
            {saving ? "Publicando..." : "Publicar opinión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
