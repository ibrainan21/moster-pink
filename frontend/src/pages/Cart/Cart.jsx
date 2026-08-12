import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useCart } from "../../context/CartContext";
import styles from "./Cart.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

/**
 * Cart
 * Ruta protegida /carrito (ver AppRouter.jsx, envuelta en <ProtectedRoute>).
 * Lee y modifica el carrito real a través de CartContext, que a su vez
 * habla con /api/cart (variantId, no productId — ver cart.service.js del
 * backend).
 */
function Cart() {
  const navigate = useNavigate();
  const { cart, loading, ensureLoaded, updateQuantity, removeItem, clear } = useCart();
  const [busyItemId, setBusyItemId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    ensureLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuantityChange = async (itemId, nextQuantity) => {
    if (nextQuantity < 1) return;
    setError("");
    setBusyItemId(itemId);
    try {
      await updateQuantity(itemId, nextQuantity);
    } catch (err) {
      setError(err.message || "No pudimos actualizar la cantidad.");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setError("");
    setBusyItemId(itemId);
    try {
      await removeItem(itemId);
    } catch (err) {
      setError(err.message || "No pudimos eliminar el producto.");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleClear = async () => {
    setError("");
    try {
      await clear();
    } catch (err) {
      setError(err.message || "No pudimos vaciar el carrito.");
    }
  };

  const items = cart.items || [];

  return (
    <div>
      <Header />

      <div className={styles.page}>
        <h1 className={styles.title}>Tu carrito</h1>

        {error && <p className={styles.error}>{error}</p>}

        {loading && !items.length && <p className={styles.state}>Cargando tu carrito...</p>}

        {!loading && items.length === 0 && (
          <div className={styles.empty}>
            <ShoppingBag size={40} color="#ff5c93" />
            <p>Tu carrito está vacío.</p>
            <Link to="/productos" className={styles.shopLink}>
              Ver productos →
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className={styles.layout}>
            <div className={styles.items}>
              {items.map((item) => {
                const variantLabel = [item.color, item.size, item.material, item.capacity]
                  .filter(Boolean)
                  .join(" / ");
                const isBusy = busyItemId === item.id;
                const stockExceeded = item.available_stock < item.quantity;

                return (
                  <div key={item.id} className={styles.item}>
                    {item.image ? (
                      <img src={item.image} alt={item.product_name} className={styles.itemImage} />
                    ) : (
                      <div className={styles.itemImagePlaceholder}>Sin imagen</div>
                    )}

                    <div className={styles.itemInfo}>
                      <Link to={`/productos/${item.slug}`} className={styles.itemName}>
                        {item.product_name}
                      </Link>
                      {variantLabel && <p className={styles.itemVariant}>{variantLabel}</p>}
                      <p className={styles.itemUnitPrice}>{formatPrice(item.unit_price)} c/u</p>

                      {stockExceeded && (
                        <p className={styles.itemWarning}>
                          Solo quedan {item.available_stock} disponibles.
                        </p>
                      )}
                    </div>

                    <div className={styles.itemQuantity}>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className={styles.itemSubtotal}>{formatPrice(item.subtotal)}</p>

                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={isBusy}
                      onClick={() => handleRemove(item.id)}
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}

              <button type="button" className={styles.clearButton} onClick={handleClear}>
                Vaciar carrito
              </button>
            </div>

            <div className={styles.summary}>
              <h2>Resumen</h2>
              <div className={styles.summaryRow}>
                <span>Productos ({cart.itemCount})</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <p className={styles.summaryNote}>El costo de envío se calcula en el pago.</p>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>

              <button
                type="button"
                className={styles.checkoutButton}
                onClick={() => navigate("/checkout")}
              >
                Proceder al pago
              </button>
              <Link to="/productos" className={styles.continueLink}>
                ← Seguir comprando
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Cart;
