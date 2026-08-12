import { Heart, ShoppingCart } from "lucide-react";
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
  const { name, price, is_new: isNew, is_featured: isFeatured, main_image: image } = product;

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

        {/* TODO: conectar con GET /api/reviews/product/:id (ya existe en el
            backend, con promedio y total) cuando se agregue esa llamada
            aquí. Por ahora no se muestra una calificación inventada. */}

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
