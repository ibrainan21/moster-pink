import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Power } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import productAdminService from "../../../services/product.admin.service";
import categoryService from "../../../services/category.service";
import styles from "./AdminProducts.module.css";

const PAGE_SIZE = 15;

const STATUS_LABELS = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  DISCONTINUED: "Descontinuado",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

/**
 * AdminProducts
 * /admin/productos — RF-006 a RF-009. Usa GET/PATCH/DELETE /api/products
 * reales (ver product.admin.service.js). El toggle activar/desactivar usa
 * PATCH /:id/status (ACTIVE <-> INACTIVE); "Eliminar" es el DELETE que en
 * el backend hace soft-delete (deleted_at), no borra el registro.
 */
function AdminProducts() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const { data: categories } = useFetch((signal) => categoryService.list(false, signal), []);

  const { data, loading, error } = useFetch(
    (signal) =>
      productAdminService.list(
        {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter || undefined,
          categoryId: categoryFilter || undefined,
        },
        signal
      ),
    [page, search, statusFilter, categoryFilter, reloadToken]
  );

  const products = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [prevFilters, setPrevFilters] = useState(`${search}|${statusFilter}|${categoryFilter}`);
  const filtersKey = `${search}|${statusFilter}|${categoryFilter}`;
  if (prevFilters !== filtersKey) {
    setPrevFilters(filtersKey);
    if (page !== 1) setPage(1);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleToggleStatus = async (product) => {
    setActionError("");
    setBusyId(product.id);
    try {
      const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await productAdminService.updateStatus(product.id, nextStatus);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado del producto.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    setActionError("");
    setBusyId(product.id);
    try {
      await productAdminService.remove(product.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar el producto.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Productos</h1>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => navigate("/admin/productos/nuevo")}
        >
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={handleSearchSubmit}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="DISCONTINUED">Descontinuado</option>
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}

      {loading && <p className={styles.state}>Cargando productos...</p>}
      {error && <p className={styles.state}>No pudimos cargar los productos.</p>}
      {!loading && !error && products.length === 0 && (
        <p className={styles.state}>No hay productos con esos filtros.</p>
      )}

      {!loading && products.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.main_image ? (
                      <img src={product.main_image} alt="" className={styles.thumb} />
                    ) : (
                      <div className={styles.thumbPlaceholder} />
                    )}
                  </td>
                  <td>
                    <Link to={`/admin/productos/${product.id}/editar`} className={styles.nameLink}>
                      {product.name}
                    </Link>
                  </td>
                  <td className={styles.muted}>{product.sku || "—"}</td>
                  <td className={styles.muted}>
                    {product.category}
                    {product.subcategory ? ` / ${product.subcategory}` : ""}
                  </td>
                  <td>{formatPrice(product.price)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        product.status === "ACTIVE" ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {STATUS_LABELS[product.status] || product.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => navigate(`/admin/productos/${product.id}/editar`)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title={product.status === "ACTIVE" ? "Desactivar" : "Activar"}
                        disabled={busyId === product.id || product.status === "DISCONTINUED"}
                        onClick={() => handleToggleStatus(product)}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        className={styles.deleteAction}
                        disabled={busyId === product.id}
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

export default AdminProducts;
