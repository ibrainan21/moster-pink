import { Link } from "react-router-dom";
import CategoryCard from "../CategoryCard/CategoryCard";
import useFetch from "../../hooks/useFetch";
import categoryService from "../../services/category.service";
import styles from "./Categories.module.css";

/**
 * Categories
 * Sección "Nuestras categorías" del Home, conectada a GET /api/categories
 * (categorías reales, solo las activas -> onlyActive=true).
 */
function Categories() {
  const { data: categories, loading, error } = useFetch(
    (signal) => categoryService.list(true, signal),
    []
  );

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Nuestras categorías</h2>
        <p className={styles.state}>Cargando categorías...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Nuestras categorías</h2>
        <p className={styles.state}>
          No pudimos cargar las categorías en este momento.
        </p>
      </section>
    );
  }

  if (!categories?.length) {
    // No es un error: simplemente todavía no hay categorías activas
    // registradas en el panel administrativo.
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Nuestras categorías</h2>

      <div className={styles.grid}>
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/categorias/${category.slug}`}
            className={styles.link}
          >
            <CategoryCard image={category.image_url} title={category.name} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Categories;
