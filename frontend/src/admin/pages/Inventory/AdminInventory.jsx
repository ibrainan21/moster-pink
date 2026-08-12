import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import inventoryService from "../../../services/inventory.service";
import productAdminService from "../../../services/product.admin.service";
import styles from "./AdminInventory.module.css";

const PAGE_SIZE = 15;
const TABS = [
  { key: "stock", label: "Stock" },
  { key: "alerts", label: "Alertas" },
  { key: "movements", label: "Movimientos" },
];

/**
 * AdminInventory
 * /admin/inventario — RF-017, RF-019 a RF-023. Usa GET /api/inventory,
 * /movements, /alerts, /summary y POST /api/inventory/adjustments
 * (ver inventory.service.js). El ajuste de stock es el mismo mecanismo
 * que se necesita para darle stock a la variante "Único" del Oso de
 * peluche: producto -> variante -> almacén -> cantidad -> IN/OUT -> motivo.
 */
function AdminInventory() {
  const [tab, setTab] = useState("stock");
  const [warehouseId, setWarehouseId] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const { data: warehouses } = useFetch(
    (signal) => inventoryService.listWarehouses(true, signal),
    []
  );

  const [prevWarehouses, setPrevWarehouses] = useState(null);
  if (warehouses && prevWarehouses !== warehouses) {
    setPrevWarehouses(warehouses);
    if (!warehouseId && warehouses.length) setWarehouseId(String(warehouses[0].id));
  }

  const { data: summary } = useFetch(
    (signal) => inventoryService.getSummary(signal),
    [reloadToken]
  );

  const [prevTabFilters, setPrevTabFilters] = useState(`${tab}|${warehouseId}`);
  const tabFiltersKey = `${tab}|${warehouseId}`;
  if (prevTabFilters !== tabFiltersKey) {
    setPrevTabFilters(tabFiltersKey);
    if (page !== 1) setPage(1);
  }

  const {
    data: stockData,
    loading: loadingStock,
    error: stockError,
  } = useFetch(
    (signal) =>
      tab === "stock"
        ? inventoryService.list(
            {
              page,
              limit: PAGE_SIZE,
              warehouseId: warehouseId || undefined,
              search: search || undefined,
              lowStockOnly: lowStockOnly || undefined,
            },
            signal
          )
        : Promise.resolve(null),
    [tab, page, warehouseId, search, lowStockOnly, reloadToken]
  );

  const {
    data: alertsData,
    loading: loadingAlerts,
    error: alertsError,
  } = useFetch(
    (signal) =>
      tab === "alerts"
        ? inventoryService.listAlerts(
            { page, limit: PAGE_SIZE, warehouseId: warehouseId || undefined, resolved: false },
            signal
          )
        : Promise.resolve(null),
    [tab, page, warehouseId, reloadToken]
  );

  const {
    data: movementsData,
    loading: loadingMovements,
    error: movementsError,
  } = useFetch(
    (signal) =>
      tab === "movements"
        ? inventoryService.listMovements(
            { page, limit: PAGE_SIZE, warehouseId: warehouseId || undefined },
            signal
          )
        : Promise.resolve(null),
    [tab, page, warehouseId, reloadToken]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleResolveAlert = async (id) => {
    try {
      await inventoryService.resolveAlert(id);
      setReloadToken((t) => t + 1);
    } catch {
      // el error se ve reflejado simplemente al no desaparecer la fila
    }
  };

  const activeData = tab === "stock" ? stockData : tab === "alerts" ? alertsData : movementsData;
  const loading = tab === "stock" ? loadingStock : tab === "alerts" ? loadingAlerts : loadingMovements;
  const activeError = tab === "stock" ? stockError : tab === "alerts" ? alertsError : movementsError;
  const rows = activeData?.rows || [];
  const total = activeData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Inventario</h1>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => setShowAdjustmentForm(true)}
        >
          <Plus size={16} /> Nuevo ajuste
        </button>
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{summary.outOfStock}</span>
            <span className={styles.summaryLabel}>Sin stock</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{summary.lowStock}</span>
            <span className={styles.summaryLabel}>Stock bajo</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{summary.activeAlerts}</span>
            <span className={styles.summaryLabel}>Alertas activas</span>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          {warehouses?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {tab === "stock" && (
          <>
            <form className={styles.search} onSubmit={handleSearchSubmit}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por producto o SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              Solo stock bajo
            </label>
          </>
        )}
      </div>

      {loading && <p className={styles.state}>Cargando...</p>}
      {activeError && <p className={styles.state}>No pudimos cargar la información.</p>}
      {!loading && !activeError && rows.length === 0 && (
        <p className={styles.state}>No hay registros para mostrar.</p>
      )}

      {!loading && tab === "stock" && rows.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Almacén</th>
                <th>Stock</th>
                <th>Reservado</th>
                <th>Disponible</th>
                <th>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.product_name}</td>
                  <td className={styles.muted}>
                    {r.sku} {[r.color, r.size].filter(Boolean).join(" / ")}
                  </td>
                  <td className={styles.muted}>{r.warehouse_name}</td>
                  <td>{r.stock}</td>
                  <td className={styles.muted}>{r.reserved_stock}</td>
                  <td className={r.available_stock <= r.min_stock ? styles.lowStock : ""}>
                    {r.available_stock}
                  </td>
                  <td className={styles.muted}>{r.min_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "alerts" && rows.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Almacén</th>
                <th>Stock actual</th>
                <th>Mínimo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.product_name}</td>
                  <td className={styles.muted}>{a.sku}</td>
                  <td className={styles.muted}>{a.warehouse_name}</td>
                  <td className={styles.lowStock}>{a.stock}</td>
                  <td className={styles.muted}>{a.min_stock}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.resolveButton}
                      onClick={() => handleResolveAlert(a.id)}
                    >
                      Marcar resuelta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "movements" && rows.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>SKU</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Almacén</th>
                <th>Por</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className={styles.muted}>
                    {new Date(m.created_at).toLocaleString("es-MX")}
                  </td>
                  <td>{m.product_name}</td>
                  <td className={styles.muted}>{m.sku}</td>
                  <td className={styles.muted}>{m.movement_type_name || m.movement_type}</td>
                  <td>{m.quantity}</td>
                  <td className={styles.muted}>{m.warehouse_name}</td>
                  <td className={styles.muted}>{m.created_by_name || "—"}</td>
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

      {showAdjustmentForm && (
        <AdjustmentModal
          warehouses={warehouses || []}
          defaultWarehouseId={warehouseId}
          onClose={() => setShowAdjustmentForm(false)}
          onSuccess={() => {
            setShowAdjustmentForm(false);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

/**
 * AdjustmentModal
 * Flujo de 2 pasos para no exigir escribir un variantId a mano: buscar
 * producto -> elegir variante -> almacén/cantidad/dirección/motivo ->
 * POST /api/inventory/adjustments.
 */
function AdjustmentModal({ warehouses, defaultWarehouseId, onClose, onSuccess }) {
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState(null);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [variants, setVariants] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [variantId, setVariantId] = useState("");
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId || "");
  const [quantity, setQuantity] = useState("1");
  const [direction, setDirection] = useState("IN");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleProductSearch = async (e) => {
    e.preventDefault();
    setSearchingProducts(true);
    setError("");
    try {
      const result = await productAdminService.list({ search: productSearch, limit: 10 });
      setProducts(result.rows || []);
    } catch (err) {
      setError(err.message || "No pudimos buscar productos.");
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleSelectProduct = async (productId) => {
    setSelectedProductId(productId);
    setVariantId("");
    setVariants(null);
    if (!productId) return;

    setLoadingVariants(true);
    try {
      const list = await productAdminService.listVariants(productId);
      setVariants(list);
    } catch (err) {
      setError(err.message || "No pudimos cargar las variantes de este producto.");
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!variantId) {
      setError("Selecciona una variante.");
      return;
    }

    setSaving(true);
    try {
      await inventoryService.createAdjustment({
        warehouseId: Number(warehouseId),
        variantId: Number(variantId),
        quantity: Number(quantity),
        direction,
        reason,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos registrar el ajuste.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Nuevo ajuste de inventario</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>1. Busca el producto</label>
            <div className={styles.inlineSearch}>
              <input
                type="text"
                placeholder="Nombre o SKU del producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => {
                  // Sin esto, Enter en un input dentro de un <form> dispara
                  // el submit del formulario del modal (handleSubmit), que
                  // no es lo que queremos aquí.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleProductSearch(e);
                  }
                }}
              />
              <button type="button" disabled={searchingProducts} onClick={handleProductSearch}>
                <Search size={14} />
              </button>
            </div>
          </div>

          {products && (
            <div className={styles.modalField}>
              <label>2. Selecciona el producto</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
              >
                <option value="">
                  {products.length ? "Selecciona..." : "Sin resultados"}
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedProductId && (
            <div className={styles.modalField}>
              <label>3. Selecciona la variante</label>
              {loadingVariants && <p className={styles.state}>Cargando variantes...</p>}
              {variants && variants.length === 0 && (
                <p className={styles.error}>
                  Este producto no tiene variantes todavía — créala primero desde Productos.
                </p>
              )}
              {variants && variants.length > 0 && (
                <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
                  <option value="">Selecciona...</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.sku} — {[v.color, v.size, v.material, v.capacity].filter(Boolean).join(" / ") || "Sin atributos"}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className={styles.modalGrid}>
            <div className={styles.modalField}>
              <label>Almacén</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
                <option value="">Selecciona...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalField}>
              <label>Dirección</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="IN">Entrada (IN)</option>
                <option value="OUT">Salida (OUT)</option>
              </select>
            </div>

            <div className={styles.modalField}>
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalField}>
            <label>Motivo *</label>
            <input
              type="text"
              required
              placeholder="Ej. Stock inicial de prueba"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving || !variantId}>
            {saving ? "Guardando..." : "Registrar ajuste"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminInventory;