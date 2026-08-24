import { useState } from "react";
import { X, Search } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import productService from "../../../services/product.service";
import styles from "./ProductPicker.module.css";

/**
 * ProductPicker
 * Selector de productos por búsqueda + chips, usado tanto en el formulario
 * de Promociones como en el de Temporadas (ambos guardan un `productIds`
 * plano -- ver promotion.validation.js / season.repository.setProducts).
 * `selected` es un array de {id, name}.
 */
function ProductPicker({ selected, onChange }) {
  const [search, setSearch] = useState("");

  const { data } = useFetch(
    (signal) =>
      search.trim()
        ? productService.list({ search: search.trim(), limit: 8 }, signal)
        : Promise.resolve(null),
    [search]
  );

  const results = (data?.rows || []).filter((p) => !selected.some((s) => s.id === p.id));

  const addProduct = (product) => {
    onChange([...selected, { id: product.id, name: product.name }]);
    setSearch("");
  };

  const removeProduct = (productId) => {
    onChange(selected.filter((p) => p.id !== productId));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBox}>
        <Search size={14} />
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search.trim() && results.length > 0 && (
        <ul className={styles.results}>
          {results.map((product) => (
            <li key={product.id}>
              <button type="button" onClick={() => addProduct(product)}>
                {product.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className={styles.chips}>
          {selected.map((p) => (
            <span key={p.id} className={styles.chip}>
              {p.name}
              <button type="button" onClick={() => removeProduct(p.id)} aria-label="Quitar">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductPicker;
