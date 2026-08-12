import { useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import productAdminService from "../../../services/product.admin.service";
import styles from "./ImagesSection.module.css";

/**
 * ImagesSection
 * POST /api/products/:id/images (multipart, campo "image") y
 * DELETE /api/products/:id/images/:imageId. La subida real depende de que
 * el backend tenga configuradas las credenciales de Cloudinary
 * (ver utils/cloudinaryUpload.js) — si no, este mismo formulario mostrará
 * el error que el backend regrese.
 */
function ImagesSection({ productId, images, onChange }) {
  const fileInputRef = useRef(null);
  const [isMain, setIsMain] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      await productAdminService.uploadImage(productId, file, { isMain });
      setIsMain(false);
      onChange();
    } catch (err) {
      setError(err.message || "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (imageId) => {
    setError("");
    setRemovingId(imageId);
    try {
      await productAdminService.removeImage(productId, imageId);
      onChange();
    } catch (err) {
      setError(err.message || "No pudimos eliminar la imagen.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className={styles.section}>
      <h2>Imágenes</h2>

      {error && <p className={styles.error}>{error}</p>}

      {images?.length > 0 && (
        <div className={styles.grid}>
          {images.map((img) => (
            <div key={img.id} className={styles.imageCard}>
              <img src={img.image_url} alt={img.alt_text || ""} />
              {Boolean(img.is_main) && <span className={styles.mainBadge}>Principal</span>}
              <button
                type="button"
                className={styles.removeButton}
                disabled={removingId === img.id}
                onClick={() => handleRemove(img.id)}
                aria-label="Eliminar imagen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.uploadRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isMain}
            onChange={(e) => setIsMain(e.target.checked)}
          />
          Marcar como imagen principal
        </label>

        <label className={styles.uploadButton}>
          <Upload size={14} />
          {uploading ? "Subiendo..." : "Subir imagen"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            hidden
          />
        </label>
      </div>
    </div>
  );
}

export default ImagesSection;
