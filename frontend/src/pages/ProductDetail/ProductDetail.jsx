import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, ShoppingCart, ChevronLeft, Star, Minus, Plus } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ProductCard from "../../components/ProductCard/ProductCard";
import useFetch from "../../hooks/useFetch";
import productService from "../../services/product.service";
import reviewService from "../../services/review.service";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import styles from "./ProductDetail.module.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

// Agrupa variantes por tipo de atributo presente (color, size, material,
// capacity) para pintar un selector por cada uno solo si aplica al
// producto (no todos los productos de un mini-Walmart tienen "talla").
function groupVariantAttributes(variants) {
  const attrs = { color: new Set(), size: new Set(), material: new Set(), capacity: new Set() };
  variants.forEach((v) => {
    if (v.color) attrs.color.add(v.color);
    if (v.size) attrs.size.add(v.size);
    if (v.material) attrs.material.add(v.material);
    if (v.capacity) attrs.capacity.add(v.capacity);
  });
  return attrs;
}

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: product, loading, error } = useFetch(
    (signal) => productService.getBySlug(slug, signal),
    [slug]
  );

  const { data: reviews } = useFetch(
    (signal) => (product ? reviewService.listByProduct(product.id, signal) : Promise.resolve([])),
    [product?.id]
  );

  // Reinicia la selección al cambiar de producto y precarga la primera
  // variante disponible. Ajustado durante el render (patrón recomendado
  // por React con useState) en vez de en efectos, para no encadenar
  // renders extra.
  const [prevSlug, setPrevSlug] = useState(slug);
  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setActiveImage(0);
    setAddedMessage("");
    setAddError("");
    setQuantity(1);
    setSelectedVariantId(null);
  }

  const [prevProductId, setPrevProductId] = useState(null);
  if (product && prevProductId !== product.id) {
    setPrevProductId(product.id);
    if (product.variants?.length) setSelectedVariantId(product.variants[0].id);
  }

  if (loading) {
    return (
      <div>
        <Header />
        <p className={styles.state}>Cargando producto...</p>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <Header />
        <div className={styles.notFound}>
          <p>No pudimos encontrar este producto.</p>
          <Link to="/productos" className={styles.backLink}>
            ← Volver al catálogo
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ image_url: product.main_image, alt_text: product.name }];

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const extraPrice = Number(selectedVariant?.additional_price || 0);
  const finalPrice = Number(product.price) + extraPrice;
  const outOfStock = selectedVariant && Number(selectedVariant.total_stock) <= 0;

  const attrs = groupVariantAttributes(product.variants || []);

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const hasVariants = Boolean(product.variants?.length);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/productos/${slug}` } } });
      return;
    }

    if (!hasVariants) return; // el botón ya está deshabilitado en este caso

    setAddError("");
    setAdding(true);
    try {
      await addItem(selectedVariantId, quantity);
      setAddedMessage("¡Producto agregado al carrito!");
      setTimeout(() => setAddedMessage(""), 3000);
    } catch (err) {
      setAddError(err.message || "No pudimos agregar el producto al carrito.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <Header />

      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          <ChevronLeft size={18} /> Volver
        </button>

        <div className={styles.layout}>
          <div className={styles.gallery}>
            <div className={styles.mainImageWrapper}>
              {images[activeImage]?.image_url ? (
                <img
                  src={images[activeImage].image_url}
                  alt={images[activeImage].alt_text || product.name}
                  className={styles.mainImage}
                />
              ) : (
                <div className={styles.imagePlaceholder}>Sin imagen</div>
              )}
            </div>

            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    type="button"
                    className={`${styles.thumbnail} ${i === activeImage ? styles.thumbnailActive : ""}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img.image_url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <p className={styles.category}>{product.category_name}</p>
            <h1 className={styles.name}>{product.name}</h1>

            {avgRating !== null && (
              <div className={styles.rating}>
                <Star size={16} fill="#ff5c93" color="#ff5c93" />
                <span>{avgRating.toFixed(1)}</span>
                <span className={styles.reviewCount}>
                  ({reviews.length} reseña{reviews.length === 1 ? "" : "s"})
                </span>
              </div>
            )}

            <p className={styles.price}>{formatPrice(finalPrice)}</p>

            {product.short_description && (
              <p className={styles.shortDescription}>{product.short_description}</p>
            )}

            {["color", "size", "material", "capacity"].map((attr) =>
              attrs[attr].size > 0 ? (
                <div key={attr} className={styles.variantGroup}>
                  <span className={styles.variantLabel}>
                    {{ color: "Color", size: "Talla", material: "Material", capacity: "Capacidad" }[attr]}
                  </span>
                  <div className={styles.variantOptions}>
                    {product.variants
                      .filter((v, i, arr) => arr.findIndex((x) => x[attr] === v[attr]) === i)
                      .filter((v) => v[attr])
                      .map((v) => (
                        <button
                          key={v[attr]}
                          type="button"
                          className={`${styles.variantOption} ${
                            selectedVariant?.[attr] === v[attr] ? styles.variantOptionActive : ""
                          }`}
                          onClick={() => setSelectedVariantId(v.id)}
                        >
                          {v[attr]}
                        </button>
                      ))}
                  </div>
                </div>
              ) : null
            )}

            {outOfStock && <p className={styles.outOfStock}>Agotado en esta variante.</p>}

            {!hasVariants && (
              <p className={styles.noVariants}>
                Este producto todavía no tiene variantes configuradas en el catálogo, así que
                no se puede agregar al carrito por el momento.
              </p>
            )}

            {hasVariants && (
              <div className={styles.quantityRow}>
                <span className={styles.variantLabel}>Cantidad</span>
                <div className={styles.quantityStepper}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={14} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddToCart}
                disabled={!hasVariants || outOfStock || adding}
              >
                <ShoppingCart size={18} />
                {adding ? "Agregando..." : "Agregar al carrito"}
              </button>
              <button type="button" className={styles.favoriteButton} aria-label="Agregar a favoritos">
                <Heart size={20} />
              </button>
            </div>

            {addedMessage && <p className={styles.addedMessage}>{addedMessage}</p>}
            {addError && <p className={styles.addError}>{addError}</p>}

            {product.description && (
              <div className={styles.description}>
                <h2>Descripción</h2>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {reviews?.length > 0 && (
          <section className={styles.reviews}>
            <h2>Reseñas de clientes</h2>
            <div className={styles.reviewList}>
              {reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewAuthor}>{review.customer_name}</span>
                    <span className={styles.reviewStars}>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {product.related?.length > 0 && (
          <section className={styles.related}>
            <h2>También te puede interesar</h2>
            <div className={styles.relatedGrid}>
              {product.related.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  onClick={() => navigate(`/productos/${rel.slug}`)}
                  onAddToCart={() => navigate(`/productos/${rel.slug}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default ProductDetail;
