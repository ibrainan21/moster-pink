import { Heart, ShoppingCart, Star } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import reviewService from "../../services/review.service";
import styles from "./ProductCard.module.css";

// Formatea números como precio en pesos mexicanos, ej. 399 -> "$399.00"
const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

/**
 * ProductCard
 * Tarjeta de producto para el catálogo/Home. Recibe el objeto "product" tal
 * como lo regresa GET /api/products (ver product.service.js): { id, name,
 * slug, price, is_new, is_featured, main_image, ... }.
 *
 * onAddToCart / onToggleFavorite son opcionales: por ahora el carrito y
 * favoritos todavía no están conectados en el frontend, así que si no se
 * pasan, el botón simplemente no hace nada visible más allá del feedback.
 */
function ProductCard({ product, onAddToCart, onToggleFavorite, onClick }) {
  const { id, name, price, is_new: isNew, is_featured: isFeatured, main_image: image } = product;

  // GET /api/reviews/product/:id (público, ya existía en el backend).
  // Si falla o el producto todavía no tiene reseñas aprobadas, simplemente
  // no se muestra nada de calificación — nunca se inventa un promedio.
  const { data: reviewsData } = useFetch(
    (signal) => reviewService.listByProduct(id, signal),
    [id]
  );
  const reviewCount = Number(reviewsData?.summary?.total || 0);
  const reviewAverage = Number(reviewsData?.summary?.average || 0);

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role={onClick ? "link" : undefined}
    >
      <div className={styles.imageWrapper}>
        {Boolean(isNew) && <span className={`${styles.badge} ${styles.badgeNew}`}>Nuevo</span>}
        {!isNew && Boolean(isFeatured) && (
          <span className={`${styles.badge} ${styles.badgeFeatured}`}>Más vendido</span>
        )}

        <button
          type="button"
          className={styles.favoriteButton}
          aria-label="Agregar a favoritos"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleFavorite?.(product);
          }}
        >
          <Heart size={18} />
        </button>

        {image ? (
          <img src={image} alt={name} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>Sin imagen</div>
        )}
      </div>

      <div className={styles.info}>
        <h3 className={styles.name}>{name}</h3>

        {reviewCount > 0 && (
          <div className={styles.rating}>
            <Star size={14} className={styles.starIcon} />
            <span>{reviewAverage.toFixed(1)}</span>
            <span className={styles.ratingCount}>({reviewCount})</span>
          </div>
        )}

        <p className={styles.price}>{formatPrice(price)}</p>

        <button
          type="button"
          className={styles.addButton}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAddToCart?.(product);
          }}
        >
          <ShoppingCart size={16} />
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
