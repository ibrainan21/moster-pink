import { useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { SlidersHorizontal, Search, X } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import useFetch from "../../hooks/useFetch";
import productService from "../../services/product.service";
import categoryService from "../../services/category.service";
import styles from "./Products.module.css";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

/**
 * Products
 * Catálogo público (CU-004). Cubre dos rutas:
 *   - /productos            -> catálogo completo, con filtros opcionales
 *   - /categorias/:slug     -> catálogo filtrado a una categoría fija
 *
 * Filtros que soporta el backend (ver product.service.js del backend):
 * categoryId, search, minPrice, maxPrice, isNew, isFeatured, page, limit.
 * El orden por precio se resuelve en el cliente porque el backend siempre
 * ordena por p.created_at DESC (ver product.repository.js) y no expone un
 * parámetro de "sort" todavía.
 */
function Products() {
  const { slug: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(searchParams.get("buscar") || "");
  const [page, setPage] = useState(1);

  const search = searchParams.get("buscar") || "";
  const sort = searchParams.get("orden") || "recent";
  const selectedCategoryId = searchParams.get("categoria") || "";

  // Si venimos de /categorias/:slug, resolvemos primero el id real de la
  // categoría (el backend filtra productos por categoryId, no por slug).
  const { data: categoryFromSlug, loading: loadingCategorySlug } = useFetch(
    (signal) => (categorySlug ? categoryService.getBySlug(categorySlug, signal) : Promise.resolve(null)),
    [categorySlug]
  );

  const { data: categories } = useFetch((signal) => categoryService.list(true, signal), []);

  const activeCategoryId = categorySlug ? categoryFromSlug?.id : selectedCategoryId || undefined;

  // Reinicia la página cuando cambian los filtros (evita quedarse en una
  // página 3 vacía después de estrechar la búsqueda). Se ajusta durante el
  // render en vez de en un efecto, siguiendo el patrón recomendado por
  // React para "guardar información de renders anteriores" con useState.
  const filtersKey = `${search}|${selectedCategoryId}|${categorySlug}`;
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey);
    if (page !== 1) setPage(1);
  }

  const { data, loading, error } = useFetch(
    (signal) => {
      if (categorySlug && loadingCategorySlug) return new Promise(() => {}); // espera a resolver el slug
      return productService.list(
        {
          page,
          limit: PAGE_SIZE,
          categoryId: activeCategoryId,
          search: search || undefined,
        },
        signal
      );
    },
    [page, activeCategoryId, search, categorySlug, loadingCategorySlug]
  );

  const products = useMemo(() => {
    const rows = data?.rows || [];
    if (sort === "price_asc") return [...rows].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return [...rows].sort((a, b) => b.price - a.price);
    return rows;
  }, [data, sort]);

  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageTitle = categorySlug
    ? categoryFromSlug?.name || "Categoría"
    : "Nuestros productos";

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput) next.set("buscar", searchInput);
    else next.delete("buscar");
    setSearchParams(next);
  };

  const handleSortChange = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("orden", value);
    setSearchParams(next);
  };

  const handleCategoryChange = (categoryId) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId) next.set("categoria", categoryId);
    else next.delete("categoria");
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(search || selectedCategoryId);

  return (
    <div>
      <Header />

      <div className={styles.page}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{pageTitle}</h1>
          <p className={styles.count}>
            {loading ? "Cargando..." : `${total} producto${total === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className={styles.toolbar}>
          <form className={styles.search} onSubmit={handleSearchSubmit}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className={styles.clearSearch}
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setSearchInput("");
                  const next = new URLSearchParams(searchParams);
                  next.delete("buscar");
                  setSearchParams(next);
                }}
              >
                <X size={16} />
              </button>
            )}
          </form>

          {!categorySlug && (
            <select
              className={styles.select}
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          <div className={styles.sortWrapper}>
            <SlidersHorizontal size={16} />
            <select
              className={styles.select}
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {categorySlug && (
          <Link to="/productos" className={styles.backLink}>
            ← Ver todas las categorías
          </Link>
        )}

        {hasActiveFilters && !categorySlug && (
          <button type="button" className={styles.clearFilters} onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}

        {loading && <p className={styles.state}>Cargando productos...</p>}

        {error && (
          <p className={styles.state}>No pudimos cargar los productos en este momento.</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className={styles.state}>
            No encontramos productos con esos filtros. Intenta con otra búsqueda.
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <>
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

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
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
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Products;
