import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import favoriteService from "../../../services/favorite.service";
import styles from "./MyFavorites.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

/**
 * MyFavorites
 * /mi-cuenta/favoritos (RF-035). Los favoritos son por producto (no por
 * variante), así que aquí no se puede "agregar directo al carrito" -- eso
 * requiere elegir talla/color en la ficha del producto (ver CartContext:
 * addItem pide variantId). El botón lleva a la ficha real.
 */
function MyFavorites() {
  const [tick, setTick] = useState(0);
  const { data: favorites, loading, error } = useFetch(
    (signal) => favoriteService.list(signal),
    [tick]
  );

  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const handleRemove = async (productId) => {
    setActionError("");
    setBusyId(productId);
    try {
      await favoriteService.remove(productId);
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos quitar este producto de tus favoritos.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2 className={styles.title}>Mis favoritos</h2>

      {loading && <p className={styles.state}>Cargando tus favoritos...</p>}
      {error && <p className={styles.state}>No pudimos cargar tus favoritos.</p>}
      {actionError && <p className={styles.error}>{actionError}</p>}

      {!loading && !error && favorites?.length === 0 && (
        <div className={styles.empty}>
          <Heart size={40} color="#ff5c93" />
          <p>Todavía no tienes productos favoritos.</p>
          <Link to="/productos" className={styles.shopLink}>
            Ver productos →
          </Link>
        </div>
      )}

      {favorites?.length > 0 && (
        <div className={styles.grid}>
          {favorites.map((fav) => (
            <div key={fav.id} className={styles.card}>
              <button
                type="button"
                className={styles.removeButton}
                disabled={busyId === fav.product_id}
                onClick={() => handleRemove(fav.product_id)}
                aria-label="Quitar de favoritos"
                title="Quitar de favoritos"
              >
                <Heart size={16} fill="#ff5c93" color="#ff5c93" />
              </button>

              <Link to={`/productos/${fav.slug}`} className={styles.imageWrapper}>
                {fav.image ? (
                  <img src={fav.image} alt={fav.name} className={styles.image} />
                ) : (
                  <div className={styles.imagePlaceholder}>Sin imagen</div>
                )}
              </Link>

              <div className={styles.info}>
                <Link to={`/productos/${fav.slug}`} className={styles.name}>
                  {fav.name}
                </Link>
                <p className={styles.price}>{formatPrice(fav.price)}</p>

                {fav.status !== "ACTIVE" && (
                  <p className={styles.unavailable}>Ya no disponible</p>
                )}

                <Link to={`/productos/${fav.slug}`} className={styles.viewButton}>
                  <ShoppingBag size={14} /> Ver producto
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyFavorites;
