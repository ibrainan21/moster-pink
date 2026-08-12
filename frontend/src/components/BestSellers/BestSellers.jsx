import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard/ProductCard";
import useFetch from "../../hooks/useFetch";
import productService from "../../services/product.service";
import styles from "./BestSellers.module.css";

/**
 * BestSellers
 * Sección "Productos más vendidos" del Home. Por ahora usa productos
 * destacados (is_featured, RF-009) como aproximación, ya que el backend
 * todavía no calcula "más vendidos" a partir de ventas reales (eso es
 * RF-043, parte del Dashboard administrativo).
 */
function BestSellers() {
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(
    (signal) => productService.listFeatured(4, signal),
    []
  );

  const products = data?.rows || [];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Productos más vendidos</h2>
        <Link to="/productos" className={styles.viewAll}>
          Ver todos →
        </Link>
      </div>

      {loading && <p className={styles.state}>Cargando productos...</p>}

      {error && (
        <p className={styles.state}>No pudimos cargar los productos en este momento.</p>
      )}

      {!loading && !error && !products.length && (
        <p className={styles.state}>
          Todavía no hay productos destacados. Márcalos desde el panel administrativo.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate(`/productos/${product.slug}`)}
              onAddToCart={() => navigate(`/productos/${product.slug}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default BestSellers;
