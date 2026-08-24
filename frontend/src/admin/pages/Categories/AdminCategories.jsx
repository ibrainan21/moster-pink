import { useState } from "react";
import { Plus, Pencil, Trash2, Power, ChevronDown, ChevronRight, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import categoryService from "../../../services/category.service";
import styles from "./AdminCategories.module.css";

/**
 * AdminCategories
 * /admin/categorias — RF-014 (categorías) y RF-015 (subcategorías).
 * Usa /api/categories tal cual expone category.routes.js: lectura pública,
 * escritura exclusiva de Administrador. El backend nunca borra físicamente
 * (soft-delete) y bloquea el borrado si la categoría todavía tiene
 * productos asociados (RN-009) — ese mensaje se muestra tal cual llega.
 */
function AdminCategories() {
  const [reloadToken, setReloadToken] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [modalCategory, setModalCategory] = useState(null); // null=cerrado, {}=nueva, {...}=editar
  const [showNewCategory, setShowNewCategory] = useState(false);

  const { data: categories, loading, error } = useFetch(
    (signal) => categoryService.list(false, signal),
    [reloadToken]
  );

  const handleToggleExpand = (id) => setExpandedId((current) => (current === id ? null : id));

  const handleToggleActive = async (category) => {
    setActionError("");
    setBusyId(category.id);
    try {
      await categoryService.setActive(category.id, !category.is_active);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado de la categoría.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`¿Eliminar "${category.name}"? Esta acción no se puede deshacer.`)) return;
    setActionError("");
    setBusyId(category.id);
    try {
      await categoryService.remove(category.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      // El backend responde 409 con un mensaje explicando cuántos productos
      // la tienen asociada cuando no se puede borrar — se muestra tal cual.
      setActionError(err.message || "No pudimos eliminar la categoría.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Categorías</h1>
        <button type="button" className={styles.newButton} onClick={() => setShowNewCategory(true)}>
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}

      {loading && <p className={styles.state}>Cargando categorías...</p>}
      {error && <p className={styles.state}>No pudimos cargar las categorías.</p>}
      {!loading && !error && categories?.length === 0 && (
        <p className={styles.state}>Todavía no hay categorías. Crea la primera arriba.</p>
      )}

      {!loading && categories?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Subcategorías</th>
                <th>Orden</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  expanded={expandedId === category.id}
                  busy={busyId === category.id}
                  onToggleExpand={() => handleToggleExpand(category.id)}
                  onEdit={() => setModalCategory(category)}
                  onToggleActive={() => handleToggleActive(category)}
                  onDelete={() => handleDelete(category)}
                  onSubcategoriesChanged={() => setReloadToken((t) => t + 1)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showNewCategory || modalCategory) && (
        <CategoryModal
          category={modalCategory}
          onClose={() => {
            setShowNewCategory(false);
            setModalCategory(null);
          }}
          onSuccess={() => {
            setShowNewCategory(false);
            setModalCategory(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function CategoryRow({
  category,
  expanded,
  busy,
  onToggleExpand,
  onEdit,
  onToggleActive,
  onDelete,
  onSubcategoriesChanged,
}) {
  return (
    <>
      <tr>
        <td>
          <button type="button" className={styles.expandButton} onClick={onToggleExpand}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className={styles.nameCell}>{category.name}</td>
        <td className={styles.muted}>{category.subcategory_count}</td>
        <td className={styles.muted}>{category.sort_order}</td>
        <td>
          <span
            className={`${styles.statusBadge} ${
              category.is_active ? styles.statusActive : styles.statusInactive
            }`}
          >
            {category.is_active ? "Activa" : "Inactiva"}
          </span>
        </td>
        <td>
          <div className={styles.actions}>
            <button type="button" title="Editar" onClick={onEdit}>
              <Pencil size={16} />
            </button>
            <button
              type="button"
              title={category.is_active ? "Desactivar" : "Activar"}
              disabled={busy}
              onClick={onToggleActive}
            >
              <Power size={16} />
            </button>
            <button
              type="button"
              title="Eliminar"
              className={styles.deleteAction}
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className={styles.subcategoryRow}>
            <SubcategoryPanel categoryId={category.id} onChanged={onSubcategoriesChanged} />
          </td>
        </tr>
      )}
    </>
  );
}

function SubcategoryPanel({ categoryId, onChanged }) {
  const [reloadToken, setReloadToken] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [modalSubcategory, setModalSubcategory] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const { data: subcategories, loading, error } = useFetch(
    (signal) => categoryService.listSubcategories(categoryId, false, signal),
    [categoryId, reloadToken]
  );

  const notify = () => {
    setReloadToken((t) => t + 1);
    onChanged();
  };

  const handleToggleActive = async (sub) => {
    setActionError("");
    setBusyId(sub.id);
    try {
      await categoryService.setSubcategoryActive(sub.id, !sub.is_active);
      notify();
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el estado de la subcategoría.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`¿Eliminar "${sub.name}"? Esta acción no se puede deshacer.`)) return;
    setActionError("");
    setBusyId(sub.id);
    try {
      await categoryService.removeSubcategory(sub.id);
      notify();
    } catch (err) {
      setActionError(err.message || "No pudimos eliminar la subcategoría.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.subcategoryPanel}>
      <div className={styles.subcategoryHeader}>
        <h3>Subcategorías</h3>
        <button type="button" className={styles.newSubButton} onClick={() => setShowNew(true)}>
          <Plus size={14} /> Nueva subcategoría
        </button>
      </div>

      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.state}>Cargando...</p>}
      {error && <p className={styles.state}>No pudimos cargar las subcategorías.</p>}
      {!loading && !error && subcategories?.length === 0 && (
        <p className={styles.state}>Esta categoría todavía no tiene subcategorías.</p>
      )}

      {!loading && subcategories?.length > 0 && (
        <ul className={styles.subList}>
          {subcategories.map((sub) => (
            <li key={sub.id} className={styles.subItem}>
              <span className={styles.subName}>{sub.name}</span>
              <span
                className={`${styles.statusBadge} ${
                  sub.is_active ? styles.statusActive : styles.statusInactive
                }`}
              >
                {sub.is_active ? "Activa" : "Inactiva"}
              </span>
              <div className={styles.actions}>
                <button type="button" title="Editar" onClick={() => setModalSubcategory(sub)}>
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  title={sub.is_active ? "Desactivar" : "Activar"}
                  disabled={busyId === sub.id}
                  onClick={() => handleToggleActive(sub)}
                >
                  <Power size={14} />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  className={styles.deleteAction}
                  disabled={busyId === sub.id}
                  onClick={() => handleDelete(sub)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(showNew || modalSubcategory) && (
        <SubcategoryModal
          categoryId={categoryId}
          subcategory={modalSubcategory}
          onClose={() => {
            setShowNew(false);
            setModalSubcategory(null);
          }}
          onSuccess={() => {
            setShowNew(false);
            setModalSubcategory(null);
            notify();
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSuccess }) {
  const isEdit = Boolean(category?.id);
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [imageUrl, setImageUrl] = useState(category?.image_url || "");
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      };
      if (isEdit) {
        await categoryService.update(category.id, payload);
      } else {
        await categoryService.create(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Editar categoría" : "Nueva categoría"}</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          <div className={styles.modalField}>
            <label>Descripción</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.modalField}>
            <label>URL de imagen</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>

          <div className={styles.modalField}>
            <label>Orden</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear categoría"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SubcategoryModal({ categoryId, subcategory, onClose, onSuccess }) {
  const isEdit = Boolean(subcategory?.id);
  const [name, setName] = useState(subcategory?.name || "");
  const [description, setDescription] = useState(subcategory?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null };
      if (isEdit) {
        await categoryService.updateSubcategory(subcategory.id, payload);
      } else {
        await categoryService.createSubcategory(categoryId, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "No pudimos guardar la subcategoría.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? "Editar subcategoría" : "Nueva subcategoría"}</h2>
          <button type="button" onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalField}>
            <label>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          <div className={styles.modalField}>
            <label>Descripción</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear subcategoría"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminCategories;
