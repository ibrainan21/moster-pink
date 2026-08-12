import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import productAdminService from "../../../services/product.admin.service";
import categoryService from "../../../services/category.service";
import VariantsSection from "./VariantsSection";
import ImagesSection from "./ImagesSection";
import styles from "./ProductForm.module.css";

const emptyForm = {
  categoryId: "",
  subcategoryId: "",
  name: "",
  sku: "",
  cost: "",
  price: "",
  shortDescription: "",
  description: "",
  isFeatured: false,
  isNew: false,
};

/**
 * ProductForm
 * /admin/productos/nuevo (crear) y /admin/productos/:id/editar (editar).
 * Usa POST/PUT /api/products (product.admin.service.js). Variantes e
 * imágenes solo se pueden gestionar una vez que el producto ya existe
 * (necesitan su id), así que esas secciones solo aparecen en modo edición.
 */
function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [reloadToken, setReloadToken] = useState(0);
  const {
    data: product,
    loading: loadingProduct,
    error: loadError,
  } = useFetch(
    (signal) => (isEditMode ? productAdminService.getById(id, signal) : Promise.resolve(null)),
    [id, reloadToken]
  );

  const { data: categories } = useFetch((signal) => categoryService.list(false, signal), []);

  const [form, setForm] = useState(emptyForm);
  const [subcategories, setSubcategories] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Precarga el formulario cuando llega el producto (modo edición).
  // Ajustado durante el render (no en un efecto) para no encadenar
  // renders extra, mismo patrón usado en Products.jsx / ProductDetail.jsx.
  const [prevProductId, setPrevProductId] = useState(null);
  if (product && prevProductId !== product.id) {
    setPrevProductId(product.id);
    setForm({
      categoryId: String(product.category_id),
      subcategoryId: product.subcategory_id ? String(product.subcategory_id) : "",
      name: product.name,
      sku: product.sku || "",
      cost: String(product.cost),
      price: String(product.price),
      shortDescription: product.short_description || "",
      description: product.description || "",
      isFeatured: Boolean(product.is_featured),
      isNew: Boolean(product.is_new),
    });
  }

  const loadSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories(null);
      return;
    }
    try {
      const list = await categoryService.listSubcategories(categoryId, false);
      setSubcategories(list);
    } catch {
      setSubcategories([]);
    }
  };

  // Carga subcategorías la primera vez que sabemos la categoría del
  // producto en edición, o cada vez que el usuario cambia de categoría.
  const [prevCategoryId, setPrevCategoryId] = useState(null);
  if (form.categoryId && prevCategoryId !== form.categoryId) {
    setPrevCategoryId(form.categoryId);
    loadSubcategories(form.categoryId);
  }

  const handleField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCategoryChange = (value) => {
    setForm((prev) => ({ ...prev, categoryId: value, subcategoryId: "" }));
  };

  const refreshProduct = () => setReloadToken((t) => t + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      categoryId: Number(form.categoryId),
      subcategoryId: form.subcategoryId ? Number(form.subcategoryId) : undefined,
      name: form.name,
      sku: form.sku || undefined,
      cost: Number(form.cost),
      price: Number(form.price),
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
    };

    try {
      if (isEditMode) {
        await productAdminService.update(id, payload);
        refreshProduct();
      } else {
        const created = await productAdminService.create(payload);
        navigate(`/admin/productos/${created.id}/editar`, { replace: true });
      }
    } catch (err) {
      setError(err.message || "No pudimos guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode && loadingProduct) {
    return <p className={styles.state}>Cargando producto...</p>;
  }

  if (isEditMode && (loadError || !product)) {
    return <p className={styles.state}>No pudimos cargar este producto.</p>;
  }

  return (
    <div className={styles.page}>
      <Link to="/admin/productos" className={styles.back}>
        <ChevronLeft size={16} /> Volver a productos
      </Link>

      <h1>{isEditMode ? `Editar: ${product.name}` : "Nuevo producto"}</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Categoría *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Subcategoría</label>
            <select
              value={form.subcategoryId}
              onChange={(e) => handleField("subcategoryId", e.target.value)}
              disabled={!subcategories?.length}
            >
              <option value="">Sin subcategoría</option>
              {subcategories?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label>Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => handleField("sku", e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Costo *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.cost}
              onChange={(e) => handleField("cost", e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Precio *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.price}
              onChange={(e) => handleField("price", e.target.value)}
            />
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label>Descripción corta</label>
            <input
              type="text"
              maxLength={500}
              value={form.shortDescription}
              onChange={(e) => handleField("shortDescription", e.target.value)}
            />
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label>Descripción</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
            />
          </div>

          <div className={styles.checkboxRow}>
            <label>
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => handleField("isFeatured", e.target.checked)}
              />
              Producto destacado
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => handleField("isNew", e.target.checked)}
              />
              Marcar como nuevo
            </label>
          </div>
        </div>

        <button type="submit" className={styles.saveButton} disabled={saving}>
          {saving ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear producto"}
        </button>
      </form>

      {isEditMode && (
        <>
          <VariantsSection productId={product.id} variants={product.variants} onChange={refreshProduct} />
          <ImagesSection productId={product.id} images={product.images} onChange={refreshProduct} />
        </>
      )}

      {!isEditMode && (
        <p className={styles.hint}>
          Guarda el producto primero — las variantes y las imágenes se agregan justo después,
          en esta misma pantalla.
        </p>
      )}
    </div>
  );
}

export default ProductForm;
